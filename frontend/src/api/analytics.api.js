import api from "./axios.js";

// Seller analytics — dashboard numbers, whole bundle in one call
export const fetchSellerAnalytics = async () => {
  // GET /analytics/seller, SELLER role only
  // Backend already parseFloat'd money values for us
  const res = await api.get("/analytics/seller");
  // data: {
  //   summary: { totalOrders, totalRevenue, totalItemsSold, lowStockCount },
  //   ordersByStatus: [{ status, _count: { status } }],
  //   topProducts: [{ product, totalSold, totalOrders }],
  //   recentOrders: [...],
  //   lowStockProducts: [...],
  //   revenueChart: [{ month, revenue, orders }]
  // }
  return res.data;
};

// Platform analytics — admin dashboard, one call powers the whole page
export const fetchPlatformAnalytics = async () => {
  // GET /analytics/platform, ADMIN role only
  const res = await api.get("/analytics/platform");
  // data: {
  //   users: { total, buyers, sellers, pendingVerifications },
  //   products: { total },
  //   orders: { total, byStatus: [{ status, _count: { status } }] },
  //   revenue: { total },          <- fulfilled orders only, already parseFloat
  //   topBarangays: [{ barangay, productCount }]
  // }
  return res.data;
};