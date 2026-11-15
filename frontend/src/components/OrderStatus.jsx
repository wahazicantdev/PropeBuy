// Color maps - primary for good states, gray for waiting, red for bad
const ORDER_STYLES = {
  RESERVED: "bg-surface text-black/70", // placed, waiting on seller
  PROCESSING: "bg-primary/10 text-primary", // seller working on it
  FULFILLED: "bg-primary text-white", // done and handed over
  CANCELLED: "bg-danger/10 text-danger", // dead order
};
const ORDER_LABELS = {
  RESERVED: "Reserved",
  PROCESSING: "Processing",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
};
const PAYMENT_STYLES = {
  PENDING: "bg-surface text-black/70", // waiting on money
  PAID: "bg-primary text-white", // money confirmed
  FAILED: "bg-danger text-white", // money failed
};

// Order status pill - tiny rounded label
export const OrderPill = ({ status }) => {
  return (
    <span
      className={`font-body text-xs font-bold rounded-full px-2.5 py-1 whitespace-nowrap ${ORDER_STYLES[status] || ORDER_STYLES.RESERVED}`}
    >
      {ORDER_LABELS[status] || status}
    </span>
  );
};

// Payment status pill - same shape, money colors
export const PaymentPill = ({ status }) => {
  return (
    <span
      className={`font-body text-xs font-bold rounded-full px-2.5 py-1 whitespace-nowrap ${PAYMENT_STYLES[status] || PAYMENT_STYLES.PENDING}`}
    >
      {status === "PAID" ? "Paid" : status === "FAILED" ? "Failed" : "Pending"}
    </span>
  );
};
