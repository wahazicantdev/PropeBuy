import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import PublicNav from "../../components/PublicNav.jsx";
import SiteFooter from "../../components/SiteFooter.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import VerifiedBadge from "../../components/VerifiedBadge.jsx";
import Icon from "../../components/Icon.jsx";
import { fetchProducts } from "../../api/product.api.js";

// Public seller store — every "Sold by" link lands here. Until the
// redesign this page was a placeholder that said "opens after Phase C".
// The manuscript promises the Verified Local Vendor badge on seller
// profiles, so the header carries it. Seller details come from the
// listings themselves (no public seller endpoint exists, by design:
// the store page exposes nothing a listing does not already show).
const SellerStore = () => {
  // Seller id from URL /store/:sellerId
  const { sellerId } = useParams();
  // This vendor's live listings
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load the store's listings — backend filters by sellerId
  useEffect(() => {
    fetchProducts({ sellerId })
      .then((res) => setProducts(res.data || []))
      .catch(() => toast.error("Failed to load this store"))
      .finally(() => setLoading(false));
  }, [sellerId]);

  // Identity from the first listing — every listing carries seller + barangay
  const seller = products[0]?.seller;
  const barangay = products[0]?.barangay;
  // Distinct categories this vendor sells — small chips under the name
  const categoryNames = [...new Set(products.map((p) => p.category?.name).filter(Boolean))];

  return (
    <div className="min-h-screen bg-white page-enter">
      <PublicNav />
      <main className="max-w-7xl mx-auto px-4 pt-6 min-w-0">
        {/* Breadcrumb */}
        <nav className="font-body text-sm text-black/60 flex items-center gap-1" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-black">Home</Link>
          <Icon name="chevron_right" size={16} />
          <Link to="/browse" className="hover:text-black">Shop</Link>
          <Icon name="chevron_right" size={16} />
          <span className="text-black">Store</span>
        </nav>

        {loading ? (
          <div className="py-24 flex justify-center">
            <span className="spinner" />
          </div>
        ) : products.length === 0 ? (
          // No live listings — could be a new vendor or everything sold out
          <div className="py-24 text-center">
            <Icon name="storefront" size={48} className="text-black/20" />
            <p className="mt-3 font-header text-xl text-black">No goods listed right now</p>
            <p className="font-body text-sm text-passive mt-1">
              This vendor has nothing in stock at the moment. Check back soon.
            </p>
            <Link to="/browse" className="btn-primary btn-active inline-block mt-6 px-10 py-3 font-body font-medium">
              Back to shop
            </Link>
          </div>
        ) : (
          <>
            {/* ── STORE HEADER — gray card, the vendor's identity ── */}
            <section className="mt-6 bg-card rounded-xl p-6 md:p-10 flex flex-col md:flex-row md:items-center gap-6">
              <span className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center shrink-0">
                <Icon name="storefront" size={40} />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-4xl text-black break-words">
                  {seller?.name || "Local vendor"}
                </h1>
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  {seller?.accountStatus === "VERIFIED" && <VerifiedBadge />}
                  <span className="flex items-center gap-1 font-body text-sm text-black/60">
                    <Icon name="location_on" size={16} />
                    Barangay {barangay?.name || "—"}, Muntinlupa
                  </span>
                </div>
                {/* What they sell */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  {categoryNames.map((n) => (
                    <span key={n} className="bg-white rounded-full px-3 py-1 font-body text-xs text-black">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
              {/* Listing count — a quick size-of-shop signal */}
              <div className="md:text-right shrink-0">
                <p className="font-body font-bold text-3xl md:text-4xl text-black">{products.length}</p>
                <p className="font-body text-sm text-black/60">
                  {products.length === 1 ? "product" : "products"} in stock
                </p>
              </div>
            </section>

            {/* ── LISTINGS ── */}
            <section className="pt-12">
              <h2 className="text-2xl md:text-3xl text-black">All goods</h2>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default SellerStore;
