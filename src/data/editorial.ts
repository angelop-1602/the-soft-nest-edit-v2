// Locally optimized copies of the existing Journal photographs. Keep original URLs in the post metadata.
const journalPhotos: Record<string, string> = {
  '/photo-1722942631531-5b09fed44978': 'living-room',
  '/photo-1616594039964-ae9021a400a0': 'bedroom',
  '/photo-1600607687920-4e2a09cf159d': 'journal',
};

export function localJournalPhoto(source?: string) {
  if (!source?.startsWith('https://images.unsplash.com/')) return undefined;
  return journalPhotos[new URL(source).pathname];
}
