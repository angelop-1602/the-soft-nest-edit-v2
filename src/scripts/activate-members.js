/**
 * Delay the Supabase / saved-products client until the page has finished loading.
 * A first click on Save / Sign in is intercepted and replayed only after the
 * original handlers are ready, so early interactions are not lost.
 */
let bootPromise;
let membersReady = false;

function bootMembers() {
  if (!bootPromise) {
    bootPromise = import('./saved-members.js').then(() => {
      membersReady = true;
    }).catch(error => {
      bootPromise = undefined;
      console.error('Unable to initialize saved products', error);
      throw error;
    });
  }
  return bootPromise;
}

// This listener must run before the handlers in saved-members.js.
document.addEventListener('click', event => {
  if (membersReady || !(event.target instanceof Element)) return;
  const control = event.target.closest('[data-save], [data-member-open]');
  if (!control || !('click' in control)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  void bootMembers().then(() => control.click()).catch(() => {
    const status = document.getElementById('member-message');
    if (status) status.textContent = 'Member features could not load. Please refresh and try again.';
  });
}, true);

// Warm up on hover/focus so keyboard and pointer activation feel immediate.
const maybeWarm = event => {
  if (event.target instanceof Element && event.target.closest('[data-save], [data-member-open]')) {
    void bootMembers().catch(() => {});
  }
};
document.addEventListener('pointerover', maybeWarm, { passive: true, capture: true });
document.addEventListener('focusin', maybeWarm, true);

function scheduleAfterPageLoad() {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => { void bootMembers().catch(() => {}); }, { timeout: 4500 });
  } else {
    window.setTimeout(() => { void bootMembers().catch(() => {}); }, 1200);
  }
}

// A passwordless auth callback and Saved page must initialize immediately.
const authCallback = /(?:[?#&])(?:code|access_token|refresh_token|token_hash)=/.test(window.location.href);
if (authCallback || window.location.pathname.startsWith('/shop/saved/')) {
  void bootMembers().catch(() => {});
} else if (document.readyState === 'complete') {
  scheduleAfterPageLoad();
} else {
  window.addEventListener('load', scheduleAfterPageLoad, { once: true });
}
