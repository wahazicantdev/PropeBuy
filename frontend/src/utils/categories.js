// Category look-up — icon and short label for the 7 documented
// categories. Matched by keyword so an admin rename like "Food & Goods"
// still finds its icon; anything unknown falls back to the generic one.
const META = [
  { match: "food", icon: "grocery", short: "Food" },
  { match: "cloth", icon: "checkroom", short: "Apparel" },
  { match: "home", icon: "chair", short: "Home" },
  { match: "health", icon: "spa", short: "Beauty" },
  { match: "electr", icon: "devices", short: "Gadgets" },
  { match: "auto", icon: "directions_car", short: "Auto" },
];

export const categoryMeta = (name = "") => {
  const n = name.toLowerCase();
  return (
    META.find((m) => n.includes(m.match)) || { icon: "category", short: name || "Others" }
  );
};
