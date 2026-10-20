// Stock badge — same pill shape as the OrderStatus components
// Thresholds match the backend: low stock means 3 or fewer
const StockPill = ({ stock }) => {
  // Sold out — solid danger, strongest signal on the page
  if (stock === 0) {
    return (
      <span className="font-body text-xs font-bold rounded-full px-3 py-1 bg-danger text-white">
        Out of stock
      </span>
    );
  }
  // Low — soft danger, restock soon (backend uses lte 3)
  if (stock <= 3) {
    return (
      <span className="font-body text-xs font-bold rounded-full px-3 py-1 bg-danger/10 text-danger">
        Low — {stock} left
      </span>
    );
  }
  // Healthy — passive gray
  return (
    <span className="font-body text-xs font-bold rounded-full px-3 py-1 bg-gray-100 text-gray-700">
      {stock} in stock
    </span>
  );
};

export default StockPill;