import { Routes, Route } from "react-router-dom";
import {
  BuyerRoute,
  SellerRoute,
  AdminRoute,
} from "./routes/ProtectedRoute.jsx";

// Placeholder — Phase B-F will fill these
const Placeholder = ({ label }) => (
  // Minimalist centered placeholder
  <div className="min-h-screen bg-white flex items-center justify-center">
    <h1 className="font-header text-2xl text-primary">
      {label} — coming in Phase B-F
    </h1>
  </div>
);

const App = () => {
  return (
    // Router skeleton — all 27 pages mount here later
    <Routes>
      {/* Public — no guard */}
      <Route path="/" element={<Placeholder label="PropeBuy Landing" />} />
      <Route path="/register" element={<Placeholder label="Register" />} />
      <Route
        path="/login/buyer"
        element={<Placeholder label="Buyer Login" />}
      />
      <Route
        path="/login/seller"
        element={<Placeholder label="Seller Login" />}
      />

      {/* Buyer portal — top horizontal nav later */}
      <Route element={<BuyerRoute />}>
        <Route path="/browse" element={<Placeholder label="Browse" />} />
        <Route path="/cart" element={<Placeholder label="Cart" />} />
      </Route>

      {/* Seller portal — left vertical nav later */}
      <Route element={<SellerRoute />}>
        <Route
          path="/seller/dashboard"
          element={<Placeholder label="Seller Dashboard" />}
        />
      </Route>

      {/* Admin portal — top horizontal nav later */}
      <Route element={<AdminRoute />}>
        <Route
          path="/admin/dashboard"
          element={<Placeholder label="Admin Dashboard" />}
        />
      </Route>
    </Routes>
  );
};

export default App;
