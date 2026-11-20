export const categories = [
  { slug: 'living-room', name: 'Living Room', subtitle: 'Layers of comfort', image: 'https://images.unsplash.com/photo-1722942631531-5b09fed44978?auto=format&fit=crop&w=940&q=78' },
  { slug: 'bedroom', name: 'Bedroom', subtitle: 'Soft, restorative spaces', image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=940&q=78' },
  { slug: 'small-spaces', name: 'Small Spaces', subtitle: 'Room to live beautifully', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=940&q=78' },
  { slug: 'home-organization', name: 'Home Organization', subtitle: 'Everything in its place', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=940&q=78' },
  { slug: 'lifestyle', name: 'Lifestyle', subtitle: 'Everyday rituals', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=940&q=78' }
] as const;
export type CategoryName = (typeof categories)[number]['name'];
export const categoryName = (slug: string) => categories.find(c => c.slug === slug)?.name;
export const categorySlug = (name: string) => categories.find(c => c.name === name)?.slug ?? 'lifestyle';
