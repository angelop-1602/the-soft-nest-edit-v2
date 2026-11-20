export function xmlEscape(value: string): string {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;'}[char] || char));
}
export function asAbsolute(url: string, site: string): string {
  return /^https:\/\//.test(url) ? url : new URL(url, site).href;
}
