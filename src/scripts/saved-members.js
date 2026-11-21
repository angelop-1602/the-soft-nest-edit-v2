/** Member saves for the static Astro storefront. Browser only; Supabase RLS owns access control. */
import { createClient } from '@supabase/supabase-js';

const browserKey = 'softnest-affiliate-saved-v2';
const pendingKey = 'softnest-pending-member-save';
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
function pendingRead() {
  try { const v = sessionStorage.getItem(pendingKey); return isSlug(v) ? v : null; }
  catch { return null; }
}
function pendingWrite(v) {
  try { sessionStorage.setItem(pendingKey, v); } catch { /* session storage blocked */ }
}
function pendingClear() {
  try { sessionStorage.removeItem(pendingKey); } catch { /* session storage blocked */ }
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
  document.dispatchEvent(new CustomEvent('softnest:saved', {detail: {
    ids: [...ids], mode, email: currentUser?.email || null,
    legacyCount: storedLocal().length, ready: isReady
  }}));
}
function showDialog() {
  if (!client) { say('Member sign-in has not been enabled. Saves still work on this device.'); return; }
  say('');
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
  if (pending) {
    const {error} = await client.from('saved_products').upsert({user_id: id, product_slug: pending}, {onConflict: 'user_id,product_slug'});
    if (!error) pendingClear();
    else say('Signed in, but the product could not be saved. Check the member database configuration.');
  }
  const {data, error} = await client.from('saved_products').select('product_slug').eq('user_id', id).order('saved_at', {ascending: false}).limit(100);
  if (mine !== revision) return;
  if (error) { say('Unable to load saved products. Please try again later.'); ids = new Set(); }
  else ids = new Set((data || []).map(record => record.product_slug).filter(isSlug));
  isReady = true;
  publish();
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
form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!client) return;
  const field = form.querySelector('input[type="email"]');
  const email = field?.value?.trim() || '';
  if (!email || !field.validity.valid) { say('Enter a valid email address.'); return; }
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  say('Sending your sign-in link…');
  const {error} = await client.auth.signInWithOtp({email, options: {emailRedirectTo: `${window.location.origin}/shop/saved/`, shouldCreateUser: true}});
  button.disabled = false;
  say(error ? `We couldn't send the email: ${error.message}` : 'Check your inbox for a sign-in link. Open it to finish signing in.');
});
document.addEventListener('softnest:request-saved', publish);
if (client) {
  client.auth.onAuthStateChange(() => { window.setTimeout(() => { void syncFromServer(); }, 0); });
}
void syncFromServer();
