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

// Admin platform analytics lives here in Phase E — placeholder noted