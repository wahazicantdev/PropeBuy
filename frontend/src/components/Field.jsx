// Field — house label-above-input wrapper
// label, field slot, and error line in one block
const Field = ({ label, error, children }) => {
  return (
    <div>
      <label className="block font-body text-xs font-bold text-primary mb-1.5">
        {label}
      </label>
      {children}
      {/* error text-danger, owned here instead of per-form */}
      {error && <p className="text-danger text-xs mt-1">{error}</p>}
    </div>
  );
};

export default Field;