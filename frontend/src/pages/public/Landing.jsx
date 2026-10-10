import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PublicNav from "../../components/PublicNav.jsx";
import { fetchCategories } from "../../api/product.api.js";

// Landing — generalized Muntinlupa barangays, benefit language only
const Landing = () => {
  // Trust points — buyer-facing benefits, no tech terms
  const points = [
    {
      n: "01",
      t: "Verified sellers",
      d: "Government ID plus Barangay Certificate checked. Look for the Verified Local Vendor badge.",
    },
    {
      n: "02",
      t: "Barangay discovery",
      d: "Filter products by barangay. Support vendors near you and keep spending in the community.",
    },
    {
      n: "03",
      t: "Orders you can track",
      d: "Stock-checked checkout. Cash on pickup or delivery, GCash online. Status updates until fulfillment.",
    },
  ];
  // Feature cards — plain words
  const features = [
    {
      t: "Verified community",
      d: "Every seller completes document verification before listing.",
    },
    {
      t: "Barangay browsing",
      d: "Find goods from vendors in your barangay and nearby areas.",
    },
    {
      t: "Trackable orders",
      d: "Follow each order from reservation to pickup or delivery.",
    },
  ];
  // Categories from backend so each chip carries its real id
  const [categories, setCategories] = useState([]);
  // Load once on mount, silent fail keeps page usable
  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]));
  }, []);

  return (
    // White minimalist page root with entrance animation
    <div className="min-h-screen bg-white page-enter">
      <PublicNav />
      {/* Hero — stacked on phone, split on desktop */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-20 grid gap-8 md:grid-cols-2 items-center">
        <div>
          {/* Norwester bold header, generalized scope */}
          <h1 className="font-header font-bold text-3xl md:text-5xl text-gray-900 leading-tight">
            Muntinlupa's{" "}
            <span className="text-primary">barangay marketplace</span>
          </h1>
          {/* Lato benefit subtext, no jargon */}
          <p className="font-body text-passive mt-4 text-base md:text-lg">
            Shop verified local vendors across Muntinlupa City. Browse by
            barangay, pay cash or GCash, track every order.
          </p>
          {/* CTA row — stacked on phone */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/browse"
              className="btn-active bg-primary text-white font-body px-6 py-3 rounded-lg text-center hover:opacity-90"
            >
              Browse Products
            </Link>
            <Link
              to="/register"
              className="btn-active border border-primary text-primary font-body px-6 py-3 rounded-lg text-center hover:bg-primary hover:text-white"
            >
              Sell on PropeBuy
            </Link>
          </div>
          {/* Pilot note — ties build to documentation */}
          <p className="font-body text-xs text-passive mt-4">
            Now piloting in Barangay Poblacion. 431 local vendors, 927
            establishments going online.
          </p>
        </div>
        {/* Trust box — numbered rows */}
        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100 pop-enter">
          <h2 className="font-header font-bold text-lg text-gray-900">
            Why PropeBuy
          </h2>
          <ul className="mt-4 space-y-4">
            {points.map((p) => (
              <li key={p.n} className="flex gap-4">
                <span className="font-header font-bold text-primary text-sm">
                  {p.n}
                </span>
                <div>
                  <p className="font-body font-bold text-sm text-gray-900">
                    {p.t}
                  </p>
                  <p className="font-body text-sm text-passive">{p.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {/* Categories — the documented seven, as chips */}
      <section className="max-w-7xl mx-auto px-4 pb-8">
        <h2 className="font-header font-bold text-lg text-gray-900">
          Shop by category
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/browse?category=${c.id}`}
              className="btn-active font-body text-sm border border-gray-200 rounded-full px-4 py-2 hover:border-primary hover:text-primary"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>
      {/* Feature strip — 1 column on phone, 3 on desktop */}
      <section className="max-w-7xl mx-auto px-4 pb-12 grid gap-4 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.t} className="border border-gray-100 rounded-xl p-5">
            <h3 className="font-header font-bold text-primary">{f.t}</h3>
            <p className="font-body text-sm text-passive mt-1">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Landing;
