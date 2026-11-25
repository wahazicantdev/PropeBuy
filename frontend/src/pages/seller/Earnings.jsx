import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import FieldLabel from "../../components/FieldLabel.jsx";
import Spinner from "../../components/Spinner.jsx";
import Icon from "../../components/Icon.jsx";
import { fetchMyEarnings, savePayoutAccount } from "../../api/payout.api.js";
import { formatPeso } from "../../utils/format.js";

// Status chip text and colors for each earning
const STATUS = {
  ON_HOLD: { label: "On hold", cls: "bg-surface text-black/70" },
  AVAILABLE: { label: "Available", cls: "bg-black text-white" },
  PAID_OUT: { label: "Paid out", cls: "bg-success/10 text-success" },
  REFUND_DUE: { label: "Refund pending", cls: "bg-danger/10 text-danger" },
  REFUNDED: { label: "Refunded to buyer", cls: "bg-danger/10 text-danger" },
};

// Percent label, e.g. 0.05 -> "5%"
const pct = (r) => `${+(r * 100).toFixed(2)}%`;

// Seller Earnings — where online payments go, the commission, BIR
// withholding (RR 16-2023, not a PropeBuy charge) and payouts
const Earnings = () => {
  const [data, setData] = useState(null);
  // GCash payout account form
  const [gcashName, setGcashName] = useState("");
  const [gcashNumber, setGcashNumber] = useState("");
  const [saving, setSaving] = useState(false);

  // Load everything once
  const load = () =>
    fetchMyEarnings()
      .then((res) => {
        setData(res.data);
        setGcashName(res.data.account.gcashName);
        setGcashNumber(res.data.account.gcashNumber);
      })
      .catch(() => toast.error("Could not load your earnings"));
  useEffect(() => {
    load();
  }, []);

  // Save the GCash account
  const saveAccount = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await savePayoutAccount(gcashName, gcashNumber);
      toast.success(res.message);
      setData((d) => ({ ...d, account: res.data }));
      setGcashNumber(res.data.gcashNumber);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save your GCash account");
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner /> Loading earnings...
      </div>
    );
  }

  const { balances, year, rates, earnings, payouts, account } = data;

  return (
    <div className="page-enter">
      <PageHeader
        title="Earnings"
        subtitle="Money from online payments. Cash payments go straight to you and never show here."
      />

      {/* No account yet — payouts cannot be sent */}
      {!account.gcashNumber && (
        <div className="mb-5 rounded-xl border border-black bg-black/[0.03] p-4 font-body text-sm flex items-start gap-3">
          <Icon name="warning" className="mt-px" />
          <span>Add your GCash number below so PropeBuy can send your earnings.</span>
        </div>
      )}

      {/* ── Balances ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard tone="dark" icon="account_balance_wallet" label="Available" value={formatPeso(balances.available)} hint="Included in the next payout" />
        <StatCard icon="schedule" label="On hold" value={formatPeso(balances.onHold)} hint="Released when you fulfil the order" />
        <StatCard icon="savings" label="Paid out" value={formatPeso(balances.paidOut)} hint="Sent to your GCash" />
        <StatCard icon="request_quote" label={`Fees this year`} value={formatPeso(year.commission)} hint={`BIR withholding: ${formatPeso(year.withholdingTax)}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* ── Earnings list ── */}
        <section className="min-w-0">
          <h2 className="heading-body text-lg font-bold mb-3">Online payments</h2>
          {earnings.length === 0 ? (
            <div className="rounded-xl bg-surface p-8 text-center font-body text-sm text-passive">
              No online payments yet. GCash orders and prepaid delivery fees appear here.
            </div>
          ) : (
            <div className="rounded-xl border border-black/10 overflow-hidden">
              {/* Desktop table */}
              <table className="hidden md:table w-full font-body text-sm">
                <thead className="bg-surface text-left text-xs text-passive">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium text-right">Paid online</th>
                    <th className="px-4 py-3 font-medium text-right">Commission</th>
                    <th className="px-4 py-3 font-medium text-right">BIR withholding</th>
                    <th className="px-4 py-3 font-medium text-right">You get</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map((e) => (
                    <tr key={e.id} className="border-t border-black/5">
                      <td className="px-4 py-3">
                        <Link to={`/seller/orders/${e.orderId}`} className="font-bold hover:underline">#{e.orderId}</Link>
                        <span className="block text-xs text-passive">
                          {e.order.paymentMethod === "GCASH" ? "GCash order" : "Delivery fee only"} ·{" "}
                          {new Date(e.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatPeso(Number(e.itemsAmount) + Number(e.deliveryFee))}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-passive">{Number(e.commission) ? `−${formatPeso(e.commission)}` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-passive">{Number(e.withholdingTax) ? `−${formatPeso(e.withholdingTax)}` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold">{formatPeso(e.netAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${STATUS[e.status].cls}`}>{STATUS[e.status].label}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Phone cards */}
              <ul className="md:hidden divide-y divide-black/5">
                {earnings.map((e) => (
                  <li key={e.id} className="p-4 font-body text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <Link to={`/seller/orders/${e.orderId}`} className="font-bold">Order #{e.orderId}</Link>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS[e.status].cls}`}>{STATUS[e.status].label}</span>
                    </div>
                    <div className="mt-2 flex justify-between text-passive text-xs">
                      <span>Paid {formatPeso(Number(e.itemsAmount) + Number(e.deliveryFee))} · commission {formatPeso(e.commission)}{Number(e.withholdingTax) ? ` · BIR withholding ${formatPeso(e.withholdingTax)}` : ""}</span>
                      <span className="font-bold text-black text-sm">{formatPeso(e.netAmount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Payout history ── */}
          <h2 className="heading-body text-lg font-bold mt-8 mb-3">Payouts received</h2>
          {payouts.length === 0 ? (
            <div className="rounded-xl bg-surface p-6 text-center font-body text-sm text-passive">No payouts yet.</div>
          ) : (
            <ul className="rounded-xl border border-black/10 divide-y divide-black/5">
              {payouts.map((p) => (
                <li key={p.id} className="p-4 flex items-center justify-between gap-3 font-body text-sm">
                  <span className="min-w-0">
                    <span className="block font-bold">{formatPeso(p.amount)} to {p.gcashNumber}</span>
                    <span className="block text-xs text-passive truncate">
                      Ref {p.referenceNo} · {new Date(p.createdAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                    </span>
                  </span>
                  <Icon name="check_circle" className="text-success" />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Side column: payout account and how it works ── */}
        <aside className="space-y-6">
          <form onSubmit={saveAccount} className="rounded-xl border border-black/10 p-5 space-y-4">
            <h2 className="heading-body text-lg font-bold flex items-center gap-2">
              <Icon name="account_balance" /> GCash payout account
            </h2>
            <div>
              <FieldLabel htmlFor="gcashName">Account name</FieldLabel>
              <input id="gcashName" value={gcashName} onChange={(e) => setGcashName(e.target.value)} maxLength={100} placeholder="Name registered in GCash" className="w-full px-5 py-3 font-body text-sm" />
            </div>
            <div>
              <FieldLabel htmlFor="gcashNumber">GCash number</FieldLabel>
              <input id="gcashNumber" value={gcashNumber} onChange={(e) => setGcashNumber(e.target.value)} inputMode="numeric" maxLength={13} placeholder="09XXXXXXXXX" className="w-full px-5 py-3 font-body text-sm" />
            </div>
            <button disabled={saving} className="btn-primary btn-active w-full py-3 font-body text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Spinner /> : <Icon name="check_circle" size={18} />}
              {saving ? "Saving..." : "Save account"}
            </button>
          </form>

          <div className="rounded-xl bg-surface p-5 font-body text-sm space-y-3">
            <h2 className="heading-body text-lg font-bold">How you get paid</h2>
            <ol className="space-y-2 list-decimal pl-5 text-black/80">
              <li>The buyer pays online. PropeBuy holds the money so the buyer is protected.</li>
              <li>You fulfil the order. The money becomes available.</li>
              <li>PropeBuy sends your available balance to your GCash and you get a notice with the reference number.</li>
            </ol>
            <ul className="space-y-1.5 text-black/70 text-xs border-t border-black/10 pt-3">
              <li><b>{pct(rates.commissionRate)}</b> commission on items paid online. It covers the GCash processing fee and running PropeBuy.</li>
              <li><b>0%</b> on cash payments, and delivery fees are 100% yours.</li>
              <li><b>BIR withholding</b> of 1% on half your earnings ({pct(rates.withholdingRate)}) applies only after your yearly online item earnings pass {formatPeso(rates.withholdingThreshold)}, as required by BIR RR 16-2023. Delivery fees are not counted and never withheld. It is not a PropeBuy charge: it goes to the BIR and counts as advance payment of your own income tax.</li>
              <li>Listing products is always free.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Earnings;
