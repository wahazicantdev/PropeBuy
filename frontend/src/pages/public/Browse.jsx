import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import PublicNav from "../../components/PublicNav.jsx";
import Select from "../../components/Select.jsx";
import VerifiedBadge from "../../components/VerifiedBadge.jsx";
import {
  fetchProducts,
  fetchBarangays,
  fetchCategories,
} from "../../api/product.api.js";

// Browse — public guest page, no login required to view goods
const Browse = () => {
  // List state
  const [products, setProducts] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [categories, setCategories] = useState([]);
  // Preset from URL, used by landing chips and breadcrumb jumps
  const [urlParams] = useSearchParams();
  // Filter state — empty means all
  const [barangayId, setBarangayId] = useState("");
  const [categoryId, setCategoryId] = useState(urlParams.get("category") || "");
  const [search, setSearch] = useState("");
  // Loading flag for grid
  const [loading, setLoading] = useState(true);

  // Dropdown options with an All entry first
  const barangayOptions = [
    { value: "", label: "All barangays" },
    ...barangays.map((b) => ({ value: String(b.id), label: b.name })),
  ];
  const categoryOptions = [
    { value: "", label: "All categories" },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  // Load dropdown options once on mount
  useEffect(() => {
    Promise.all([fetchBarangays(), fetchCategories()])
      .then(([b, c]) => {
        setBarangays(b.data || []);
        setCategories(c.data || []);
      })
      .catch(() => toast.error("Failed to load filters"));
  }, []);

  // Load products whenever a filter changes
  useEffect(() => {
    // Debounce search slightly so fast typing does not spam API
    const t = setTimeout(
      () => {
        // Flag loading inside the timer, keeps effect body free of sync setState
        setLoading(true);
        fetchProducts({ barangayId, categoryId, search })
          .then((res) => setProducts(res.data || []))
          .catch(() => toast.error("Failed to load products"))
          .finally(() => setLoading(false));
      },
      search ? 400 : 0,
    );
    // Cleanup timer on next keystroke
    return () => clearTimeout(t);
  }, [barangayId, categoryId, search]);

  return (
    // Public page root with entrance animation
    <div className="min-h-screen bg-white page-enter">
      <PublicNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Bold header, commercial copy */}
        <h1 className="font-header font-bold text-2xl md:text-3xl text-gray-900">
          Browse goods
        </h1>
        <p className="font-body text-sm text-passive mt-1">
          Discover local finds from verified Muntinlupa vendors. New goods
          daily, proudly community made.
        </p>
        {/* Filters — stacked on phone, row on desktop */}
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 font-body text-sm focus:outline-primary"
          />
          <Select
            value={barangayId}
            onChange={setBarangayId}
            options={barangayOptions}
            ariaLabel="Filter by barangay"
          />
          <Select
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
            ariaLabel="Filter by category"
          />
        </div>
        {/* Category chips — quick tap filter */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryId("")}
            className={`btn-active font-body text-xs rounded-full px-4 py-2 border ${!categoryId ? "bg-primary text-white border-primary" : "border-gray-200 text-passive"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(String(c.id))}
              className={`btn-active font-body text-xs rounded-full px-4 py-2 border ${String(categoryId) === String(c.id) ? "bg-primary text-white border-primary" : "border-gray-200 text-passive"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
        {/* Grid — 2 columns on phone, 4 on desktop */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <span className="spinner" style={{ borderTopColor: "#05829a" }} />
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-header font-bold text-lg text-gray-900">
              No goods found
            </p>
            <p className="font-body text-sm text-passive mt-1">
              Try another search or clear the filters.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              // Whole card links to detail, guest allowed
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image with fixed ratio, gray fallback */}
                <div className="aspect-square bg-gray-50">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-body text-xs text-passive">
                      No photo
                    </div>
                  )}
                </div>
                <div className="p-3">
                  {/* Price first, Shopee habit */}
                  <p className="font-body font-bold text-primary">
                    ₱{Number(p.price).toLocaleString()}
                  </p>
                  <p className="font-body text-sm text-gray-900 truncate mt-1">
                    {p.name}
                  </p>
                  {/* Barangay plus verified seller badge */}
                  <p className="font-body text-xs text-passive mt-1">
                    {p.barangay?.name || ""}
                  </p>
                  {p.seller?.accountStatus === "VERIFIED" && <VerifiedBadge />}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Browse;
