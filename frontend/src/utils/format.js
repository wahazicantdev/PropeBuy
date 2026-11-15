// Peso price — whole pesos stay clean, centavos show when present.
// One formatter for every price on the public pages.
export const formatPeso = (value) => {
  const n = Number(value);
  return `₱${n.toLocaleString("en-PH", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};
