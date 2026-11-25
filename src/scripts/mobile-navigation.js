// Reuse the original navigation node (including member controls and saved count).
export function initMobileNavigation() {
  const header = document.getElementById('site-header');
  const nav = document.getElementById('site-nav');
  const toggle = header?.querySelector('.menu-toggle');
  const drawer = document.getElementById('mobile-navigation');
  const mount = drawer?.querySelector('[data-mobile-nav-mount]');
  const close = drawer?.querySelector('[data-mobile-nav-close]');
  if (!header || !nav || !toggle || !drawer || !mount || !close || typeof drawer.showModal !== 'function') return;
  const media = window.matchMedia('(max-width: 800px)');
  const position = document.createComment('desktop navigation position');
  nav.before(position);
  const restore = () => {
    if (nav.parentNode !== position.parentNode) position.after(nav);
    header.removeAttribute('data-drawer-open');
    document.documentElement.classList.remove('mobile-nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
  };
  const dismiss = () => {
    if (drawer.open) drawer.close();
    restore();
  };
  toggle.addEventListener('click', () => {
    if (!media.matches) return;
    if (drawer.open) { dismiss(); return; }
    mount.append(nav);
    try { drawer.showModal(); } catch { restore(); return; }
    header.setAttribute('data-drawer-open', '');
    document.documentElement.classList.add('mobile-nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation');
    close.focus({preventScroll: true});
  });
  close.addEventListener('click', dismiss);
  drawer.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
  drawer.addEventListener('close', () => { if (!drawer.open) restore(); });
  // Only dismiss for pointer sequences starting and ending on the backdrop.
  let backdropDown = false;
  const outside = event => {
    const rect = drawer.getBoundingClientRect();
    return event.target === drawer && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
  };
  drawer.addEventListener('pointerdown', event => { backdropDown = outside(event); });
  drawer.addEventListener('click', event => { if (backdropDown && outside(event)) dismiss(); backdropDown = false; });
  nav.addEventListener('click', event => {
    if (drawer.open && event.target instanceof Element && event.target.closest('a, [data-member-open]')) dismiss();
  });
  media.addEventListener('change', event => { if (!event.matches) dismiss(); });
  window.addEventListener('pagehide', dismiss);
  header.setAttribute('data-menu-ready', '');
  header.setAttribute('data-drawer-ready', '');
  toggle.setAttribute('aria-controls', drawer.id);
  toggle.setAttribute('aria-haspopup', 'dialog');
}
