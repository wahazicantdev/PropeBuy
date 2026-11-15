// All photos of a product, cover first. Older products and demo data
// only have imageUrl, so fall back to that single photo.
export const productPhotos = (p) =>
  p?.images?.length ? p.images : p?.imageUrl ? [p.imageUrl] : [];

// Smaller copy of a Cloudinary photo, resized by Cloudinary on the fly.
// A 200px thumbnail is about 6 KB instead of the 100+ KB original, which
// matters on phone data. Non-Cloudinary URLs are returned unchanged.
export const cld = (url, width) =>
  url && url.includes("res.cloudinary.com/") && url.includes("/upload/")
    ? url.replace("/upload/", `/upload/c_limit,w_${width},q_auto,f_auto/`)
    : url;
