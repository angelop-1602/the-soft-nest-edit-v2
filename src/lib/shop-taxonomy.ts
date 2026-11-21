import { rooms, roomByName } from '../data/rooms';
import type { RoomName } from '../data/rooms';
import { productTypeByName } from '../data/product-types';

/** Older records use editorial `category`. Only unambiguous room names get a fallback. */
export function roomsForProduct(data: { rooms?: readonly string[] | null; category?: string | null }): RoomName[] {
  const chosen = Array.isArray(data.rooms)
    ? [...new Set(data.rooms.filter((name): name is RoomName => !!roomByName(name)))]
    : [];
  if (chosen.length) return chosen;
  if (data.category === 'Living Room') return ['Living Room'];
  if (data.category === 'Bedroom') return ['Bedroom'];
  return [];
}
export function roomSlugsForProduct(data: { rooms?: readonly string[] | null; category?: string | null }): string[] {
  const selected = new Set(roomsForProduct(data));
  return rooms.filter(room => selected.has(room.name)).map(room => room.slug);
}
export function typeSlugForProduct(data: { product_type?: string }): string {
  return productTypeByName(data.product_type)?.slug ?? '';
}
export function roomProductCount<T extends {data: {rooms?: readonly string[] | null; category?: string | null}}>(products: readonly T[], name: string): number {
  return products.filter(p => roomsForProduct(p.data).includes(name as RoomName)).length;
}
