import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader.jsx";
import FilterChips from "../../components/FilterChips.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Stars from "../../components/Stars.jsx";
import Spinner from "../../components/Spinner.jsx";
import Icon from "../../components/Icon.jsx";
import { fetchSellerReviews, replyToReview } from "../../api/review.api.js";
import { cld } from "../../utils/photos.js";
import Pagination from "../../components/Pagination.jsx";
import { usePaged } from "../../hooks/usePaged.js";

// Seller Reviews — every rating of the seller's products, with a public
// reply box under each one (E2E #419)
const Reviews = () => {
  // Page data: average, count, unreplied count, reviews
  const [data, setData] = useState(null);
  // Active chip: all, unreplied, comments
  const [filter, setFilter] = useState("all");
  // Review being answered, its draft text, and the save flag
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  // Load on mount and on every chip change
  const load = () =>
    fetchSellerReviews(filter)
      .then((res) => setData(res.data))
      .catch(() => toast.error("Could not load reviews"));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Open the reply box, prefilled when editing an earlier reply
  const startReply = (r) => {
    setEditing(r.id);
    setDraft(r.sellerReply || "");
  };

  // Save, edit or remove (empty text) the reply
  const saveReply = async (id) => {
    setSaving(true);
    try {
      const res = await replyToReview(id, draft);
      toast.success(res.message);
      setEditing(null);
      setDraft("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the reply");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  // At most 50 rows per page (11-26)
  const paged = usePaged(data?.reviews || [], "");

  if (!data) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner /> Loading reviews...
      </div>
    );
  }

  return (
    <div className="page-enter">
      <PageHeader title="Reviews" subtitle="See what buyers say about your products and answer them. Replies show on the product page." />

      {/* Summary — average stars, total and how many still need an answer */}
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-body">
        <span className="flex items-center gap-2">
          <span className="font-bold text-2xl">{data.average.toFixed(1)}</span>
          <Stars value={data.average} size={18} />
        </span>
        <span className="text-sm text-passive">
          {data.count} rating{data.count === 1 ? "" : "s"}
        </span>
        {data.unreplied > 0 && (
          <span className="text-sm text-danger">
            {data.unreplied} comment{data.unreplied === 1 ? "" : "s"} waiting for your reply
          </span>
        )}
      </div>

      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { key: "all", label: "All" },
          { key: "unreplied", label: "Needs reply", count: data.unreplied },
          { key: "comments", label: "With comments" },
        ]}
      />

      {data.reviews.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon="reviews" title="No reviews here yet" text="Ratings appear after buyers receive their orders." />
        </div>
      ) : (
        <ul className="mt-5 grid gap-3">
          {paged.pageItems.map((r) => (
            <li key={r.id} className="rounded-xl border border-black/10 p-4 min-w-0">
              {/* Product the rating belongs to */}
              <Link to={`/product/${r.product.id}`} className="flex items-center gap-3 min-w-0 group">
                <span className="relative w-10 h-10 rounded-lg bg-card overflow-hidden shrink-0">
                  {r.product.imageUrl && (
                    <img src={cld(r.product.imageUrl, 100)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                </span>
                <span className="font-body text-sm font-bold truncate group-hover:underline">{r.product.name}</span>
              </Link>

              {/* The buyer's rating and comment */}
              <div className="mt-3 flex items-center gap-2 flex-wrap font-body text-xs text-passive">
                <Stars value={r.rating} size={16} />
                <span className="text-black font-bold">{r.buyerName}</span>
                <span>{new Date(r.createdAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}</span>
              </div>
              {r.comment ? (
                <p className="mt-2 font-body text-sm text-black/80 wrap-break-word">{r.comment}</p>
              ) : (
                <p className="mt-2 font-body text-xs text-passive">Stars only, no comment.</p>
              )}

              {/* Reply: being written, already saved, or a button to start one */}
              {editing === r.id ? (
                <div className="mt-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Thank the buyer or answer their concern..."
                    className="w-full rounded-xl px-4 py-3 font-body text-sm"
                  />
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => saveReply(r.id)}
                      disabled={saving}
                      className="btn-primary btn-active px-5 py-2 font-body text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving && <Spinner />}
                      {!draft.trim() && r.sellerReply ? "Remove reply" : "Save reply"}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      disabled={saving}
                      className="font-body text-sm text-passive hover:text-black px-3 py-2"
                    >
                      Cancel
                    </button>
                    <span className="ml-auto font-body text-xs text-passive">{draft.length}/500</span>
                  </div>
                </div>
              ) : r.sellerReply ? (
                <div className="mt-3 rounded-xl bg-surface p-3">
                  <p className="font-body text-xs font-bold flex items-center gap-1">
                    <Icon name="reply" size={16} /> Your reply
                  </p>
                  <p className="mt-1 font-body text-sm text-black/80 wrap-break-word">{r.sellerReply}</p>
                  <button onClick={() => startReply(r)} className="mt-2 font-body text-xs font-bold underline">
                    Edit reply
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startReply(r)}
                  className="mt-3 btn-outline btn-active px-4 py-2 font-body text-sm font-medium flex items-center gap-1"
                >
                  <Icon name="reply" size={18} /> Reply
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <Pagination paged={paged} label="reviews" />
    </div>
  );
};

export default Reviews;
