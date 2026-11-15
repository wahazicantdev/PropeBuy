// All photos of a product, cover first. Older products and demo data
// only have imageUrl, so fall back to that single photo.
export const productPhotos = (p) =>
  p?.images?.length ? p.images : p?.imageUrl ? [p.imageUrl] : [];
