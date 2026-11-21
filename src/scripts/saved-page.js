const dataEl = document.getElementById('saved-data');
const grid = document.getElementById('saved-grid');
const empty = document.getElementById('saved-empty');
const message = document.getElementById('saved-message');
const guest = document.getElementById('saved-login-gate');
const importBox = document.getElementById('saved-import-gate');
const localNotice = document.getElementById('saved-local-notice');
const products = dataEl ? JSON.parse(dataEl.textContent || '[]') : [];
const valid = new Map(products.map(p => [p.id, p]));
function renderSaved(state) {
  const {ids = [], mode = 'guest', legacyCount = 0, ready = false} = state || {};
  if (guest) guest.hidden = !ready || mode !== 'guest';
  if (importBox) importBox.hidden = !ready || mode !== 'member' || legacyCount === 0;
  if (localNotice) localNotice.hidden = !ready || mode !== 'local';
  if (grid) grid.replaceChildren();
  const active = [...new Set(ids)].filter(id => valid.has(id));
  for (const id of active) {
    const p = valid.get(id);
    if (!p || !grid) continue;
    const card = document.createElement('article'); card.className = 'product-card';
    const visual = document.createElement('a'); visual.className = 'product-visual'; visual.href = p.url; visual.setAttribute('aria-label', `Read about ${p.title}`);
    if (p.image) { const image = document.createElement('img'); image.src = p.image; image.alt = p.title; image.loading = 'lazy'; visual.append(image); }
    else { const placeholder = document.createElement('div'); placeholder.className = 'product-placeholder'; placeholder.setAttribute('aria-hidden','true'); const mark = document.createElement('span'); mark.textContent = '✳'; placeholder.append(mark); visual.append(placeholder); }
    const copy = document.createElement('div'); copy.className = 'product-copy';
    const label = document.createElement('span'); label.className = 'eyebrow'; label.textContent = p.category;
    const heading = document.createElement('h3'); const link = document.createElement('a'); link.href = p.url; link.textContent = p.title; heading.append(link);
    const summary = document.createElement('p'); summary.textContent = p.summary;
    const actions = document.createElement('div'); actions.className = 'product-actions';
    const details = document.createElement('a'); details.className = 'text-link'; details.href = p.url; details.textContent = 'View details ↗';
    const save = document.createElement('button'); save.type = 'button'; save.className = 'save-button'; save.dataset.save = id;
    save.textContent = '♥ Saved'; save.setAttribute('aria-pressed','true'); save.setAttribute('aria-label', `Remove ${p.title} from saved finds`);
    actions.append(details, save); copy.append(label, heading, summary, actions); card.append(visual, copy); grid.append(card);
  }
  if (empty) empty.hidden = !ready || mode === 'guest' || active.length !== 0;
  if (message) message.textContent = !ready ? 'Loading saved products…' : mode === 'guest' ? 'Sign in to see your saved products.' : `${active.length} saved ${active.length === 1 ? 'find' : 'finds'}`;
}
document.addEventListener('softnest:saved', event => renderSaved(event.detail));
document.dispatchEvent(new Event('softnest:request-saved'));
