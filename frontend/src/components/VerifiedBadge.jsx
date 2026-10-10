import verifiedIcon from "../assets/icons/verified.svg";
// Small badge - icon plus label, use wherever verified status shows
const VerifiedBadge = (props) => {
  // Label defaults when caller passes nothing
  const label = props.label || "Verified Local Vendor";
  return (
    <span className="inline-flex items-center gap-1">
      <img src={verifiedIcon} alt="Verified" className="w-4 h-4" />
      <span className="font-body text-xs text-primary">{label}</span>
    </span>
  );
};
export default VerifiedBadge;
