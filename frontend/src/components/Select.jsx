import { useEffect, useRef, useState } from "react";

// Custom dropdown — styleable list, native select cannot do this
const Select = ({ value, onChange, options = [], ariaLabel = "Select" }) => {
  // Open state for the floating list
  const [open, setOpen] = useState(false);
  // Ref for outside-tap detection
  const boxRef = useRef(null);
  // Current selection for the trigger label
  const selected = options.find((o) => String(o.value) === String(value));

  // Close on outside tap or Escape key
  useEffect(() => {
    // Taps outside the box shut the list
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    // Escape key shuts the list too
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    // Cleanup both listeners on unmount
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    // Relative shell so the list anchors under the trigger
    <div ref={boxRef} className="relative w-full">
      {/* Trigger — reuses the global selector look */}
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="select select-trigger flex items-center justify-between gap-2 text-left"
      >
        {/* Shown label with fallback */}
        <span className="truncate">
          {selected ? selected.label : options[0]?.label || "Select"}
        </span>
        {/* Chevron that flips when open */}
        <svg
          className={`w-4 h-4 shrink-0 text-primary transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {/* List — margin below trigger, same radius, pops in */}
      {open && (
        <ul className="pop-enter absolute left-0 right-0 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg z-30 max-h-64 overflow-y-auto">
          {options.map((o) => {
            // Active check for the current pick
            const active = String(o.value) === String(value);
            return (
              <li key={String(o.value) + o.label}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 font-body text-sm transition-colors ${active ? "bg-primary text-white font-bold" : "text-gray-900 hover:bg-primary hover:text-white"}`}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Select;
