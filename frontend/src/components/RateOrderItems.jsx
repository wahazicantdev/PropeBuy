import { useState } from "react";
import toast from "react-hot-toast";
import Icon from "./Icon.jsx";
import Stars from "./Stars.jsx";
import { submitReview } from "../api/review.api.js";

// Star buttons — tap to choose 1 to 5
const StarPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={value === n}
        aria-label={`${n} star${n > 1 ? "s" : ""}`}
        onClick={() => onChange(n)}
        className="p-0.5"
      >
        <Icon name="star" size={28} className={n <= value ? "text-star" : "text-black/15"} />
      </button>
    ))}
  </div>
);

// One item: its saved rating, or the form to rate it
const RateRow = ({ item, onRated }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  // Send the rating, then show it in place of the form
  const save = async () => {
    if (!rating) return toast.error("Choose 1 to 5 stars first");
    setSaving(true);
    try {
      const res = await submitReview(item.id, rating, comment);
      onRated(item.id, res.data);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save your rating");
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="py-4 min-w-0">
      <p className="font-body font-bold text-sm text-black truncate">{item.product?.name || "Item"}</p>
      {item.review ? (
        // Already rated — read only
        <div className="mt-1">
          <Stars value={item.review.rating} size={18} />
          {item.review.comment && (
            <p className="font-body text-sm text-black/70 mt-1 break-words">{item.review.comment}</p>
          )}
        </div>
      ) : (
        <div className="mt-2 space-y-3">
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={2}
            aria-label={`Comment for ${item.product?.name || "item"}`}
            placeholder="Optional: how was the item?"
            className="w-full px-4 py-3 font-body text-sm rounded-xl bg-surface"
          />
          <button
            type="button"
            onClick={save}
            disabled={saving || !rating}
            className="btn-primary btn-active px-6 py-2.5 font-body text-sm font-medium disabled:opacity-40 flex items-center gap-2"
          >
            {saving ? <span className="spinner" /> : <Icon name="check_circle" size={18} />}
            {saving ? "Saving..." : "Submit rating"}
          </button>
        </div>
      )}
    </li>
  );
};

// Shown on a fulfilled order. Ratings are required before the next checkout.
const RateOrderItems = ({ order, onRated }) => {
  const items = order.orderItems || [];
  const left = items.filter((i) => !i.review).length;

  return (
    <section className="mt-5 border border-black/10 rounded-xl px-4 md:px-6 pt-5">
      <h2 className="heading-body text-lg md:text-xl text-black flex items-center gap-2">
        <Icon name="star" className="text-star" />
        {left > 0 ? "Rate your items" : "Your ratings"}
      </h2>
      <p className="font-body text-sm text-black/60 mt-1">
        {left > 0
          ? `Please rate ${left === 1 ? "this item" : `these ${left} items`}. You can order again once every item has a rating.`
          : "Thanks! Your ratings help other buyers find good local vendors."}
      </p>
      <ul className="mt-2 divide-y divide-black/10">
        {items.map((it) => (
          <RateRow key={it.id} item={it} onRated={onRated} />
        ))}
      </ul>
    </section>
  );
};

export default RateOrderItems;
