export const categories = [
  { slug: 'living-room', name: 'Living Room', subtitle: 'Layers of comfort', photo: 'living-room' },
  { slug: 'bedroom', name: 'Bedroom', subtitle: 'Soft, restorative spaces', photo: 'bedroom' },
  { slug: 'small-spaces', name: 'Small Spaces', subtitle: 'Room to live beautifully', photo: 'journal' },
  { slug: 'home-organization', name: 'Home Organization', subtitle: 'Everything in its place', photo: 'organization' },
  { slug: 'lifestyle', name: 'Lifestyle', subtitle: 'Everyday rituals', photo: 'about' }
] as const;
export type CategoryName = (typeof categories)[number]['name'];
export const categoryName = (slug: string) => categories.find(c => c.slug === slug)?.name;
export const categorySlug = (name: string) => categories.find(c => c.name === name)?.slug ?? 'lifestyle';
