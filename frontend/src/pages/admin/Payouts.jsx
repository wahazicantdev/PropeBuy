import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import FieldLabel from "../../components/FieldLabel.jsx";
import Spinner from "../../components/Spinner.jsx";
import { fetchPayoutOverview, recordPayout, markRefundDone } from "../../api/payout.api.js";
import { formatPeso } from "../../utils/format.js";
import Pagination from "../../components/Pagination.jsx";
import { usePaged } from "../../hooks/usePaged.js";

// Percent label, e.g. 0.05 -> "5%"
const pct = (r) => `${+(r * 100).toFixed(2)}%`;

// Admin Payouts — pay sellers their online earnings, track refunds and
// PropeBuy's own commission income
const Payouts = () => {
  const [data, setData] = useState(null);
  // Seller row being paid, and the reference typed in the modal
  const [paying, setPaying] = useState(null);
  const [reference, setReference] = useState("");
  // Refund row being confirmed
  const [refund, setRefund] = useState(null);
  // Reference number of the refund the admin already sent
  const [refundRef, setRefundRef] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetchPayoutOverview()
      .then((res) => setData(res.data))
      .catch(() => toast.error("Could not load payouts"));
  useEffect(() => {
    load();
  }, []);

  // Record a transfer the admin already sent in GCash
  const confirmPayout = async () => {
    setBusy(true);
    try {
      const res = await recordPayout(paying.sellerId, reference);
      toast.success(res.message);
      setPaying(null);
      setReference("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not record the payout");
    } finally {
      setBusy(false);
    }
  };

  // Mark a buyer refund as done
  const confirmRefund = async () => {
    setBusy(true);
    try {
      const res = await markRefundDone(refund.id, refundRef);
      toast.success(res.message);
      setRefund(null);
      setRefundRef("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update the refund");
    } finally {
      setBusy(false);
    }
  };

  // At most 50 rows per page (11-26)
  const paged = usePaged(data?.toPay || [], "");

  if (!data) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner /> Loading payouts...
      </div>
    );
  }

  const { month, toPay, refunds, recent, onHold, rates } = data;
  const totalToPay = toPay.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="page-enter">
      <PageHeader
        title="Payouts"
        subtitle={`Online payments land in PropeBuy's PayMongo account first. Send each seller's share, minus the ${pct(rates.commissionRate)} commission, after the order is fulfilled.`}
      />

      {/* ── This month ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard tone="dark" icon="payments" label="To pay sellers" value={formatPeso(totalToPay)} hint={`${toPay.length} seller(s) waiting`} />
        <StatCard icon="schedule" label="On hold" value={formatPeso(onHold)} hint="Orders not fulfilled yet" />
        <StatCard icon="request_quote" label="Commission this month" value={formatPeso(month.commission)} hint={`From ${formatPeso(month.onlineSales)} online sales`} />
        <StatCard icon="savings" label="PropeBuy net this month" value={formatPeso(month.platformNet)} hint={`After about ${formatPeso(month.gatewayFees)} PayMongo fees`} />
      </div>

      {/* ── Sellers to pay and refunds due, side by side on wide screens ── */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2 items-start">
        {/* ── Sellers to pay ── */}
        <section className="min-w-0">
          <h2 className="heading-body text-lg font-bold mb-1">Sellers to pay</h2>
          <p className="font-body text-xs text-passive mb-3">
            Fulfilled online orders. Send the seller's share to their GCash, then record the reference number.
          </p>
          {toPay.length === 0 ? (
            <div className="rounded-xl bg-surface p-8 text-center font-body text-sm text-passive">Nothing to pay right now.</div>
          ) : (
            <ul className="rounded-xl border border-black/10 divide-y divide-black/5">
              {paged.pageItems.map((s) => (
                <li key={s.sellerId} className="p-4 flex items-center gap-3 font-body text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">{s.name}</p>
                    <p className="text-xs text-passive">
                      {s.gcashNumber ? `GCash ${s.gcashNumber} · ${s.gcashName}` : "No GCash account yet. Ask the seller to add one in Earnings."}
                    </p>
                    <p className="text-xs text-passive">
                      {s.orders} order(s){s.withholdingTax ? ` · BIR withholding ${formatPeso(s.withholdingTax)}` : ""}
                    </p>
                  </div>
                  {/* Amount above its button, so the row fits half a screen */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <p className="font-bold text-lg tabular-nums">{formatPeso(s.amount)}</p>
                    <button
                      disabled={!s.gcashNumber}
                      onClick={() => setPaying(s)}
                      className="btn-primary btn-active px-4 py-2 font-body text-sm font-medium disabled:opacity-40"
                    >
                      Record payout
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Pagination paged={paged} label="sellers" />
        </section>

        {/* ── Refunds due ── */}
        <section className="min-w-0">
          <h2 className="heading-body text-lg font-bold mb-1">Refunds due</h2>
          <p className="font-body text-xs text-passive mb-3">
            Orders cancelled after the buyer paid online. Send the amount back to the buyer's GCash, then record the reference number. The buyer gets a notice with it.
          </p>
          {refunds.length === 0 ? (
            <div className="rounded-xl bg-surface p-6 text-center font-body text-sm text-passive">No refunds due.</div>
          ) : (
            <div className="space-y-4">
              {/* Ready first: the buyer already gave a GCash number. Newest on top in each group. */}
              {[
                { key: "ready", title: "Ready to refund", hint: "The buyer added their GCash", rows: refunds.filter((r) => r.refundGcashNumber) },
                { key: "waiting", title: "Waiting for the buyer's GCash", hint: "The buyer was asked on their order page", rows: refunds.filter((r) => !r.refundGcashNumber) },
              ]
                .filter((g) => g.rows.length > 0)
                .map((g) => (
                  <div key={g.key}>
                    <p className="font-body text-xs font-bold uppercase tracking-wide text-passive mb-2">
                      {g.title} ({g.rows.length}) <span className="normal-case font-normal tracking-normal">· {g.hint}</span>
                    </p>
                    <ul className="rounded-xl border border-black/10 divide-y divide-black/5">
                      {g.rows.map((r) => (
                        <li key={r.id} className="p-4 flex items-center gap-3 font-body text-sm">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold">Order #{r.orderId} · {r.order.buyer.name}</p>
                            <p className="text-xs text-passive truncate">{r.order.buyer.email}</p>
                            <p className="text-xs text-passive truncate">seller {r.seller.storeName || r.seller.name}{r.seller.storeName ? ` (${r.seller.name})` : ""}</p>
                            {/* Buyer's refund GCash, or a note that they have not added it yet */}
                            {r.refundGcashNumber ? (
                              <p className="text-xs mt-1">
                                GCash <span className="font-bold tabular-nums">{r.refundGcashNumber}</span> · {r.refundGcashName}
                              </p>
                            ) : (
                              <p className="text-xs mt-1 text-danger">Waiting for the buyer's GCash number</p>
                            )}
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <p className="font-bold tabular-nums">{formatPeso(Number(r.itemsAmount) + Number(r.deliveryFee))}</p>
                            <button onClick={() => setRefund(r)} className="btn-outline btn-active px-4 py-2 font-body text-sm font-medium">
                              Record refund
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Recent payouts ── */}
      <h2 className="heading-body text-lg font-bold mt-8 mb-3">Recent payouts</h2>
      {recent.length === 0 ? (
        <div className="rounded-xl bg-surface p-6 text-center font-body text-sm text-passive">No payouts recorded yet.</div>
      ) : (
        <div className="rounded-xl border border-black/10 overflow-x-auto">
          <table className="w-full min-w-[36rem] font-body text-sm">
            <thead className="bg-surface text-left text-xs text-passive">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">GCash</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.id} className="border-t border-black/5">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}</td>
                  <td className="px-4 py-3">{p.seller.storeName || p.seller.name}{p.seller.storeName && <span className="block text-xs text-passive">{p.seller.name}</span>}</td>
                  <td className="px-4 py-3">{p.gcashNumber}</td>
                  <td className="px-4 py-3">{p.referenceNo} <span className="text-xs text-passive">by {p.admin.name}</span></td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">{formatPeso(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record payout — the admin sends the money first, then saves the reference */}
      <ConfirmModal
        open={!!paying}
        tone="primary"
        size="md"
        title="Record payout"
        message={paying ? `Send ${formatPeso(paying.amount)} to ${paying.gcashName} (GCash ${paying.gcashNumber}) first, then type the reference number from GCash.` : ""}
        confirmLabel="Save payout"
        busy={busy}
        confirmDisabled={reference.trim().length < 4}
        onConfirm={confirmPayout}
        onCancel={() => {
          setPaying(null);
          setReference("");
        }}
      >
        <FieldLabel htmlFor="ref">GCash reference number</FieldLabel>
        <input id="ref" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={50} placeholder="Example: 1009 234 567890" className="w-full px-5 py-3 font-body text-sm" />
      </ConfirmModal>

      {/* Record refund — the admin sends the money first, then saves the reference.
          PayMongo only refunds live payments, and not every QR Ph payment,
          so a GCash transfer to the buyer is the method that always works. */}
      <ConfirmModal
        open={!!refund}
        tone="primary"
        size="md"
        title="Record refund"
        message={
          refund
            ? refund.refundGcashNumber
              ? `Send ${formatPeso(Number(refund.itemsAmount) + Number(refund.deliveryFee))} to GCash ${refund.refundGcashNumber} (${refund.refundGcashName}) first, then type the reference number. The number is deleted once you save.`
              : `${refund.order.buyer.name} has not added a GCash number yet. They were asked on their order page and you get a notice when they do. If you already sent ${formatPeso(Number(refund.itemsAmount) + Number(refund.deliveryFee))} another way, type the reference number.`
            : ""
        }
        confirmLabel="Save refund"
        busy={busy}
        confirmDisabled={refundRef.trim().length < 4}
        onConfirm={confirmRefund}
        onCancel={() => {
          setRefund(null);
          setRefundRef("");
        }}
      >
        <FieldLabel htmlFor="refund-ref">Refund reference number</FieldLabel>
        <input id="refund-ref" value={refundRef} onChange={(e) => setRefundRef(e.target.value)} maxLength={50} placeholder="Example: 1009 234 567890" className="w-full px-5 py-3 font-body text-sm" />
      </ConfirmModal>
    </div>
  );
};

export default Payouts;
