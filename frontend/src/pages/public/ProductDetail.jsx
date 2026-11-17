import Stars from "../../components/Stars.jsx";
import ProductReviews from "../../components/ProductReviews.jsx";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import PublicNav from "../../components/PublicNav.jsx";
import SiteFooter from "../../components/SiteFooter.jsx";
import VerifiedBadge from "../../components/VerifiedBadge.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import Icon from "../../components/Icon.jsx";
import { fetchProduct, fetchProducts } from "../../api/product.api.js";
import { useAuthStore } from "../../stores/auth.store.js";
import { useCartStore } from "../../stores/cart.store.js";
import { formatPeso } from "../../utils/format.js";
import { productPhotos, cld } from "../../utils/photos.js";

// Gallery: up to 4 seller photos, cover first (see utils/photos.js)

// Product detail — public viewing, login wall on actions.
// SHOP.CO layout: thumbnails + big image left, info right, related below.
const ProductDetail = () => {
  // Id from URL /product/:id
  const { id } = useParams();
  // Product state
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  // Same-category picks for the "you might also like" row
  const [related, setRelated] = useState([]);
  // Gallery — which slot the big viewer shows
  const [active, setActive] = useState(0);
  // Quantity picker, minimum 1
  const [qty, setQty] = useState(1);
  // Picked option id, when the product has options
  const [variantId, setVariantId] = useState(null);
  // Auth check for the wall, cart writer, redirect
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addItem = useCartStore((s) => s.addItem);
  const navigate = useNavigate();

  // Load product by id, then its category neighbours
  useEffect(() => {
    fetchProduct(id)
      .then((res) => {
        setProduct(res.data);
        // Back to the real photo whenever the product changes
        setActive(0);
        setQty(1);
        // First option that still has stock is picked by default
        const options = res.data?.variants || [];
        setVariantId((options.find((x) => x.stock > 0) || options[0])?.id ?? null);
        // Related — same category, this product left out, max 4
        return fetchProducts({ categoryId: res.data?.category?.id }).then((r) =>
          setRelated((r.data || []).filter((p) => String(p.id) !== String(id)).slice(0, 4)),
        );
      })
      .catch(() => toast.error("Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  // Wall — guests go to login, buyers continue
  const requireLogin = () => {
    // Not logged in means back to buyer login first
    if (!isAuthenticated) {
      toast("Log in to continue with this item");
      navigate("/login/buyer");
      return false;
    }
    return true;
  };

  // Add to cart — guarded, stays on the page so shoppers keep browsing
  const handleAdd = () => {
    if (!requireLogin()) return;
    // Cap quantity at available stock — the option's own stock when picked
    addItem(product, Math.min(qty, stock), variant);
    toast.success("Added to cart");
  };

  // Buy now — guarded, same cart then straight to cart page
  const handleBuy = () => {
    if (!requireLogin()) return;
    addItem(product, Math.min(qty, stock), variant);
    navigate("/cart");
  };

  // Loading state
  if (loading)
    return (
      <div className="min-h-screen bg-white">
        <PublicNav />
        <div className="py-24 flex justify-center">
          <span className="spinner" />
        </div>
      </div>
    );
  // Missing product state
  if (!product)
    return (
      <div className="min-h-screen bg-white">
        <PublicNav />
        <div className="py-24 text-center px-4">
          <p className="font-header text-xl text-black">Product not available</p>
          <Link to="/browse" className="btn-primary inline-block mt-6 px-10 py-3 font-body font-medium">
            Back to shop
          </Link>
        </div>
      </div>
    );

  // Options: the picked one sets the price and stock shown
  const variants = product.variants || [];
  const variant = variants.find((x) => x.id === variantId) || null;
  const price = variant ? variant.price : product.price;
  const stock = variant ? variant.stock : product.stock;
  // Sold out flag from stock count
  const soldOut = stock <= 0;
  // Real photos only, cover first. One empty slot when there are none.
  const photos = productPhotos(product);
  const slots = photos.length ? photos : [null];

  // One renderer for thumbnails and the big viewer
  const renderSlot = (src, big) =>
    src ? (
      <img src={cld(src, big ? 1000 : 200)} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
    ) : (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-black/25">
        <Icon name="image" size={big ? 56 : 28} />
        {big && <p className="font-body text-sm">No photo yet</p>}
      </div>
    );

  return (
    <div className="min-h-screen bg-white page-enter">
      <PublicNav />
      <main className="max-w-7xl mx-auto px-4 pt-6 min-w-0">
        {/* Breadcrumb — home, shop, category, current product */}
        <nav
          className="font-body text-sm text-black/60 flex items-center gap-1 flex-wrap"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="hover:text-black shrink-0">Home</Link>
          <Icon name="chevron_right" size={16} />
          <Link to="/browse" className="hover:text-black shrink-0">Shop</Link>
          <Icon name="chevron_right" size={16} />
          {/* Jump to same category, filter preset via URL */}
          <button
            onClick={() => navigate(`/browse?category=${product.category?.id || ""}`)}
            className="hover:text-black shrink-0"
          >
            {product.category?.name || "Goods"}
          </button>
          <Icon name="chevron_right" size={16} />
          {/* Current page, truncated on phone */}
          <span className="text-black truncate max-w-40 md:max-w-none">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:gap-10 md:grid-cols-2">
          {/* ── GALLERY — thumbs column + big viewer (desktop),
                 big viewer + thumbs row (phone) ── */}
          <div className="flex flex-col-reverse md:flex-row gap-3 min-w-0">
            {/* Thumbnails only when there is more than 1 photo */}
            {slots.length > 1 && (
            <div className="grid grid-cols-4 md:grid-cols-1 md:w-28 lg:w-36 gap-3 shrink-0">
              {slots.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Photo ${i + 1} of ${slots.length}`}
                  className={`relative aspect-square rounded-xl bg-card overflow-hidden border-2 transition-colors ${active === i ? "border-black" : "border-transparent"}`}
                >
                  {renderSlot(src, false)}
                </button>
              ))}
            </div>
            )}
            <div className="relative flex-1 aspect-square rounded-xl bg-card overflow-hidden">
              {renderSlot(slots[Math.min(active, slots.length - 1)], true)}
            </div>
          </div>

          {/* ── INFO PANEL ── */}
          <div className="min-w-0">
            <h1 className="text-2xl md:text-4xl text-black">{product.name}</h1>
            {/* Rating summary under the name */}
            {product.rating?.count > 0 && (
              <p className="mt-2 flex items-center gap-2 font-body text-sm text-black/70">
                <Stars value={product.rating.average} size={18} />
                {product.rating.average.toFixed(1)} · {product.rating.count} rating{product.rating.count > 1 ? "s" : ""}
              </p>
            )}
            <p className="mt-3 font-body font-bold text-2xl md:text-3xl text-black">
              {formatPeso(price)}
            </p>
            {/* Option chips — sizes, colors, pack sizes */}
            {variants.length > 0 && (
              <div className="mt-4">
                <p className="font-body text-sm text-black/60">Choose an option</p>
                <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Product options">
                  {variants.map((x) => (
                    <button
                      key={x.id}
                      role="radio"
                      aria-checked={x.id === variantId}
                      onClick={() => {
                        setVariantId(x.id);
                        setQty(1);
                      }}
                      className={`rounded-full px-4 py-2 font-body text-sm border transition-colors ${
                        x.id === variantId ? "bg-primary text-white border-primary" : "border-black/15 hover:border-black"
                      } ${x.stock <= 0 ? "opacity-40 line-through" : ""}`}
                    >
                      {x.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Description in plain words */}
            {product.description && (
              <p className="mt-4 font-body text-sm md:text-base text-black/60">
                {product.description}
              </p>
            )}
            <hr className="my-6 border-black/10" />

            {/* Seller card — who you buy from, the trust story */}
            <Link
              to={`/store/${product.seller?.id}`}
              className="flex items-center gap-3 group"
            >
              <span className="w-12 h-12 rounded-full bg-surface flex items-center justify-center shrink-0">
                <Icon name="storefront" size={24} />
              </span>
              <span className="min-w-0">
                <span className="block font-body font-bold text-base text-black group-hover:underline truncate">
                  {product.seller?.name || "Vendor"}
                </span>
                <span className="flex items-center gap-1 font-body text-sm text-black/60">
                  <Icon name="location_on" size={16} />
                  {product.barangay?.name || "Muntinlupa"}
                </span>
              </span>
              <Icon name="chevron_right" className="ml-auto text-black/40" />
            </Link>
            {product.seller?.accountStatus === "VERIFIED" && (
              <div className="mt-3">
                <VerifiedBadge />
              </div>
            )}
            <hr className="my-6 border-black/10" />

            {/* Stock line — red when low, plain otherwise */}
            <p className={`font-body text-sm flex items-center gap-1.5 ${soldOut || stock <= 3 ? "text-danger" : "text-black/60"}`}>
              <Icon name="inventory_2" size={18} />
              {soldOut ? "Out of stock" : stock <= 3 ? `Only ${stock} left` : `${stock} in stock`}
            </p>

            {/* Quantity pill + actions — login wall fires on tap */}
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              {!soldOut && (
                <div className="h-12 bg-surface rounded-full flex items-center justify-between px-4 sm:w-40 shrink-0">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity" className="p-1">
                    <Icon name="remove" />
                  </button>
                  <span className="font-body font-medium text-black">{qty}</span>
                  <button onClick={() => setQty(Math.min(stock, qty + 1))} aria-label="Increase quantity" className="p-1">
                    <Icon name="add" />
                  </button>
                </div>
              )}
              <button
                onClick={handleAdd}
                disabled={soldOut}
                className="btn-primary btn-active flex-1 h-12 font-body font-medium flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Icon name="add_shopping_cart" />
                Add to Cart
              </button>
            </div>
            <button
              onClick={handleBuy}
              disabled={soldOut}
              className="btn-outline btn-active mt-3 w-full h-12 font-body font-medium disabled:opacity-40"
            >
              Buy Now
            </button>

            {/* Guest hint in plain words */}
            {!isAuthenticated && (
              <p className="font-body text-xs text-passive mt-3">
                You can look around freely. Logging in is only needed to buy.
              </p>
            )}
            {/* Payment + pickup reassurance */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="bg-surface rounded-xl p-3 flex items-center gap-2 font-body text-xs text-black">
                <Icon name="payments" size={20} />
                Cash or GCash
              </div>
              <div className="bg-surface rounded-xl p-3 flex items-center gap-2 font-body text-xs text-black">
                <Icon name="local_shipping" size={20} />
                Pickup or delivery
              </div>
            </div>
          </div>
        </div>

        {/* ── RATINGS AND REVIEWS ── */}
        <ProductReviews productId={product.id} />

        {/* ── YOU MIGHT ALSO LIKE ── */}
        {related.length > 0 && (
          <section className="pt-16 md:pt-20">
            <h2 className="text-3xl md:text-5xl text-center text-black">
              You might also like
            </h2>
            <div className="mt-8 md:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default ProductDetail;
