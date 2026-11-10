// Visible field label — stays readable after the user starts typing
const FieldLabel = ({ htmlFor, children }) => (
  <label
    htmlFor={htmlFor}
    className="block font-body text-sm font-bold text-black mb-1.5"
  >
    {children}
  </label>
);

export default FieldLabel;
