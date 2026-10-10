import { useParams, Link } from "react-router-dom";
import PublicNav from "../../components/PublicNav.jsx";

// Public seller store — placeholder shell, full listing lands after Phase C
const SellerStore = () => {
  // Seller id from URL /store/:sellerId
  const { sellerId } = useParams();

  return (
    // Public root with entrance animation
    <div className="min-h-screen bg-white page-enter">
      <PublicNav />
      <main className="max-w-7xl mx-auto px-4 py-10 text-center">
        {/* Bold header, plain words */}
        <h1 className="font-header font-bold text-2xl text-gray-900">
          Seller store
        </h1>
        <p className="font-body text-sm text-passive mt-2">
          Store #{sellerId} product list opens here after Phase C.
        </p>
        {/* Way back to shopping */}
        <Link
          to="/browse"
          className="btn-active inline-block mt-6 bg-primary text-white font-body px-6 py-3 rounded-lg"
        >
          Back to browse
        </Link>
      </main>
    </div>
  );
};

export default SellerStore;
