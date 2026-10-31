import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PublicNav from "../../components/PublicNav.jsx";
import SiteFooter from "../../components/SiteFooter.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import Icon from "../../components/Icon.jsx";
import { fetchCategories, fetchProducts } from "../../api/product.api.js";
import { categoryMeta } from "../../utils/categories.js";

// Landing — SHOP.CO homepage structure with PropeBuy's story:
// hero with the pilot numbers, a black category strip in place of the
// brand bar, New Arrivals, a bento category grid, and the trust points.
// Public copy stays benefit-only, no tech terms (AGENTS.md rule).
const Landing = () => {
  // Categories from backend so each tile carries its real id
  const [categories, setCategories] = useState([]);
  // Newest listings — the backend already sorts createdAt desc
  const [products, setProducts] = useState([]);

  // Load both once on mount; silent fail keeps the page usable
  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]));
    fetchProducts()
      .then((res) => setProducts(res.data || []))
      .catch(() => setProducts([]));
  }, []);

  // Hero collage + New Arrivals — first 4 with photos, newest first
  const withPhotos = products.filter((p) => p.imageUrl);
  const collage = withPhotos.slice(0, 4);
  const arrivals = products.slice(0, 4);

  // Pilot numbers — straight from Chapter 1, ties the build to the paper
  const stats = [
    { n: "431+", l: "Local vendors in Poblacion" },
    { n: "927+", l: "Establishments in the pilot" },
    { n: "7", l: "Categories of local goods" },
  ];

  // Trust points — buyer-facing benefits, no tech terms
  const points = [
    {
      icon: "verified_user",
      t: "Verified sellers",
      d: "Government ID plus Barangay Certificate checked. Look for the Verified Local Vendor badge.",
    },
    {
      icon: "location_on",
      t: "Barangay discovery",
      d: "Filter goods by barangay. Support vendors near you and keep spending in the community.",
    },
    {
      icon: "receipt_long",
      t: "Orders you can track",
      d: "Stock-checked checkout. Cash on pickup or delivery, GCash online. Live status until it is in your hands.",
    },
  ];

  // Bento spans — 7 tiles as 1+2 / 2+1 / 1+1+1 on desktop
  const spans = ["md:col-span-1", "md:col-span-2", "md:col-span-2", "md:col-span-1"];

  return (
    <div className="min-h-screen bg-white page-enter">
      <PublicNav />

      {/* ── HERO — card gray band, text left, product collage right ── */}
      <section className="bg-card">
        <div className="max-w-7xl mx-auto px-4 pt-10 md:pt-20 pb-12 md:pb-20 grid gap-10 md:grid-cols-2 items-center">
          <div className="min-w-0">
            {/* Display header, generalized scope */}
            <h1 className="text-4xl md:text-6xl text-black">
              Find local goods from your own barangay
            </h1>
            {/* Body benefit subtext, no jargon */}
            <p className="font-body text-black/60 mt-5 text-sm md:text-base max-w-lg">
              Shop verified vendors across Muntinlupa City. Browse by
              barangay, pay cash or GCash, and track every order until it is
              in your hands.
            </p>
            {/* CTA row — full width on phone, like the reference */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/browse"
                className="btn-primary btn-active px-14 py-4 text-center font-body font-medium"
              >
                Shop Now
              </Link>
              <Link
                to="/register"
                className="btn-outline btn-active px-10 py-4 text-center font-body font-medium"
              >
                Sell on PropeBuy
              </Link>
            </div>
            {/* Stats row — dividers between, wraps on phone */}
            <div className="mt-10 flex flex-wrap gap-y-6">
              {stats.map((s, i) => (
                <div
                  key={s.l}
                  className={`pr-6 md:pr-8 ${i > 0 ? "pl-6 md:pl-8 border-l border-black/10" : ""}`}
                >
                  <p className="font-body font-bold text-2xl md:text-4xl text-black">
                    {s.n}
                  </p>
                  <p className="font-body text-xs md:text-sm text-black/60 mt-1 max-w-[9rem]">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Collage — newest real listings, 2x2, white tiles while loading */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {[0, 1, 2, 3].map((i) => {
              const p = collage[i];
              return p ? (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className={`relative aspect-square rounded-xl overflow-hidden bg-white ${i % 2 === 1 ? "translate-y-6" : ""}`}
                >
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </Link>
              ) : (
                <div
                  key={i}
                  className={`aspect-square rounded-xl bg-white/60 ${i % 2 === 1 ? "translate-y-6" : ""}`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CATEGORY STRIP — black band, replaces the brand logos ── */}
      <section className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 flex flex-wrap justify-center md:justify-between gap-x-8 gap-y-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/browse?category=${c.id}`}
              className="font-header text-white text-xl md:text-3xl opacity-90 hover:opacity-100"
            >
              {categoryMeta(c.name).short}
            </Link>
          ))}
        </div>
      </section>

      {/* ── NEW ARRIVALS ── */}
      <section className="max-w-7xl mx-auto px-4 pt-14 md:pt-20">
        <h2 className="text-3xl md:text-5xl text-center text-black">
          New Arrivals
        </h2>
        {arrivals.length === 0 ? (
          <p className="mt-8 text-center font-body text-sm text-passive">
            New goods show up here as vendors list them.
          </p>
        ) : (
          <div className="mt-8 md:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
            {arrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
        <div className="mt-9 flex justify-center">
          <Link
            to="/browse"
            className="btn-outline btn-active w-full sm:w-auto px-16 py-4 text-center font-body font-medium"
          >
            View All
          </Link>
        </div>
        <hr className="mt-14 md:mt-16 border-black/10" />
      </section>

      {/* ── SHOP BY CATEGORY — bento grid on a gray panel ── */}
      <section className="max-w-7xl mx-auto px-4 pt-14 md:pt-20">
        <div className="bg-surface rounded-xl px-6 py-10 md:px-16 md:py-16">
          <h2 className="text-3xl md:text-5xl text-center text-black">
            Shop by Category
          </h2>
          <div className="mt-8 md:mt-14 grid gap-4 md:grid-cols-3">
            {categories.map((c, i) => {
              const meta = categoryMeta(c.name);
              return (
                <Link
                  key={c.id}
                  to={`/browse?category=${c.id}`}
                  // Last row runs 1+1+1, earlier rows alternate 1+2 / 2+1
                  className={`group relative bg-white rounded-xl p-6 h-36 md:h-56 overflow-hidden ${i < 4 ? spans[i] : "md:col-span-1"}`}
                >
                  <p className="font-body font-bold text-xl md:text-3xl text-black max-w-[70%]">
                    {c.name}
                  </p>
                  {/* Oversized icon, bottom right, nudges on hover */}
                  <Icon
                    name={meta.icon}
                    size={96}
                    className="absolute right-4 bottom-4 text-black/10 transition-transform duration-300 group-hover:scale-110"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHY PROPEBUY — the three trust points ── */}
      <section className="max-w-7xl mx-auto px-4 pt-14 md:pt-20">
        <h2 className="text-3xl md:text-5xl text-center text-black">
          Why PropeBuy
        </h2>
        <div className="mt-8 md:mt-14 grid gap-4 md:grid-cols-3">
          {points.map((p) => (
            <div key={p.t} className="border border-black/10 rounded-xl p-6 md:p-7">
              <span className="inline-flex w-12 h-12 rounded-full bg-surface items-center justify-center">
                <Icon name={p.icon} size={24} className="text-black" />
              </span>
              <p className="mt-5 font-body font-bold text-lg text-black">
                {p.t}
              </p>
              <p className="mt-2 font-body text-sm text-black/60">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Landing;
