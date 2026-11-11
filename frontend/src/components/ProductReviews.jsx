import { useEffect, useState } from "react";
import Stars from "./Stars.jsx";
import { fetchProductReviews } from "../api/review.api.js";

// Reviews section on the product page: average, count and the latest 20
const ProductReviews = ({ productId }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    fetchProductReviews(productId)
      .then((res) => active && setData(res.data))
      .catch(() => active && setData({ average: 0, count: 0, reviews: [] }));
    return () => {
      active = false;
    };
  }, [productId]);

  if (!data) return null;

  return (
    <section className="pt-12 md:pt-16">
      <h2 className="text-2xl md:text-3xl text-black">Ratings and reviews</h2>
      {data.count === 0 ? (
        <p className="mt-3 font-body text-sm text-black/60">No ratings yet. Buyers can rate this item after their order is fulfilled.</p>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3 font-body">
            <span className="font-bold text-3xl text-black">{data.average.toFixed(1)}</span>
            <Stars value={data.average} size={20} />
            <span className="text-sm text-black/60">{data.count} rating{data.count > 1 ? "s" : ""}</span>
          </div>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {data.reviews.map((r) => (
              <li key={r.id} className="border border-black/10 rounded-xl p-5 min-w-0">
                <Stars value={r.rating} size={18} />
                <p className="mt-2 font-body font-bold text-sm text-black">{r.buyerName}</p>
                {r.comment && <p className="mt-1 font-body text-sm text-black/70 break-words">{r.comment}</p>}
                <p className="mt-2 font-body text-xs text-black/40">
                  {new Date(r.createdAt).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
};

export default ProductReviews;
