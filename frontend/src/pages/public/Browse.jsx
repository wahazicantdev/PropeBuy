import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import PublicNav from "../../components/PublicNav.jsx";
import SiteFooter from "../../components/SiteFooter.jsx";
import Select from "../../components/Select.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import Icon from "../../components/Icon.jsx";
import {
  fetchProducts,
  fetchBarangays,
  fetchCategories,
} from "../../api/product.api.js";
// Home barangay lookup — the stored user carries no barangayId
import { fetchMe } from "../../api/auth.api.js";
import { useAuthStore } from "../../stores/auth.store.js";
import { categoryMeta } from "../../utils/categories.js";

// Browse — public guest page, SHOP.CO category layout: Filters panel on
// the left, product grid on the right. No login required to view goods.
const Browse = () => {
  // List state
  const [products, setProducts] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [categories, setCategories] = useState([]);
  // URL holds category + search — landing chips, breadcrumbs and the
  // header search all deep-link here, and every view is shareable
  const [urlParams, setUrlParams] = useSearchParams();
  const search = urlParams.get("search") || "";
  // Filter state — empty means all
  const [barangayId, setBarangayId] = useState("");
  const [categoryId, setCategoryId] = useState(urlParams.get("category") || "");
  // Loading flag for grid
  const [loading, setLoading] = useState(true);
  // Phone filters panel — closed by default, the grid comes first
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Hyper-local default (manuscript p.6): logged-in buyers land on
  // THEIR barangay, guests see all. homeReady holds the first product
  // fetch until the lookup settles, so the grid never flashes "all".
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [homeId, setHomeId] = useState("");
  const [homeReady, setHomeReady] = useState(!isAuthenticated);

  // Dropdown options with an All entry first
  const barangayOptions = [
    { value: "", label: "All barangays" },
    ...barangays.map((b) => ({ value: String(b.id), label: b.name })),
  ];

  // Clear the search term while keeping the category in the URL
  const clearSearch = () =>
    setUrlParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("search");
        return next;
      },
      { replace: true },
    );

  // Load filter options once on mount
  useEffect(() => {
    Promise.all([fetchBarangays(), fetchCategories()])
      .then(([b, c]) => {
        setBarangays(b.data || []);
        setCategories(c.data || []);
      })
      .catch(() => toast.error("Failed to load filters"));
  }, []);

  // Resolve the home barangay once for logged-in users.
  // A ?category= deep link still applies on top — both filters combine.
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchMe()
      .then((res) => {
        const id = res.data?.barangayId ? String(res.data.barangayId) : "";
        setHomeId(id);
        setBarangayId(id);
      })
      // Lookup failed — fall back to all barangays, never block browsing
      .catch(() => {})
      .finally(() => setHomeReady(true));
  }, [isAuthenticated]);

  // Load products whenever a filter changes
  useEffect(() => {
    // Wait for the home barangay so the first grid is already local
    if (!homeReady) return;
    // Small debounce so fast filter taps do not spam the API
    const t = setTimeout(
      () => {
        // Flag loading inside the timer, keeps effect body free of sync setState
        setLoading(true);
        fetchProducts({ barangayId, categoryId, search })
          .then((res) => setProducts(res.data || []))
          .catch(() => toast.error("Failed to load products"))
          .finally(() => setLoading(false));
      },
      search ? 300 : 0,
    );
    // Cleanup timer on the next change
    return () => clearTimeout(t);
  }, [barangayId, categoryId, search, homeReady]);

  // Page title follows the active category, like the reference ("Casual")
  const activeCategory = categories.find((c) => String(c.id) === String(categoryId));

  // Filters panel — one markup, shown as sidebar or phone sheet
  const filters = (
    <div className="border border-black/10 rounded-xl p-5 md:p-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="font-body font-bold text-xl text-black">Filters</p>
        <Icon name="filter_list" size={22} className="text-black/40" />
      </div>
      <hr className="my-5 border-black/10" />

      {/* Category list — chevron rows like the reference */}
      <ul className="flex flex-col gap-1">
        {[{ id: "", name: "All goods" }, ...categories].map((c) => {
          const active = String(categoryId) === String(c.id);
          return (
            <li key={c.id || "all"}>
              <button
                onClick={() => {
                  setCategoryId(String(c.id));
                  setFiltersOpen(false);
                }}
                className={`w-full flex items-center justify-between py-2 font-body text-base text-left ${active ? "text-black font-bold" : "text-black/60 hover:text-black"}`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Icon name={c.id ? categoryMeta(c.name).icon : "category"} size={20} />
                  <span className="truncate">{c.name}</span>
                </span>
                <Icon name="chevron_right" size={18} />
              </button>
            </li>
          );
        })}
      </ul>
      <hr className="my-5 border-black/10" />

      {/* Barangay — the hyper-local filter */}
      <p className="font-body font-bold text-xl text-black">Barangay</p>
      <div className="mt-4">
        <Select
          value={barangayId}
          onChange={setBarangayId}
          options={barangayOptions}
          ariaLabel="Filter by barangay"
        />
      </div>
      {/* Home barangay hint — says why the grid is local, one tap widens */}
      {homeId && barangayId === homeId && (
        <p className="mt-3 font-body text-xs text-passive">
          Showing your barangay first.{" "}
          <button onClick={() => setBarangayId("")} className="text-black font-bold underline">
            See all
          </button>
        </p>
      )}

      {/* Reset — back to everything, everywhere */}
      <button
        onClick={() => {
          setCategoryId("");
          setBarangayId("");
          clearSearch();
          setFiltersOpen(false);
        }}
        className="btn-primary btn-active mt-6 w-full py-3.5 font-body font-medium"
      >
        Reset filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white page-enter">
      <PublicNav />
      <main className="max-w-7xl mx-auto px-4 pt-6 min-w-0">
        {/* Breadcrumb */}
        <nav className="font-body text-sm text-black/60 flex items-center gap-1" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-black">Home</Link>
          <Icon name="chevron_right" size={16} />
          <span className="text-black">Shop</span>
        </nav>

        <div className="mt-6 grid gap-5 md:grid-cols-[280px_1fr]">
          {/* Sidebar — desktop always, phone as a toggled sheet */}
          <aside className={`${filtersOpen ? "block" : "hidden"} md:block md:sticky md:top-28 self-start`}>
            {filters}
          </aside>

          <section className="min-w-0">
            {/* Title row — category name or "Browse goods" */}
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl text-black">
                  {activeCategory ? activeCategory.name : "Browse goods"}
                </h1>
                <p className="font-body text-sm text-black/60 mt-1">
                  {loading ? "Loading goods..." : `Showing ${products.length} product${products.length === 1 ? "" : "s"} from verified vendors`}
                </p>
              </div>
              {/* Phone filters toggle */}
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="md:hidden w-10 h-10 rounded-full bg-surface flex items-center justify-center"
                aria-label={filtersOpen ? "Hide filters" : "Show filters"}
              >
                <Icon name={filtersOpen ? "close" : "filter_list"} />
              </button>
            </div>

            {/* Active search chip — set from the header search */}
            {search && (
              <div className="mt-4 inline-flex items-center gap-2 bg-surface rounded-full pl-4 pr-2 py-1.5 font-body text-sm">
                Results for “{search}”
                <button onClick={clearSearch} aria-label="Clear search" className="p-0.5">
                  <Icon name="close" size={16} />
                </button>
              </div>
            )}

            {/* Grid — 2 columns on phone, 3 on desktop */}
            {loading ? (
              <div className="py-24 flex justify-center">
                <span className="spinner" />
              </div>
            ) : products.length === 0 ? (
              <div className="py-24 text-center">
                <Icon name="search" size={40} className="text-black/20" />
                <p className="mt-3 font-header text-lg text-black">No goods found</p>
                <p className="font-body text-sm text-passive mt-1">
                  Try another search or reset the filters.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Browse;
