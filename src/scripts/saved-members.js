/** Member saves for the static Astro storefront. Browser only; Supabase RLS owns access control. */
import { createClient } from '@supabase/supabase-js';
import {captureMemberConsentIntent, syncMemberPreferences} from './member-consents.js';

const browserKey = 'softnest-affiliate-saved-v2';
const pendingKey = 'softnest-pending-member-saves-v3';
const isSlug = (v) => typeof v === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) && v.length <= 120;
const url = import.meta.env.PUBLIC_SUPABASE_URL;
const key = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const configured = !!(url && key && /^https:\/\/[a-z0-9.-]+\/?$/i.test(url));
const client = configured ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
const dialog = document.getElementById('member-dialog');
const form = document.getElementById('member-email-form');
const msg = document.getElementById('member-message');
const emailDisplay = document.getElementById('member-email');
const guestSection = document.getElementById('member-guest');
const memberSection = document.getElementById('member-signed-in');
const pendingHint = document.getElementById('member-pending-detail');
let currentUser = null;
let ids = new Set();
let isReady = false;
let revision = 0;

function storedLocal() {
  try {
    const values = JSON.parse(localStorage.getItem(browserKey) || '[]');
    return Array.isArray(values) ? [...new Set(values.filter(isSlug))].slice(0, 100) : [];
  } catch { return []; }
}
function localWrite(next) {
  try { localStorage.setItem(browserKey, JSON.stringify([...next])); }
  catch { say('Browser storage is unavailable; the change may not persist.'); }
}
/* softnest-member-continuity-v3
 * Product selection survives an email-link opening in another tab on the same origin.
 * Only public product slugs are stored. Supabase owns auth tokens and RLS enforcement.
 */
const legacyPendingKey = 'softnest-pending-member-save';
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;
function pendingRead() {
  const result = [];
  try {
    const raw = JSON.parse(localStorage.getItem(pendingKey) || 'null');
    if (raw && Array.isArray(raw.slugs) && typeof raw.createdAt === 'number' &&
      raw.createdAt <= Date.now() + 60_000 && Date.now() - raw.createdAt < PENDING_TTL_MS) {
      result.push(...raw.slugs.filter(isSlug));
    } else if (raw) {
      localStorage.removeItem(pendingKey); // expire stale selections
    }
  } catch { /* Browser storage may be restricted */ }
  // Import an older pending click stored in this tab by the previous version.
  try {
    const legacy = sessionStorage.getItem(legacyPendingKey);
    if (isSlug(legacy)) result.push(legacy);
  } catch { /* no legacy state */ }
  return [...new Set(result)].slice(0, 20);
}
function pendingWrite(slug) {
  if (!isSlug(slug)) return;
  try {
    const slugs = [...new Set([...pendingRead(), slug])].slice(-20);
    localStorage.setItem(pendingKey, JSON.stringify({ slugs, createdAt: Date.now() }));
    sessionStorage.removeItem(legacyPendingKey);
  } catch {
    // Same-tab fallback if localStorage has been disabled by the browser.
    try { sessionStorage.setItem(legacyPendingKey, slug); } catch { /* blocked */ }
  }
}
function pendingClear(done) {
  try {
    if (Array.isArray(done)) {
      const remaining = pendingRead().filter(slug => !done.includes(slug));
      if (remaining.length) localStorage.setItem(pendingKey, JSON.stringify({slugs: remaining, createdAt: Date.now()}));
      else localStorage.removeItem(pendingKey);
    } else localStorage.removeItem(pendingKey);
  } catch { /* storage unavailable */ }
  try { sessionStorage.removeItem(legacyPendingKey); } catch { /* storage unavailable */ }
}
function say(value) {
  if (msg) msg.textContent = value;
  const live = document.getElementById('member-live');
  if (live) live.textContent = value;
}
function publish() {
  const mode = !client ? 'local' : currentUser ? 'member' : 'guest';
  const active = new Set(ids);
  const count = document.getElementById('saved-count');
  if (count) count.textContent = String(active.size);
  document.querySelectorAll('[data-save]').forEach(button => {
    const on = active.has(button.dataset.save || '');
    button.setAttribute('aria-pressed', String(on));
    button.textContent = on ? '♥ Saved' : '♡ Save';
  });
  document.querySelectorAll('[data-member-open]').forEach(button => {
    button.hidden = !client;
    if (button.matches('.member-nav')) button.textContent = currentUser ? 'Account' : 'Sign in';
  });
  if (guestSection) guestSection.hidden = !!currentUser;
  if (memberSection) memberSection.hidden = !currentUser;
  if (emailDisplay) emailDisplay.textContent = currentUser?.email || 'Your account';
  if (currentUser && sentEmail) {
    clearEmailState();
    if (dialog?.open) dialog.close();
  } else {
    refreshEmailUI();
  }
  document.dispatchEvent(new CustomEvent('softnest:saved', {detail: {
    ids: [...ids], mode, email: currentUser?.email || null,
    legacyCount: storedLocal().length, ready: isReady
  }}));
}
function showDialog() {
  if (!client) { say('Member sign-in has not been enabled. Saves still work on this device.'); return; }
  say('');
  const queued = pendingRead();
  if (pendingHint) pendingHint.hidden = queued.length === 0 || !!currentUser;
  refreshEmailUI();
  if (dialog && !dialog.open) dialog.showModal();
  if (!currentUser) form?.querySelector('input[type="email"]')?.focus();
}

