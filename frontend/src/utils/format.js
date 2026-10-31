// Peso price — whole pesos stay clean, centavos show when present.
// One formatter for every price on the public pages.
export const formatPeso = (value) =>
  `₱${Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
