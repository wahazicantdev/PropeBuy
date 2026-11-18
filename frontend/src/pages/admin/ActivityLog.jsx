import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader.jsx";
import FilterChips from "../../components/FilterChips.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Spinner from "../../components/Spinner.jsx";
import { fetchActivity } from "../../api/admin.api.js";
import { LEVEL_LABEL } from "../../utils/adminAccess.js";

// "USER_APPROVED" -> "User approved"
const actionLabel = (a) => a.charAt(0) + a.slice(1).toLowerCase().replace(/_/g, " ");

// Activity log — every admin action with who did it and when, so the
// super admin can trace any approval, suspension, refund or payout
// back to a person (Yoy, 11-18). Read-only: nothing here can be edited.
const ActivityLog = () => {
  // Chosen action chip, "all" for everything
  const [action, setAction] = useState("all");
  // { logs, actions }, null while loading
  const [data, setData] = useState(null);

  // Load on mount and on every chip change
  useEffect(() => {
    fetchActivity(action === "all" ? null : action)
      .then((res) => setData(res.data))
      .catch(() => toast.error("Could not load the activity log"));
  }, [action]);

  if (!data) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner /> Loading activity...
      </div>
    );
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Activity log"
        subtitle="Every approval, rejection, suspension, removal, refund, payout and staff change, with who did it. The latest 200 are shown."
      />

      <FilterChips
        value={action}
        onChange={setAction}
        options={[{ key: "all", label: "All" }, ...data.actions.map((a) => ({ key: a, label: actionLabel(a) }))]}
      />

      {data.logs.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon="flag" title="No activity yet" text="Admin actions appear here as soon as they happen." />
        </div>
      ) : (
        <ul className="mt-5 rounded-xl border border-black/10 divide-y divide-black/5">
          {data.logs.map((l) => (
            <li key={l.id} className="p-4 grid gap-1 sm:grid-cols-[170px_1fr] sm:gap-4 font-body text-sm min-w-0">
              {/* When */}
              <span className="text-xs text-passive tabular-nums">
                {new Date(l.createdAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
              </span>
              {/* Who did what, and to what */}
              <span className="min-w-0">
                <span className="font-bold">{actionLabel(l.action)}</span>
                {l.details && <span className="text-black/70 wrap-break-word"> · {l.details}</span>}
                <span className="block text-xs text-passive mt-0.5">
                  by {l.admin?.name || "Unknown"}
                  {l.admin?.adminLevel ? ` (${LEVEL_LABEL[l.admin.adminLevel]})` : ""}
                  {l.targetId ? ` · ${l.targetType.toLowerCase()} #${l.targetId}` : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActivityLog;
