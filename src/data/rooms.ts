/** Customer-facing shopping rooms. Existing Journal/editorial categories remain unchanged. */
export const rooms = [
  {
    slug: 'living-room', name: 'Living Room', subtitle: 'Comfort, thoughtfully layered',
    description: 'Create a welcoming space with comfortable textiles, relaxed lighting, and details you will actually use.',
    suggestedTypes: ['Pillows & Cushions', 'Throws & Blankets', 'Vases', 'Lighting', 'Rugs & Mats', 'Wall Decor'],
    image: 'https://images.unsplash.com/photo-1722942631531-5b09fed44978?auto=format&fit=crop&w=940&q=78'
  },
  {
    slug: 'bedroom', name: 'Bedroom', subtitle: 'Soft layers and calmer nights',
    description: 'Refresh bedding, bedside lighting, and small decorative touches that help your bedroom feel restful.',
    suggestedTypes: ['Bedding', 'Pillows & Cushions', 'Throws & Blankets', 'Lighting', 'Vases', 'Storage & Organization'],
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=940&q=78'
  },
  {
    slug: 'kitchen-dining', name: 'Kitchen & Dining', subtitle: 'Everyday gatherings, made lovely',
    description: 'Explore useful cooking and dining essentials, table accents, and practical storage ideas.',
    suggestedTypes: ['Tableware', 'Kitchen Essentials', 'Vases', 'Storage & Organization', 'Lighting', 'Decor Accents'],
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=940&q=78'
  },
  {
    slug: 'bathroom', name: 'Bathroom', subtitle: 'Simple, refreshing rituals',
    description: 'Find smart storage, useful accessories, and soft finishing touches for a calmer bathroom.',
    suggestedTypes: ['Bathroom Accessories', 'Storage & Organization', 'Mirrors', 'Lighting', 'Decor Accents'],
    image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=940&q=78'
  },
  {
    slug: 'home-office', name: 'Home Office', subtitle: 'A little more focus and ease',
    description: 'Style a useful workspace with functional organizers, comfortable lighting, and restrained decor.',
    suggestedTypes: ['Desk Accessories', 'Storage & Organization', 'Lighting', 'Wall Decor', 'Plants & Planters'],
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=940&q=78'
  },
  {
    slug: 'entryway-hallway', name: 'Entryway & Hallway', subtitle: 'A thoughtful first impression',
    description: 'Make entrances and hallways practical and inviting with easy storage and carefully chosen accents.',
    suggestedTypes: ['Mirrors', 'Vases', 'Storage & Organization', 'Wall Decor', 'Decor Accents'],
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=940&q=78'
  },
  {
    slug: 'outdoor-balcony', name: 'Outdoor & Balcony', subtitle: 'A welcoming spot outside',
    description: 'Create a relaxing outdoor nook with small-scale lighting, planters, and practical finishing touches.',
    suggestedTypes: ['Plants & Planters', 'Lighting', 'Decor Accents', 'Rugs & Mats', 'Compact Furniture'],
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=940&q=78'
  }
] as const;
export type RoomName = (typeof rooms)[number]['name'];
export const roomBySlug = (slug: string) => rooms.find(room => room.slug === slug);
export const roomByName = (name: string) => rooms.find(room => room.name === name);
