import Icon from "./Icon.jsx";

// Step indicator for multi-step forms (register, add product).
// steps: ["Account", "Email", ...]. current: 0-based index.
// onJump(i) is optional: when given, finished steps can be tapped.
// jumpAll lets every step be tapped (edit forms that are already filled).
const Stepper = ({ steps, current, onJump, jumpAll = false }) => (
  <ol className="flex items-start w-full" aria-label="Progress">
    {steps.map((label, i) => {
      const done = i < current;
      const active = i === current;
      // Only finished steps are clickable, and only if the page allows it
      const canJump = !!onJump && i !== current && (jumpAll || i < current);
      return (
        <li key={label} className="flex-1 flex flex-col items-center relative min-w-0">
          {/* Line to the previous step — black once that step is done */}
          {i > 0 && (
            <span
              aria-hidden="true"
              className={`absolute top-4 right-1/2 w-full h-0.5 -z-0 ${i <= current ? "bg-black" : "bg-black/10"}`}
            />
          )}
          <button
            type="button"
            disabled={!canJump}
            onClick={() => canJump && onJump(i)}
            aria-current={active ? "step" : undefined}
            className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-body text-sm font-bold transition-colors ${
              done || active ? "bg-black text-white" : "bg-surface text-black/40"
            } ${canJump ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
          >
            {done ? <Icon name="check" size={18} /> : i + 1}
          </button>
          {/* Label — short words so 4 steps fit on a phone */}
          <span
            className={`mt-2 font-body text-[11px] sm:text-xs text-center leading-tight px-1 ${active ? "text-black font-bold" : "text-black/50"}`}
          >
            {label}
          </span>
        </li>
      );
    })}
  </ol>
);

export default Stepper;