async function syncFromServer() {
  const mine = ++revision;
  if (!client) {
    ids = new Set(storedLocal());
    isReady = true;
    publish();
    return;
  }
  const {data: auth, error: authError} = await client.auth.getUser();
  if (mine !== revision) return;
  currentUser = authError ? null : auth.user;
  if (!currentUser) {
    ids = new Set();
    isReady = true;
    publish();
    return;
  }
  const id = currentUser.id;
  const pending = pendingRead();
  if (pending.length) {
    const {error} = await client.from('saved_products').upsert(
      pending.map(product_slug => ({user_id: id, product_slug})),
      {onConflict: 'user_id,product_slug'}
    );
    if (mine !== revision) return;
    if (!error) {
      pendingClear(pending);
      say(pending.length === 1 ? 'Your selected product was saved to your account.' : 'Your selected products were saved to your account.');
    } else {
      say('You are signed in, but the selected product could not be saved. Please try again from the Shop.');
    }
  }
  const {data, error} = await client.from('saved_products').select('product_slug').eq('user_id', id).order('saved_at', {ascending: false}).limit(100);
  if (mine !== revision) return;
  if (error) { say('Unable to load saved products. Please try again later.'); ids = new Set(); }
  else ids = new Set((data || []).map(record => record.product_slug).filter(isSlug));
  isReady = true;
  publish();
  void syncMemberPreferences(client, currentUser);
}

async function toggleSave(button) {
  const slug = button.dataset.save;
  if (!isSlug(slug)) return;
  if (!client) {
    const next = new Set(storedLocal());
    if (next.has(slug)) next.delete(slug); else next.add(slug);
    localWrite(next);
    ids = next;
    publish();
    return;
  }
  if (!isReady) await syncFromServer();
  if (!currentUser) {
    pendingWrite(slug);
    showDialog();
    return;
  }
  if (button.disabled) return;
  button.disabled = true;
  const had = ids.has(slug);
  const query = client.from('saved_products');
  const {error} = had
    ? await query.delete().eq('user_id', currentUser.id).eq('product_slug', slug)
    : await query.upsert({user_id: currentUser.id, product_slug: slug}, {onConflict: 'user_id,product_slug'});
  button.disabled = false;
  if (error) { say('Could not update your saved items. Please try again.'); return; }
  if (had) ids.delete(slug); else ids.add(slug);
  say(had ? 'Removed from saved products.' : 'Product saved to your account.');
  publish();
}

async function importLocalSaves(button) {
  if (!client || !currentUser || button.disabled) return;
  const slugs = storedLocal();
  if (!slugs.length) return;
  button.disabled = true;
  const records = slugs.map(product_slug => ({user_id: currentUser.id, product_slug}));
  const {error} = await client.from('saved_products').upsert(records, {onConflict:'user_id,product_slug'});
  button.disabled = false;
  if (error) { say('Import failed. Your browser-only saves have not been deleted.'); return; }
  localWrite(new Set());
  for (const slug of slugs) ids.add(slug);
  say(`${slugs.length} saved ${slugs.length === 1 ? 'find' : 'finds'} imported.`);
  publish();
}

