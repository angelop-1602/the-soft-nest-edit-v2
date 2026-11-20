/** Strictly limit public recommendations to manually verified Amazon US Special Links. */
/** @param {unknown} input */
export function validAffiliateLink(input) {
  if (typeof input !== 'string') return false;
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    if (url.hostname === 'amzn.to') return /^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
    if (!['amazon.com', 'www.amazon.com'].includes(url.hostname)) return false;
    const isProduct = /\/(?:dp|gp\/product)\/[A-Z0-9]{10}(?:\/|$)/i.test(url.pathname);
    const tag = url.searchParams.get('tag');
    return isProduct && !!tag && /^[a-z0-9_-]{3,100}$/i.test(tag);
  } catch {return false;}
}
/** @param {{status:string;published:boolean;link_verified:boolean;affiliate_url:string;image?:string;image_rights_confirmed:boolean}} data */
export function publishableProduct(data) {
  if (data.status !== 'approved' || data.published !== true || data.link_verified !== true) return false;
  if (!validAffiliateLink(data.affiliate_url)) return false;
  if (data.image && (!data.image_rights_confirmed || !/^\/uploads\/[a-z0-9/_-]+\.(?:jpg|jpeg|png|webp|avif)$/i.test(data.image) || data.image.includes('..'))) return false;
  return true;
}
