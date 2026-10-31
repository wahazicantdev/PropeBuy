import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Icon from "../../components/Icon.jsx";

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
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        {/* State icon — soft red, honest but calm */}
        <span className="inline-flex w-20 h-20 rounded-full bg-danger/10 items-center justify-center mb-6">
          <Icon name="error" size={40} className="text-danger" />
        </span>
        {/* Bold header, plain bad news */}
        <h1 className="text-2xl md:text-3xl text-black">
          Payment did not push through
        </h1>
        {/* Honest plain words, no blame */}
        <p className="font-body text-sm text-black/60 mt-3">
          No money was taken by us. Your order is still reserved while stock
          lasts. Try again or pay cash instead.
        </p>
        {/* Recovery paths */}
        <div className="mt-6 flex flex-col gap-3">
          {orderId && (
            <Link
              to={`/orders/${orderId}`}
              className="btn-primary btn-active font-body font-medium py-3.5"
            >
              View My Order
            </Link>
          )}
          <Link
            to="/cart"
            className="btn-outline btn-active font-body font-medium py-3.5"
          >
            Back to Cart
          </Link>
          <Link to="/browse" className="font-body text-sm text-black/60 hover:text-black">
            Back to browse
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PaymentFailed;
