import Icon from "./Icon.jsx";

// Empty list message — icon, one line title, one line help, optional action
const EmptyState = ({ icon = "inventory_2", title, text, action }) => (
  <div className="rounded-xl border border-dashed border-black/15 p-10 text-center">
    <span className="mx-auto w-12 h-12 rounded-full bg-surface flex items-center justify-center text-black/50">
      <Icon name={icon} size={24} />
    </span>
    <p className="heading-body text-base mt-3">{title}</p>
    {text && <p className="font-body text-sm text-passive mt-1">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
