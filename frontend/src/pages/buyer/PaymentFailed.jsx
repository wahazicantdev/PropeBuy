import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

// Payment failure page - PayMongo sends cancelled GCash attempts here
const PaymentFailed = () => {
  // Remembered order prefers URL, localStorage is the fallback
  const [urlParams] = useSearchParams();
  const [orderId] = useState(
    () =>
      urlParams.get("orderId") || localStorage.getItem("propebuy_last_order"),
  );

  return (
    <div className="min-h-screen bg-white page-enter">
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        {/* Bold header, plain bad news */}
        <h1 className="font-header font-bold text-2xl text-gray-900">
          Payment did not push through
        </h1>
        {/* Honest plain words, no blame */}
        <p className="font-body text-sm text-passive mt-2">
          No money was taken by us. Your order is still reserved while stock
          lasts. Try again or pay cash instead.
        </p>
        {/* Recovery paths */}
        <div className="mt-6 flex flex-col gap-3">
          {orderId && (
            <Link
              to={`/orders/${orderId}`}
              className="bg-primary text-white font-body py-3 rounded-lg"
            >
              View My Order
            </Link>
          )}
          <Link
            to="/cart"
            className="border border-gray-200 font-body py-3 rounded-lg text-gray-900"
          >
            Back to Cart
          </Link>
          <Link to="/browse" className="font-body text-sm text-primary">
            Back to browse
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PaymentFailed;
