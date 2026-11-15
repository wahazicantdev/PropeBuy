import Icon from "./Icon.jsx";

// Number tile for dashboards — label, big value, optional hint line.
// tone "dark" is the one highlighted tile per row (black card).
const StatCard = ({ icon, label, value, hint, tone = "light" }) => {
  const dark = tone === "dark";
  return (
    <div className={`rounded-xl p-5 min-w-0 ${dark ? "bg-black text-white" : "bg-white border border-black/10"}`}>
      <div className={`flex items-center gap-2 font-body text-sm ${dark ? "text-white/70" : "text-passive"}`}>
        {icon && <Icon name={icon} size={18} />}
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-2 font-body text-2xl md:text-[1.7rem] font-bold tabular-nums truncate">{value}</p>
      {hint && <p className={`mt-1 font-body text-xs ${dark ? "text-white/60" : "text-black/50"}`}>{hint}</p>}
    </div>
  );
};

export default StatCard;
