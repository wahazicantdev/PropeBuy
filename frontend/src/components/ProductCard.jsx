import { Link } from "react-router-dom";
import VerifiedBadge from "./VerifiedBadge.jsx";
import Icon from "./Icon.jsx";
import { formatPeso } from "../utils/format.js";


// ProductCard — the SHOP.CO card: warm gray image tile with 20px
// corners, bold name, big price. PropeBuy adds the barangay line and
// the Verified Local Vendor mark, the two trust signals the paper
// promises on every listing. Used by Landing, Browse, SellerStore and
// the "you might also like" row on ProductDetail.
const ProductCard = ({ product }) => {
  // Low stock nudge — same threshold as the backend (3 or fewer)
  const lowStock = product.stock > 0 && product.stock <= 3;

  return (
    // Whole card is one link — guests may open any product
    <Link to={`/product/${product.id}`} className="group block min-w-0">
      {/* Image tile — square, card gray, photo cropped to fill */}
      <div className="relative aspect-square rounded-xl bg-card overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            // transform-only hover zoom, GPU friendly
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          // No photo — icon placeholder keeps the grid even
          <div className="absolute inset-0 flex items-center justify-center text-black/30">
            <Icon name="image" size={40} />
          </div>
        )}
        {/* Low stock tag — red, the reference's discount-chip color */}
        {lowStock && (
          <span className="absolute top-3 left-3 bg-white text-danger font-body text-xs font-bold rounded-full px-3 py-1">
            Only {product.stock} left
          </span>
        )}
      </div>

      {/* Name — bold, one line on phone grids */}
      <p className="mt-3 font-body font-bold text-sm md:text-base text-black line-clamp-1">
        {product.name}
      </p>
      {/* Where it comes from — the hyper-local signal */}
      <p className="mt-0.5 font-body text-xs text-passive truncate">
        {product.barangay?.name || "Muntinlupa"}
        {product.seller?.name ? ` · ${product.seller.name}` : ""}
      </p>
      {/* Trust mark — only for verified sellers */}
      {product.seller?.accountStatus === "VERIFIED" && (
        <div className="mt-1">
          <VerifiedBadge />
        </div>
      )}
      {/* Price — biggest thing on the card, like the reference */}
      <p className="mt-1 font-body font-bold text-lg md:text-xl text-black">
        {formatPeso(product.price)}
      </p>
    </Link>
  );
};

export default ProductCard;
