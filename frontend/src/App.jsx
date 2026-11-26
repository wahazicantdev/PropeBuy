import { Routes, Route } from "react-router-dom";
// Realtime — one socket for the whole app, connects only when logged in
import { useSocket } from "./hooks/useSocket.js";
import BuyerLayout from "./components/layouts/BuyerLayout.jsx";
import SellerLayout from "./components/layouts/SellerLayout.jsx";
import AdminLayout from "./components/layouts/AdminLayout.jsx";
import {
  BuyerRoute,
  SellerRoute,
  AdminRoute,
  AdminArea,
} from "./routes/ProtectedRoute.jsx";
// Public pages - guests allowed, login wall lives on actions
import Landing from "./pages/public/Landing.jsx";
import Register from "./pages/public/Register.jsx";
import BuyerLogin from "./pages/public/BuyerLogin.jsx";
import SellerLogin from "./pages/public/SellerLogin.jsx";
import Browse from "./pages/public/Browse.jsx";
import ProductDetail from "./pages/public/ProductDetail.jsx";
import SellerStore from "./pages/public/SellerStore.jsx";
import ForgotPassword from "./pages/public/ForgotPassword.jsx";
import { Terms, Privacy } from "./pages/public/Legal.jsx";
// Buyer pages - cart onward, all guarded
import Cart from "./pages/buyer/Cart.jsx";
import Checkout from "./pages/buyer/Checkout.jsx";
import PaymentSuccess from "./pages/buyer/PaymentSuccess.jsx";
import PaymentFailed from "./pages/buyer/PaymentFailed.jsx";
import OrderHistory from "./pages/buyer/OrderHistory.jsx";
import OrderDetail from "./pages/buyer/OrderDetail.jsx";
import BuyerProfile from "./pages/buyer/BuyerProfile.jsx";
// Seller pages - Phase D, listings + fulfillment wired
import MyProducts from "./pages/seller/MyProducts.jsx";
import AddProduct from "./pages/seller/AddProduct.jsx";
import EditProduct from "./pages/seller/EditProduct.jsx";
import OrdersReceived from "./pages/seller/OrdersReceived.jsx";
import OrderDetailSeller from "./pages/seller/OrderDetailSeller.jsx";
import Dashboard from "./pages/seller/Dashboard.jsx";
import InventoryMonitor from "./pages/seller/InventoryMonitor.jsx";
import SellerProfile from "./pages/seller/SellerProfile.jsx";
import Earnings from "./pages/seller/Earnings.jsx";
import Reviews from "./pages/seller/Reviews.jsx";
// Admin pages - Phase E, all 7 portal pages live
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import PendingVerifications from "./pages/admin/PendingVerifications.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import ProductModeration from "./pages/admin/ProductModeration.jsx";
import OrdersOverview from "./pages/admin/OrdersOverview.jsx";
import Reports from "./pages/admin/Reports.jsx";
import BarangayManagement from "./pages/admin/BarangayManagement.jsx";
import CategoryManagement from "./pages/admin/CategoryManagement.jsx";
import Payouts from "./pages/admin/Payouts.jsx";
// Admin roles (Yoy, 11-18): staff accounts, audit log, barangay numbers
import StaffManagement from "./pages/admin/StaffManagement.jsx";
import ActivityLog from "./pages/admin/ActivityLog.jsx";
import BarangayInsights from "./pages/admin/BarangayInsights.jsx";

const App = () => {
  // Mount realtime once — before this, the hook existed but nothing
  // called it, so objective 1e never reached the browser
  useSocket();

  return (
    // Public routes render directly, protected nest in guard plus layout
    <Routes>
      {/* Public - no guard, guests browse goods freely */}
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login/buyer" element={<BuyerLogin />} />
      <Route path="/login/seller" element={<SellerLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/store/:sellerId" element={<SellerStore />} />
      {/* Payment return pages - public so PayMongo redirects never hit a wall */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failed" element={<PaymentFailed />} />
      {/* Buyer - top nav shell */}
      <Route element={<BuyerRoute />}>
        <Route element={<BuyerLayout />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/profile" element={<BuyerProfile />} />
        </Route>
      </Route>
      {/* Seller - sidebar shell */}
      <Route element={<SellerRoute />}>
        <Route element={<SellerLayout />}>
          <Route path="/seller/dashboard" element={<Dashboard />} />
          {/* Listings - live as of STEP 4 */}
          <Route path="/seller/products" element={<MyProducts />} />
          <Route path="/seller/add-product" element={<AddProduct />} />
          <Route path="/seller/products/:id/edit" element={<EditProduct />} />
          {/* Fulfillment - live as of STEP 5 */}
          <Route path="/seller/orders" element={<OrdersReceived />} />
          <Route path="/seller/orders/:id" element={<OrderDetailSeller />} />
          <Route path="/seller/inventory" element={<InventoryMonitor />} />
          <Route path="/seller/profile" element={<SellerProfile />} />
          <Route path="/seller/earnings" element={<Earnings />} />
          {/* Ratings of the seller's products, with replies */}
          <Route path="/seller/reviews" element={<Reviews />} />
        </Route>
      </Route>
      {/* Admin - role ADMIN, then each page checks the staff level's area
          (super admin, moderator, barangay verifier — Yoy, 11-18) */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminArea area="dashboard"><AdminDashboard /></AdminArea>} />
          {/* Barangay numbers, totals only — the verifier's home page */}
          <Route path="/admin/insights" element={<AdminArea area="insights"><BarangayInsights /></AdminArea>} />
          {/* Verification queue - the blocking gate for new vendors */}
          <Route path="/admin/pending" element={<AdminArea area="verifications"><PendingVerifications /></AdminArea>} />
          <Route path="/admin/users" element={<AdminArea area="users"><UserManagement /></AdminArea>} />
          {/* Moderation - soft removal with a mandatory reason */}
          <Route path="/admin/products" element={<AdminArea area="products"><ProductModeration /></AdminArea>} />
          {/* Oversight - read-only, no admin status override exists */}
          <Route path="/admin/orders" element={<AdminArea area="orders"><OrdersOverview /></AdminArea>} />
          {/* Buyer reports: dismiss, warn, remove product, suspend seller (11-26) */}
          <Route path="/admin/reports" element={<AdminArea area="reports"><Reports /></AdminArea>} />
          {/* Taxonomy - barangay coverage and the categories */}
          <Route path="/admin/barangays" element={<AdminArea area="settings"><BarangayManagement /></AdminArea>} />
          <Route path="/admin/categories" element={<AdminArea area="settings"><CategoryManagement /></AdminArea>} />
          <Route path="/admin/payouts" element={<AdminArea area="payouts"><Payouts /></AdminArea>} />
          {/* Super admin only */}
          <Route path="/admin/staff" element={<AdminArea area="staff"><StaffManagement /></AdminArea>} />
          <Route path="/admin/activity" element={<AdminArea area="activity"><ActivityLog /></AdminArea>} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;