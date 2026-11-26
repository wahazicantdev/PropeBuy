import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader.jsx";
import FilterChips from "../../components/FilterChips.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Spinner from "../../components/Spinner.jsx";
import Thumb from "../../components/Thumb.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import Pagination from "../../components/Pagination.jsx";
import { usePaged } from "../../hooks/usePaged.js";
import { fetchReports, decideReport } from "../../api/admin.api.js";
import { reasonLabel, REPORT_ACTION_LABEL } from "../../utils/reports.js";
import { formatPeso } from "../../utils/format.js";

// What staff can do with an open report. "product" ones need a product.
const ACTIONS = [
  { key: "DISMISS", label: "Dismiss", help: "Nothing wrong found. The buyer is told, the seller is not.", tone: "primary" },
  { key: "WARN", label: "Warn seller", help: "The seller gets a warning with your note. Repeated warnings can lead to suspension.", tone: "primary" },
  { key: "REMOVE_PRODUCT", label: "Remove product", help: "The product leaves PropeBuy. The seller gets your note.", tone: "danger", product: true },
  { key: "SUSPEND_SELLER", label: "Suspend seller", help: "The seller can no longer log in or sell, and their goods leave the feed. Their other open reports close too.", tone: "danger" },
];

// Short date and time
const when = (d) => new Date(d).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });

// Reports (11-26) — buyer reports about products, delivery fees, weights
// and stores. Open reports come oldest first so nothing waits too long.
const Reports = () => {
  const [status, setStatus] = useState("OPEN");
  // { counts, data }, null while loading
  const [data, setData] = useState(null);
  // Report and action picked in the decision dialog
  const [deciding, setDeciding] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  // Bumped after a decision to reload the list
  const [reload, setReload] = useState(0);

  // Load on mount, on chip change and after each decision
  useEffect(() => {
    fetchReports(status)
      .then((res) => setData(res))
      .catch(() => toast.error("Could not load reports"));
  }, [status, reload]);

  const paged = usePaged(data?.data || [], status);

  // Send the decision, then reload the queue
  const decide = async () => {
    setBusy(true);
    try {
      await decideReport(deciding.report.id, deciding.action.key, note.trim());
      toast.success(`${deciding.action.label}: done`);
      setDeciding(null);
      setNote("");
      setReload((n) => n + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the decision");
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner /> Loading reports...
      </div>
    );
  }

  const needsNote = deciding && deciding.action.key !== "DISMISS";

  return (
    <div className="page-enter">
      <PageHeader
        title="Reports"
        subtitle="Buyer reports about listings, delivery fees, weights and stores. Check the store's history before you decide."
      />

      <FilterChips
        value={status}
        onChange={setStatus}
        options={[
          { key: "OPEN", label: "Open", count: data.counts.OPEN },
          { key: "RESOLVED", label: "Acted on", count: data.counts.RESOLVED },
          { key: "DISMISSED", label: "Dismissed", count: data.counts.DISMISSED },
        ]}
      />

      {data.data.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon="flag"
            title={status === "OPEN" ? "No open reports" : "Nothing here yet"}
            text={status === "OPEN" ? "New buyer reports appear here, and you get a notice for each one." : "Decided reports appear here."}
          />
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {paged.pageItems.map((r) => {
            // Delivery fee above the fair maximum for the listed weight
            const overCap = r.product && r.maxDeliveryFee != null && Number(r.product.deliveryFee) > r.maxDeliveryFee;
            return (
              <li key={r.id} className="rounded-xl border border-black/10 p-4 md:p-5 font-body text-sm min-w-0">
                {/* Reason and when */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-bold text-black">{reasonLabel(r.reason)}</p>
                  <p className="text-xs text-passive">#{r.id} · {when(r.createdAt)}</p>
                </div>
                {r.details && <p className="mt-2 text-black/80 wrap-break-word">“{r.details}”</p>}
                <p className="mt-1 text-xs text-passive">Reported by {r.reporter?.name}</p>

                {/* What was reported: a product, or an order */}
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {r.product ? (
                    <div className="flex gap-3 bg-surface rounded-xl p-3 min-w-0">
                      <Thumb src={r.product.imageUrl} alt={r.product.name} />
                      <div className="min-w-0">
                        <Link to={`/product/${r.product.id}`} target="_blank" className="font-bold underline break-words">
                          {r.product.name}
                        </Link>
                        {!r.product.isActive && <span className="ml-2 text-xs text-danger">Removed</span>}
                        <p className="text-xs text-black/70 mt-1">
                          {formatPeso(r.product.price)} · {Number(r.product.weightKg)} kg · delivery {formatPeso(r.product.deliveryFee)}
                        </p>
                        <p className={`text-xs mt-0.5 ${overCap ? "text-danger font-bold" : "text-black/60"}`}>
                          Fair maximum for {Number(r.product.weightKg)} kg: {formatPeso(r.maxDeliveryFee)}
                          {overCap ? " (above the guide)" : ""}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-surface rounded-xl p-3">
                      <p className="font-bold">Order #{r.orderId}</p>
                      <p className="text-xs text-black/60 mt-1">Reported from the buyer's order page</p>
                    </div>
                  )}

                  {/* The store and its report history */}
                  <div className="bg-surface rounded-xl p-3 min-w-0">
                    <p className="font-bold break-words">
                      {r.seller?.storeName || r.seller?.name}
                      {r.seller?.accountStatus !== "VERIFIED" && (
                        <span className="ml-2 text-xs text-danger">{r.seller?.accountStatus === "REJECTED" ? "Suspended" : r.seller?.accountStatus}</span>
                      )}
                    </p>
                    <p className="text-xs text-black/60">Owner: {r.seller?.name}</p>
                    <p className="text-xs mt-1">
                      History: <b>{r.sellerHistory.open}</b> open · <b>{r.sellerHistory.upheld}</b> acted on · {r.sellerHistory.dismissed} dismissed
                    </p>
                  </div>
                </div>

                {/* Decision buttons, or what was decided */}
                {r.status === "OPEN" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {ACTIONS.filter((a) => !a.product || r.product).map((a) => (
                      <button
                        key={a.key}
                        onClick={() => {
                          setNote("");
                          setDeciding({ report: r, action: a });
                        }}
                        className={`rounded-full px-4 py-2 text-xs font-bold ${
                          a.tone === "danger" ? "bg-danger text-white" : a.key === "DISMISS" ? "bg-surface text-black" : "btn-primary"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-black/70">
                    <b>{REPORT_ACTION_LABEL[r.action] || r.action}</b> by {r.handledBy?.name || "staff"} on {when(r.handledAt)}
                    {r.adminNote && <span className="block mt-1 wrap-break-word">Note: {r.adminNote}</span>}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Pagination paged={paged} label="reports" />

      {/* Decision dialog — a note is required for anything but dismiss */}
      <ConfirmModal
        open={!!deciding}
        title={deciding ? `${deciding.action.label}?` : ""}
        message={deciding?.action.help}
        confirmLabel={deciding?.action.label}
        tone={deciding?.action.tone}
        size="md"
        busy={busy}
        confirmDisabled={needsNote && note.trim().length < 5}
        onConfirm={decide}
        onCancel={() => setDeciding(null)}
      >
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder={needsNote ? "Note for the seller (required), e.g. Fee is above the guide for 1 kg" : "Note for the buyer (optional)"}
          aria-label="Decision note"
          className="w-full px-5 py-3 font-body text-sm rounded-xl resize-y"
        />
      </ConfirmModal>
    </div>
  );
};

export default Reports;