document.addEventListener('click', event => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest('[data-save]');
  if (button) { event.preventDefault(); void toggleSave(button); return; }
  if (target.closest('[data-member-open]')) { event.preventDefault(); showDialog(); return; }
  if (target.closest('[data-member-close]')) { dialog?.close(); return; }
  const importButton = target.closest('[data-import-saved]');
  if (importButton) { void importLocalSaves(importButton); return; }
  if (target.closest('[data-member-signout]') && client) {
    void client.auth.signOut().then(({error}) => {
      if (error) { say('Unable to sign out. Please retry.'); return; }
      currentUser = null;
      ids.clear();
      pendingClear();
      dialog?.close();
      void syncFromServer();
    });
  }
});
/* softnest-member-email-flow-v2
 * This snippet replaces only the sign-in submit handler in saved-members.js.
 * Existing Supabase persistent auth, product saves and RLS queries stay intact.
 */
const EMAIL_COOLDOWN_MS = 60_000;
const emailSentStateKey = 'softnest-member-email-sent-v2';
const sentSection = document.getElementById('member-email-sent');
const sentAddress = document.getElementById('member-email-sent-to');
const resendButton = document.getElementById('member-resend-link');
const changeEmailButton = document.getElementById('member-change-email');
const emailInput = form?.querySelector('input[type="email"]');
const emailSubmit = form?.querySelector('button[type="submit"]');
const productionRedirect = dialog?.getAttribute('data-auth-redirect') || `${window.location.origin}/shop/saved/`;
let sentEmail = '';
let cooldownEmail = '';
let cooldownUntil = 0;
let editingEmail = false;
let sendingLink = false;
let cooldownTimer = null;
// softnest-auth-choices-v1: distinct passwordless account creation and returning sign-in.
const authButtons = Array.from(document.querySelectorAll('[data-auth-mode]'));
const authHelp = document.getElementById('member-auth-mode-help');
let authMode = 'signin';

