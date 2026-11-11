import prisma from "../config/prismaClient.js";

// Items the buyer must still rate: in a fulfilled order that has a
// fulfilledAt date (set from launch onward) and no review yet
export const pendingReviewWhere = (buyerId) => ({
  review: null,
  order: { buyerId, status: "FULFILLED", fulfilledAt: { not: null } },
});

// How many ratings stand between the buyer and their next checkout
export const countPendingReviews = (buyerId) =>
  prisma.orderItem.count({ where: pendingReviewWhere(buyerId) });

// Average and count for a list of products and their sellers
export const attachRatings = async (products) => {
  if (!products.length) return products;
  const productIds = products.map((p) => p.id);
  const sellerIds = [...new Set(products.map((p) => p.sellerId))];
  const [byProduct, bySeller] = await Promise.all([
    prisma.review.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.review.groupBy({
      by: ["sellerId"],
      where: { sellerId: { in: sellerIds } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);
  // One decimal, zero when nobody rated yet
  const toRating = (g) =>
    g
      ? { average: Math.round(g._avg.rating * 10) / 10, count: g._count.rating }
      : { average: 0, count: 0 };
  const productMap = new Map(byProduct.map((g) => [g.productId, g]));
  const sellerMap = new Map(bySeller.map((g) => [g.sellerId, g]));
  return products.map((p) => ({
    ...p,
    rating: toRating(productMap.get(p.id)),
    seller: p.seller ? { ...p.seller, rating: toRating(sellerMap.get(p.sellerId)) } : p.seller,
  }));
};
