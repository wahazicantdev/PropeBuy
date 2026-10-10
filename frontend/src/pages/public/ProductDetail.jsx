import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import PublicNav from "../../components/PublicNav.jsx";
import VerifiedBadge from "../../components/VerifiedBadge.jsx";
import { fetchProduct } from "../../api/product.api.js";
import { useAuthStore } from "../../stores/auth.store.js";
import { useCartStore } from "../../stores/cart.store.js";

// Product detail — public viewing, login wall on actions
const ProductDetail = () => {
  // Id from URL /product/:id
  const { id } = useParams();
  // Product state
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  // Quantity picker, minimum 1
  const [qty, setQty] = useState(1);
  // Auth check for the wall, cart writer, redirect
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addItem = useCartStore((s) => s.addItem);
  const navigate = useNavigate();

  // Load product once by id
  useEffect(() => {
    fetchProduct(id)
      .then((res) => setProduct(res.data))
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

  // Add to cart — guarded
  const handleAdd = () => {
    if (!requireLogin()) return;
    // Cap quantity at available stock
    addItem(product, Math.min(qty, product.stock));
    toast.success("Added to cart");
    navigate("/cart");
  };

  // Buy now — guarded, same cart then straight to cart page
  const handleBuy = () => {
    if (!requireLogin()) return;
    // Checkout page lands in Phase C, cart is the stop for now
    addItem(product, Math.min(qty, product.stock));
    navigate("/cart");
  };

  // Loading skeleton state
  if (loading)
    return (
      <div className="min-h-screen bg-white">
        <PublicNav />
        <p className="text-center py-16 font-body text-passive">Loading...</p>
      </div>
    );
  // Missing product state
  if (!product)
    return (
      <div className="min-h-screen bg-white">
        <PublicNav />
        <p className="text-center py-16 font-body text-passive">
          Product not available.{" "}
          <Link to="/browse" className="text-primary">
            Back to browse
          </Link>
        </p>
      </div>
    );

  // Sold out flag from stock count
  const soldOut = product.stock <= 0;

  return (
    // Public detail root with entrance animation
    <div className="min-h-screen bg-white page-enter">
      <PublicNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb — browse, category, current product */}
        <nav
          className="font-body text-sm text-passive flex items-center gap-2 flex-wrap"
          aria-label="Breadcrumb"
        >
          {/* Step back to full listing */}
          <Link to="/browse" className="hover:text-primary shrink-0">
            Back to browse
          </Link>
          <span aria-hidden="true">/</span>
          {/* Jump to same category, filter preset via URL */}
          <button
            onClick={() =>
              navigate(`/browse?category=${product.category?.id || ""}`)
            }
            className="hover:text-primary shrink-0"
          >
            {product.category?.name || "Goods"}
          </button>
          <span aria-hidden="true">/</span>
          {/* Current page, truncated on phone */}
          <span className="text-gray-900 truncate max-w-48 md:max-w-none">
            {product.name}
          </span>
        </nav>
        {/* Stacked on phone, split on desktop */}
        <div className="mt-4 grid gap-8 md:grid-cols-2">
          {/* Image panel */}
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-body text-sm text-passive">
                No photo
              </div>
            )}
          </div>
          {/* Info panel */}
          <div>
            <h1 className="font-header font-bold text-2xl md:text-3xl text-gray-900">
              {product.name}
            </h1>
            <p className="font-body font-bold text-2xl text-primary mt-2">
              ₱{Number(product.price).toLocaleString()}
            </p>
            {/* Seller line with link to public store page */}
            <p className="font-body text-sm text-passive mt-2">
              Sold by{" "}
              <Link
                to={`/store/${product.seller?.id}`}
                className="text-primary font-bold hover:underline"
              >
                {product.seller?.name || "Vendor"}
              </Link>{" "}
              · {product.barangay?.name || ""}
            </p>
            {product.seller?.accountStatus === "VERIFIED" && <VerifiedBadge />}
            {/* Stock line in plain words */}
            <p className="font-body text-sm mt-2 text-passive">
              {soldOut ? "Out of stock" : `${product.stock} available`}
            </p>
            {/* Description in plain words */}
            {product.description && (
              <p className="font-body text-sm text-gray-700 mt-4">
                {product.description}
              </p>
            )}
            {/* Quantity picker — minus, value, plus */}
            {!soldOut && (
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="btn-active border border-gray-200 rounded-lg w-10 h-10 font-body"
                >
                  -
                </button>
                <span className="font-body font-bold w-8 text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="btn-active border border-gray-200 rounded-lg w-10 h-10 font-body"
                >
                  +
                </button>
              </div>
            )}
            {/* Action buttons — login wall fires on tap */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAdd}
                disabled={soldOut}
                className="btn-active flex-1 border border-primary text-primary font-body py-3 rounded-lg disabled:opacity-40"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuy}
                disabled={soldOut}
                className="btn-active flex-1 bg-primary text-white font-body py-3 rounded-lg disabled:opacity-40"
              >
                Buy Now
              </button>
            </div>
            {/* Guest hint in plain words */}
            {!isAuthenticated && (
              <p className="font-body text-xs text-passive mt-3">
                You can look around freely. Logging in is only needed to buy.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
