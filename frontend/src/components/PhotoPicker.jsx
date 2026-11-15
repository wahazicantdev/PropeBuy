import { useEffect, useMemo } from "react";
import Icon from "./Icon.jsx";

// Up to 4 product photos. Each item is { url } for a saved photo or
// { file } for a new one. The first item is the cover photo.
const MAX = 4;

const PhotoPicker = ({ photos, onChange }) => {
  // Preview URLs for new files, revoked when the list changes (no leaks)
  const previews = useMemo(
    () => photos.map((p) => (p.file ? URL.createObjectURL(p.file) : p.url)),
    [photos],
  );
  useEffect(
    () => () => previews.forEach((u, i) => photos[i]?.file && URL.revokeObjectURL(u)),
    [previews, photos],
  );

  // Adds picked files up to the limit, pictures only
  const addFiles = (fileList) => {
    const room = MAX - photos.length;
    const picked = [...fileList].filter((f) => f.type.startsWith("image/")).slice(0, room);
    if (picked.length) onChange([...photos, ...picked.map((file) => ({ file }))]);
  };
  // Removes one photo
  const remove = (i) => onChange(photos.filter((_, j) => j !== i));
  // Moves a photo to the front so it becomes the cover
  const makeCover = (i) => onChange([photos[i], ...photos.filter((_, j) => j !== i)]);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {photos.map((p, i) => (
          <div key={p.url || `${p.file.name}-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-card group">
            <img src={previews[i]} alt={`Photo ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
            {/* Cover badge on the first photo */}
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-black text-white font-body text-[11px] font-bold px-2.5 py-1">
                Cover
              </span>
            )}
            {/* Remove — always visible on touch screens */}
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute right-2 top-2 w-8 h-8 rounded-full bg-white/90 text-black flex items-center justify-center shadow"
            >
              <Icon name="close" size={18} />
            </button>
            {/* Make cover — for photos after the first */}
            {i > 0 && (
              <button
                type="button"
                onClick={() => makeCover(i)}
                className="absolute inset-x-2 bottom-2 rounded-full bg-white/90 text-black font-body text-xs font-bold py-1.5 shadow"
              >
                Set as cover
              </button>
            )}
          </div>
        ))}
        {/* Add tile — hidden once 4 photos are in */}
        {photos.length < MAX && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-black/15 hover:border-black/40 flex flex-col items-center justify-center gap-1 cursor-pointer text-black/50 hover:text-black transition-colors">
            <Icon name="add_photo_alternate" size={28} />
            <span className="font-body text-xs font-bold">Add photo</span>
            <span className="font-body text-[11px]">{photos.length}/{MAX}</span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = ""; // allow picking the same file again
              }}
            />
          </label>
        )}
      </div>
      <p className="font-body text-xs text-black/60 mt-2">
        Up to 4 photos, JPG or PNG, 5 MB each. The cover shows on the shop page.
      </p>
    </div>
  );
};

export default PhotoPicker;
