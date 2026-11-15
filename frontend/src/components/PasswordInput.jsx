import { useState } from "react";
import Icon from "./Icon.jsx";

// Password field with a show/hide eye button.
// Takes react-hook-form's register() props directly (React 19 passes
// ref as a normal prop), so pages swap <input type="password"> for this.
const PasswordInput = ({ id, placeholder, autoComplete, ref, ...field }) => {
  // false = dots, true = plain text
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      {/* Lock icon on the left, same as the other auth fields */}
      <Icon name="lock" className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none" />
      <input
        {...field}
        ref={ref}
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full pl-13 pr-14 py-3.5 font-body text-sm"
      />
      {/* Eye button — type="button" so it never submits the form */}
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-black/50 hover:text-black hover:bg-black/5"
      >
        <Icon name={show ? "visibility_off" : "visibility"} />
      </button>
    </div>
  );
};

export default PasswordInput;
