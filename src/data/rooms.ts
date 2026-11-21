/** Customer-facing shopping rooms. Existing Journal/editorial categories remain unchanged. */
export const rooms = [
  {
    slug: 'living-room', name: 'Living Room', subtitle: 'Comfort, thoughtfully layered',
    description: 'Create a welcoming space with comfortable textiles, relaxed lighting, and details you will actually use.',
    suggestedTypes: ['Pillows & Cushions', 'Throws & Blankets', 'Vases', 'Lighting', 'Rugs & Mats', 'Wall Decor'],
    image: '/assets/editorial/living-room-1080.webp'
  },
  {
    slug: 'bedroom', name: 'Bedroom', subtitle: 'Soft layers and calmer nights',
    description: 'Refresh bedding, bedside lighting, and small decorative touches that help your bedroom feel restful.',
    suggestedTypes: ['Bedding', 'Pillows & Cushions', 'Throws & Blankets', 'Lighting', 'Vases', 'Storage & Organization'],
    image: '/assets/editorial/bedroom-1080.webp'
  },
  {
    slug: 'kitchen-dining', name: 'Kitchen & Dining', subtitle: 'Everyday gatherings, made lovely',
    description: 'Explore useful cooking and dining essentials, table accents, and practical storage ideas.',
    suggestedTypes: ['Tableware', 'Kitchen Essentials', 'Vases', 'Storage & Organization', 'Lighting', 'Decor Accents'],
    image: '/assets/editorial/kitchen-dining-1080.webp'
  },
  {
    slug: 'bathroom', name: 'Bathroom', subtitle: 'Simple, refreshing rituals',
    description: 'Find smart storage, useful accessories, and soft finishing touches for a calmer bathroom.',
    suggestedTypes: ['Bathroom Accessories', 'Storage & Organization', 'Mirrors', 'Lighting', 'Decor Accents'],
    image: '/assets/editorial/bathroom-1080.webp'
  },
  {
    slug: 'home-office', name: 'Home Office', subtitle: 'A little more focus and ease',
    description: 'Style a useful workspace with functional organizers, comfortable lighting, and restrained decor.',
    suggestedTypes: ['Desk Accessories', 'Storage & Organization', 'Lighting', 'Wall Decor', 'Plants & Planters'],
    image: '/assets/editorial/home-office-1080.webp'
  },
  {
    slug: 'entryway-hallway', name: 'Entryway & Hallway', subtitle: 'A thoughtful first impression',
    description: 'Make entrances and hallways practical and inviting with easy storage and carefully chosen accents.',
    suggestedTypes: ['Mirrors', 'Vases', 'Storage & Organization', 'Wall Decor', 'Decor Accents'],
    image: '/assets/editorial/entryway-hallway-1080.webp'
  },
  {
    slug: 'outdoor-balcony', name: 'Outdoor & Balcony', subtitle: 'A welcoming spot outside',
    description: 'Create a relaxing outdoor nook with small-scale lighting, planters, and practical finishing touches.',
    suggestedTypes: ['Plants & Planters', 'Lighting', 'Decor Accents', 'Rugs & Mats', 'Compact Furniture'],
    image: '/assets/editorial/outdoor-balcony-1080.webp'
  }
] as const;
export type RoomName = (typeof rooms)[number]['name'];
export const roomBySlug = (slug: string) => rooms.find(room => room.slug === slug);
export const roomByName = (name: string) => rooms.find(room => room.name === name);
