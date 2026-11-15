// Filter chips with counts — one look for every list page.
// options: [{ key, label, count }]. value: active key. onChange(key).
const FilterChips = ({ options, value, onChange }) => (
  <div className="flex gap-2 overflow-x-auto pb-1 -mb-1" role="tablist">
    {options.map((o) => (
      <button
        key={o.key}
        role="tab"
        aria-selected={value === o.key}
        onClick={() => onChange(o.key)}
        className={`shrink-0 font-body text-sm font-medium rounded-full px-4 py-2 transition-colors ${
          value === o.key ? "bg-primary text-white" : "bg-surface text-black/70 hover:bg-black/10"
        }`}
      >
        {o.label}
        {o.count !== undefined && (
          <span className={`ml-1.5 text-xs ${value === o.key ? "text-white/70" : "text-black/45"}`}>{o.count}</span>
        )}
      </button>
    ))}
  </div>
);

export default FilterChips;
