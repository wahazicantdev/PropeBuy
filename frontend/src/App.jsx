import { Routes, Route } from "react-router-dom";
import BuyerLayout from "./components/layouts/BuyerLayout.jsx";
import SellerLayout from "./components/layouts/SellerLayout.jsx";
import AdminLayout from "./components/layouts/AdminLayout.jsx";
import {
  BuyerRoute,
  SellerRoute,
  AdminRoute,
} from "./routes/ProtectedRoute.jsx";
// Public pages — guests allowed, login wall lives on actions
import Landing from "./pages/public/Landing.jsx";
import Register from "./pages/public/Register.jsx";
import BuyerLogin from "./pages/public/BuyerLogin.jsx";
import SellerLogin from "./pages/public/SellerLogin.jsx";
import Browse from "./pages/public/Browse.jsx";
import ProductDetail from "./pages/public/ProductDetail.jsx";
import SellerStore from "./pages/public/SellerStore.jsx";

// Temp placeholder — cart onward still Phase C-F
const Placeholder = ({ label }) => (
  // Responsive centered text
  <div className="min-h-[50vh] flex items-center justify-center px-4 text-center">
    <h1 className="font-header font-bold text-xl md:text-2xl text-primary">
      {label} — coming next phase
    </h1>
  </div>
);

const App = () => {
  return (
    // Public routes render directly, protected nest in guard plus layout
    <Routes>
      {/* Public — no guard, guests can browse goods freely */}
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login/buyer" element={<BuyerLogin />} />
      <Route path="/login/seller" element={<SellerLogin />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/store/:sellerId" element={<SellerStore />} />
      {/* Buyer — top nav shell, cart onward stays guarded */}
      <Route element={<BuyerRoute />}>
        <Route element={<BuyerLayout />}>
          <Route path="/cart" element={<Placeholder label="Cart" />} />
        </Route>
      </Route>
      {/* Seller — sidebar shell */}
      <Route element={<SellerRoute />}>
        <Route element={<SellerLayout />}>
          <Route
            path="/seller/dashboard"
            element={<Placeholder label="Seller Dashboard" />}
          />
          <Route
            path="/seller/profile"
            element={<Placeholder label="Seller Profile" />}
          />
        </Route>
      </Route>
      {/* Admin — top nav shell */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route
            path="/admin/dashboard"
            element={<Placeholder label="Admin Dashboard" />}
          />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
