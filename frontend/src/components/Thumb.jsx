import { cld } from "../utils/photos.js";
// Square product thumbnail. The photo fills a fixed box, so it can never
// collapse or stretch; no photo shows the first letter instead.
const Thumb = ({ src, alt = "", size = "w-14 h-14" }) => (
  <span className={`relative ${size} shrink-0 rounded-lg bg-card overflow-hidden flex items-center justify-center`}>
    {src ? (
      <img src={cld(src, 200)} alt={alt} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
    ) : (
      <span className="font-header text-lg text-black/30">{alt.charAt(0).toUpperCase()}</span>
    )}
  </span>
);

export default Thumb;
