/** The Soft Nest Edit: optional newsletter + policy version acknowledgements.
 * Consent is captured after an email-link request succeeds and persisted to
 * a private Supabase RLS table only after authentication verifies the email.
 * No newsletter is sent by this module.
 */
const PENDING_KEY = 'softnest-member-consents-pending-v1';
const MAX_PENDING_MS = 60 * 60 * 1000;
const TERMS_VERSION = '2026-11-22';
const PRIVACY_VERSION = '2026-11-22';
const termsCheckbox = document.getElementById('member-terms-accept');
const newsletterCheckbox = document.getElementById('member-newsletter-opt-in');
const accountNewsletter = document.getElementById('member-newsletter-preference');
const accountStatus = document.getElementById('member-consent-status');
const legalPanel = document.getElementById('member-legal-review');
const legalCheckbox = document.getElementById('member-legal-review-check');
const legalButton = document.getElementById('member-legal-review-save');
let activeClient = null;
let activeUser = null;
let activeRow = null;
let refreshToken = 0;
let writing = false;

function status(value) {
  if (accountStatus) accountStatus.textContent = value;
}
function readIntent(email) {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const intent = JSON.parse(raw);
    if (!intent || intent.email !== email.toLowerCase() || intent.terms !== TERMS_VERSION ||
        intent.privacy !== PRIVACY_VERSION || intent.accepted !== true ||
        !Number.isFinite(intent.at) || intent.at > Date.now() ||
        Date.now() - intent.at > MAX_PENDING_MS) {
      if (intent?.at && Date.now() - intent.at > MAX_PENDING_MS) localStorage.removeItem(PENDING_KEY);
      return null;
    }
    return intent;
  } catch { return null; }
}
function clearIntent() {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* storage may be blocked */ }
}
function acceptedPolicy(row) {
  return row?.terms_version === TERMS_VERSION && row?.privacy_version === PRIVACY_VERSION &&
    Boolean(row?.terms_accepted_at && row?.privacy_acknowledged_at);
}
function showAccountState(row) {
  const accepted = acceptedPolicy(row);
  if (legalPanel) legalPanel.hidden = accepted;
  if (legalCheckbox) legalCheckbox.checked = false;
  if (accountNewsletter) {
    accountNewsletter.checked = !!row?.newsletter_opt_in;
    accountNewsletter.disabled = !activeUser || !row || writing;
  }
  status(!accepted
    ? 'Please review the current terms and privacy notice to record your acknowledgement.'
    : row?.newsletter_opt_in
      ? 'Newsletter preference: subscribed. Uncheck any time to opt out.'
      : 'Newsletter preference: not subscribed. You may opt in at any time.');
}

/** Called ONLY when Supabase accepts a sign-in email request. */
export function captureMemberConsentIntent(email) {
  const validEmail = typeof email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  if (!validEmail || !termsCheckbox?.checked) return;
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({
      email: email.trim().toLowerCase(), at: Date.now(), accepted: true,
      terms: TERMS_VERSION, privacy: PRIVACY_VERSION,
      newsletter: newsletterCheckbox?.checked === true
    }));
  } catch { /* user can confirm consent again in the Account dialog */ }
}

export async function syncMemberPreferences(client, user) {
  const run = ++refreshToken;
  activeClient = client;
  activeUser = user || null;
  activeRow = null;
  if (!client || !user?.id || !user?.email) {
    if (accountNewsletter) { accountNewsletter.checked = false; accountNewsletter.disabled = true; }
    if (legalPanel) legalPanel.hidden = true;
    status('');
    return;
  }
  if (accountNewsletter) accountNewsletter.disabled = true;
  status('Loading account preferences…');
  const email = user.email.trim().toLowerCase();
  const intent = readIntent(email);
  let {data: row, error} = await client.from('member_preferences').select('*')
    .eq('user_id', user.id).maybeSingle();
  if (run !== refreshToken) return;
  if (error) {
    if (legalPanel) legalPanel.hidden = true;
    status('Preferences unavailable. Set up the member_preferences table in Supabase. Sign-in and saved products are unaffected.');
    return;
  }
  if (intent) {
    // Never undo an earlier newsletter opt-in just because the checkbox was left blank on a new sign-in.
    const marketing = intent.newsletter || Boolean(row?.newsletter_opt_in);
    const record = {
      user_id: user.id, email,
      terms_version: TERMS_VERSION, privacy_version: PRIVACY_VERSION,
      newsletter_opt_in: marketing
    };
    const result = await client.from('member_preferences').upsert(record, {onConflict:'user_id'}).select('*').single();
    if (run !== refreshToken) return;
    if (result.error) {
      status('Signed in, but your agreement could not be recorded. Please confirm it in Account.');
    } else {
      row = result.data;
      clearIntent();
      if (termsCheckbox) termsCheckbox.checked = false;
      if (newsletterCheckbox) newsletterCheckbox.checked = false;
    }
  }
  activeRow = row;
  showAccountState(row);
}

accountNewsletter?.addEventListener('change', async () => {
  if (writing || !activeClient || !activeUser?.id || !activeRow) return;
  const desired = accountNewsletter.checked;
  writing = true;
  accountNewsletter.disabled = true;
  status('Saving your newsletter choice…');
  const {data: auth, error: authError} = await activeClient.auth.getUser();
  if (authError || auth?.user?.id !== activeUser.id) {
    accountNewsletter.checked = !desired;
    accountNewsletter.disabled = true;
    status('Your sign-in changed. Please sign in again.');
    writing = false;
    return;
  }
  const result = await activeClient.from('member_preferences').update({newsletter_opt_in: desired})
    .eq('user_id', activeUser.id).select('*').single();
  if (result.error) {
    accountNewsletter.checked = !desired;
    status('Could not update your newsletter preference. Try again.');
  } else {
    activeRow = result.data;
    showAccountState(activeRow);
  }
  writing = false;
  accountNewsletter.disabled = false;
});

legalButton?.addEventListener('click', async () => {
  if (writing || !legalCheckbox?.checked || !activeClient || !activeUser?.id || !activeUser?.email) return;
  writing = true;
  legalButton.disabled = true;
  status('Recording your agreement…');
  const {data: auth, error: authError} = await activeClient.auth.getUser();
  if (authError || auth?.user?.id !== activeUser.id) {
    status('Your sign-in changed. Please sign in again.');
    legalButton.disabled = false;
    writing = false;
    return;
  }
  const result = await activeClient.from('member_preferences').upsert({
    user_id: activeUser.id, email: activeUser.email.toLowerCase(),
    terms_version: TERMS_VERSION, privacy_version: PRIVACY_VERSION,
    newsletter_opt_in: Boolean(activeRow?.newsletter_opt_in)
  }, {onConflict:'user_id'}).select('*').single();
  writing = false;
  legalButton.disabled = false;
  if (result.error) { status('Could not record your acknowledgement. Please try again.'); return; }
  activeRow = result.data;
  showAccountState(activeRow);
});
