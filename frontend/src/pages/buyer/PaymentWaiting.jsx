import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Spinner from "../../components/Spinner.jsx";
import { checkPayment } from "../../api/order.api.js";

// Waiting room - polls while the buyer pays in the PayMongo tab
const PaymentWaiting = () => {
  // Order id from the checkout handoff URL
  const [urlParams] = useSearchParams();
  const [orderId] = useState(
    () =>
      urlParams.get("orderId") || localStorage.getItem("propebuy_last_order"),
  );
  // Manual recheck spinner
  const [checking, setChecking] = useState(false);
  // Attempt counter ref, no re-render needed
  const tries = useRef(0);
  const navigate = useNavigate();

  // Single status check shared by poller and button
  const probe = async () => {
    // Returns PAID, PENDING, or FAILED string, null on network error
    try {
      const res = await checkPayment(orderId);
      return res.data?.paymentStatus || "PENDING";
    } catch {
      return null;
    }
  };

  // Route helper - paid goes success, failed goes failed page
  const route = (status) => {
    if (status === "PAID")
      navigate(`/payment/success?orderId=${orderId}`, { replace: true });
    else if (status === "FAILED")
      navigate(`/payment/failed?orderId=${orderId}`, { replace: true });
  };

  // Auto poll every 3 seconds, 100 tries is 5 minutes
  useEffect(() => {
    // Nothing to watch without an order
    if (!orderId) return;
    const timer = setInterval(async () => {
      tries.current += 1;
      // Ask PayMongo through the backend
      const status = await probe();
      // Terminal states leave immediately
      if (status === "PAID" || status === "FAILED") {
        clearInterval(timer);
        route(status);
      } else if (tries.current >= 100) {
        // Five minutes with no money means give up to failed page
        clearInterval(timer);
        navigate(`/payment/failed?orderId=${orderId}`, { replace: true });
      }
      // Pending or null keeps waiting silently
    }, 3000);
    // Cleanup timer on unmount
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Manual recheck button - one probe now
  const recheck = async () => {
    setChecking(true);
    // Single probe outside the timer
    const status = await probe();
    setChecking(false);
    if (!status) return toast.error("Could not reach the payment provider");
    if (status === "PENDING")
      return toast("Still waiting for your GCash payment");
    route(status);
  };

  // No order means wrong entry, send back to shopping
  if (!orderId) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <h1 className="font-header font-bold text-2xl text-gray-900">
            No payment to watch
          </h1>
          <Link
            to="/browse"
            className="btn-active inline-block mt-6 bg-primary text-white font-body px-6 py-3 rounded-lg"
          >
            Back to browse
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white page-enter">
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        {/* Bold header in plain words */}
        <h1 className="font-header font-bold text-2xl text-gray-900">
          Waiting for your payment
        </h1>
        <p className="font-body text-sm text-passive mt-2">
          Complete the GCash payment in the new tab. Keep this page open, it
          checks automatically.
        </p>
        {/* Order reference */}
        <p className="font-body text-xs text-passive mt-2">Order #{orderId}</p>
        {/* Spinner plus manual controls */}
        <div className="mt-6 flex flex-col gap-3">
          <span
            className="spinner mx-auto"
            style={{ borderTopColor: "#05829a", width: 28, height: 28 }}
          />
          <button
            onClick={recheck}
            disabled={checking}
            className="btn-active border border-primary text-primary font-body py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {checking ? <Spinner /> : null}
            {checking ? "Checking..." : "I Already Paid - Check Now"}
          </button>
          <Link
            to={`/payment/failed?orderId=${orderId}`}
            className="font-body text-sm text-passive hover:text-danger"
          >
            Cancel payment
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PaymentWaiting;