function remainingSeconds() { return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)); }
function restoreEmailState() {
  try {
    const value = JSON.parse(sessionStorage.getItem(emailSentStateKey) || 'null');
    if (value && typeof value.email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.email) && Number.isFinite(value.until)) {
      sentEmail = value.email;
      cooldownEmail = value.email;
      cooldownUntil = value.until;
      authMode = value.mode === 'signup' ? 'signup' : 'signin';
    }
  } catch { /* Browsers may restrict session storage */ }
}
function saveEmailState() {
  try { sessionStorage.setItem(emailSentStateKey, JSON.stringify({email: sentEmail, until: cooldownUntil, mode: authMode})); }
  catch { /* In-memory countdown still works */ }
}
function stopCooldownTimer() {
  if (cooldownTimer !== null) { window.clearInterval(cooldownTimer); cooldownTimer = null; }
}
function refreshEmailUI() {
  authButtons.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.authMode === authMode)));
  if(authHelp) authHelp.textContent = authMode === 'signup'
    ? 'New here? Create your account with a secure email confirmation link. No password required.'
    : 'Already have an account? Enter your email for a secure sign-in link.';
  const showSent = !!sentEmail && !editingEmail && !currentUser;
  const remaining = remainingSeconds();
  if (form) form.hidden = showSent;
  if (sentSection) sentSection.hidden = !showSent;
  if (sentAddress) sentAddress.textContent = sentEmail;
  if (resendButton) {
    resendButton.disabled = sendingLink || !showSent || remaining > 0;
    resendButton.textContent = remaining ? `Resend link (${remaining}s)` : sendingLink ? 'Sending…' : 'Resend link';
  }
  if (emailSubmit) {
    const sameAddress = (emailInput?.value || '').trim().toLowerCase() === cooldownEmail.toLowerCase();
    emailSubmit.disabled = sendingLink || (sameAddress && remaining > 0);
    emailSubmit.textContent = sendingLink ? 'Sending…' : authMode === 'signup' ? 'Create account via email' : 'Send sign-in link';
  }
  if (remaining > 0 && cooldownTimer === null) cooldownTimer = window.setInterval(refreshEmailUI, 1000);
  if (remaining === 0) stopCooldownTimer();
}
function clearEmailState() {
  sentEmail = '';
  cooldownEmail = '';
  cooldownUntil = 0;
  editingEmail = false;
  try { sessionStorage.removeItem(emailSentStateKey); } catch { /* storage unavailable */ }
  refreshEmailUI();
}
async function sendSignInLink(email) {
  if (!client || currentUser || sendingLink) return;
  const normalized = email.trim().toLowerCase();
  if (normalized === cooldownEmail && remainingSeconds() > 0) {
    say(`You can request another link in ${remainingSeconds()} seconds.`);
    refreshEmailUI();
    return;
  }
  sendingLink = true;
  refreshEmailUI();
  say(authMode === 'signup' ? 'Sending your account confirmation link…' : 'Sending your sign-in link…');
  try {
    const {error} = await client.auth.signInWithOtp({
      email: normalized,
      options: {emailRedirectTo: productionRedirect, shouldCreateUser: authMode === 'signup'}
    });
    if (error) {
      say(`We couldn't send the email: ${error.message}`);
      return;
    }
    captureMemberConsentIntent(normalized);
    sentEmail = normalized;
    cooldownEmail = normalized;
    cooldownUntil = Date.now() + EMAIL_COOLDOWN_MS;
    editingEmail = false;
    saveEmailState();
    say(authMode === 'signup' ? 'Check your email for the account confirmation link. Also check Spam, Junk and Promotions.' : 'Check your email for a sign-in link. Also check Spam, Junk and Promotions.');
  } catch {
    say('The sign-in request failed. Check your connection and try again.');
  } finally {
    sendingLink = false;
    refreshEmailUI();
  }
}
form?.addEventListener('submit', event => {
  event.preventDefault();
  const email = emailInput?.value?.trim() || '';
  if (!emailInput || !emailInput.validity.valid || !email) {
    say('Enter a valid email address.');
    return;
  }
  void sendSignInLink(email);
});
resendButton?.addEventListener('click', () => {
  if (!sentEmail || remainingSeconds() > 0) return;
  void sendSignInLink(sentEmail);
});
changeEmailButton?.addEventListener('click', () => {
  editingEmail = true;
  refreshEmailUI();
  say('Enter another email address.');
  emailInput?.focus();
  emailInput?.select();
});
emailInput?.addEventListener('input', refreshEmailUI);
authButtons.forEach(button => button.addEventListener('click', () => {
  const selected=button.dataset.authMode;
  if(selected!=='signin' && selected!=='signup')return;
  if(sendingLink || selected===authMode)return;
  authMode=selected;
  sentEmail='';
  editingEmail=false;
  // Do not reset the same-email send cooldown when switching modes.
  authButtons.forEach(tab => tab.setAttribute('aria-pressed',String(tab.dataset.authMode===authMode)));
  if(authHelp) authHelp.textContent=authMode==='signup'
    ? 'New here? Create your account with a secure email confirmation link. No password required.'
    : 'Already have an account? Enter your email for a secure sign-in link.';
  say('');
  refreshEmailUI();
}));
restoreEmailState();
refreshEmailUI();
document.addEventListener('softnest:request-saved', publish);
/* Refresh authenticated state when returning to the original tab. Supabase also
 * synchronizes its own auth events; this is a defensive UI refresh only. */
let syncScheduled = false;
function scheduleMemberRefresh() {
  if (!client || syncScheduled) return;
  syncScheduled = true;
  window.setTimeout(() => {
    syncScheduled = false;
    void syncFromServer();
  }, 40);
}
const authChannel = client && typeof BroadcastChannel === 'function'
  ? new BroadcastChannel('softnest-member-auth-ui-v3') : null;
authChannel?.addEventListener('message', event => {
  if (event.data?.type === 'auth-changed') scheduleMemberRefresh();
});
window.addEventListener('focus', scheduleMemberRefresh);
window.addEventListener('pageshow', scheduleMemberRefresh);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') scheduleMemberRefresh();
});
window.addEventListener('storage', event => {
  if (event.key === pendingKey || event.key?.startsWith('sb-') && event.key?.endsWith('-auth-token')) {
    scheduleMemberRefresh();
  }
});
if (client) {
  client.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      authChannel?.postMessage({type: 'auth-changed'}); // never send credentials
    }
    scheduleMemberRefresh();
  });
}
void syncFromServer();
