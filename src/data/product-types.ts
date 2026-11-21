/** Item types are filters within rooms, not separate thin SEO landing pages. */
export const productTypes = [
  { slug: 'pillows-cushions', name: 'Pillows & Cushions' },
  { slug: 'throws-blankets', name: 'Throws & Blankets' },
  { slug: 'vases', name: 'Vases' },
  { slug: 'decor-accents', name: 'Decor Accents' },
  { slug: 'lighting', name: 'Lighting' },
  { slug: 'bedding', name: 'Bedding' },
  { slug: 'rugs-mats', name: 'Rugs & Mats' },
  { slug: 'storage-organization', name: 'Storage & Organization' },
  { slug: 'wall-decor', name: 'Wall Decor' },
  { slug: 'mirrors', name: 'Mirrors' },
  { slug: 'tableware', name: 'Tableware' },
  { slug: 'kitchen-essentials', name: 'Kitchen Essentials' },
  { slug: 'bathroom-accessories', name: 'Bathroom Accessories' },
  { slug: 'desk-accessories', name: 'Desk Accessories' },
  { slug: 'compact-furniture', name: 'Compact Furniture' },
  { slug: 'plants-planters', name: 'Plants & Planters' },
  { slug: 'other', name: 'Other' }
] as const;
export type ProductTypeName = (typeof productTypes)[number]['name'];
export const productTypeByName = (name?: string) => productTypes.find(type => type.name === name);
export const productTypeBySlug = (slug: string) => productTypes.find(type => type.slug === slug);
