import Icon from "./Icon.jsx";

// Small badge - green verified mark plus label, use wherever verified
// status shows. Green is the reference's trust color and is reserved for
// this badge; the label stays in ink so small text keeps its contrast.
const VerifiedBadge = (props) => {
  // Label defaults when caller passes nothing
  const label = props.label || "Verified Local Vendor";
  return (
    <span className="inline-flex items-center gap-1">
      <Icon name="verified" size={16} className="text-success" />
      <span className="font-body text-xs font-medium text-gray-700">{label}</span>
    </span>
  );
};
export default VerifiedBadge;
