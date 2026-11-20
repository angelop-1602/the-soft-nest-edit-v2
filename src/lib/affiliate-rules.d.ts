export interface AffiliateCandidate {
  status: string;
  published: boolean;
  link_verified: boolean;
  affiliate_url: string;
  image?: string;
  image_rights_confirmed: boolean;
}
export function validAffiliateLink(input: unknown): boolean;
export function publishableProduct(data: AffiliateCandidate): boolean;
