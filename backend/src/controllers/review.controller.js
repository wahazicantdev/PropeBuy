import prisma from "../config/prismaClient.js";
import { pendingReviewWhere } from "../utils/review.helper.js";
import { notifyNewReview, notifyReviewReply } from "../utils/notification.helper.js";

// ── ITEMS WAITING FOR MY RATING ────────────────────────
export const getPendingReviews = async (req, res) => {
  const items = await prisma.orderItem.findMany({
    where: pendingReviewWhere(req.user.id),
    select: {
      id: true,
      orderId: true,
      product: { select: { id: true, name: true, imageUrl: true } },
    },
    orderBy: { id: "asc" },
  });

  res.status(200).json({
    success: true,
    message: "Pending reviews loaded",
    data: items,
  });
};

// ── RATE A PURCHASED ITEM ──────────────────────────────
export const createReview = async (req, res) => {
  const orderItemId = parseInt(req.body.orderItemId);
  const rating = Number(req.body.rating);
  const comment =
    typeof req.body.comment === "string" ? req.body.comment.trim() : "";

  // Stars are required, the comment is optional and short
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "Choose a rating from 1 to 5 stars",
    });
  }
  if (comment.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Comment must be 500 characters or less",
    });
  }

  // Only the buyer of this exact item can rate it
  const item = Number.isInteger(orderItemId)
    ? await prisma.orderItem.findUnique({
        where: { id: orderItemId },
        include: {
          order: { select: { buyerId: true, status: true } },
          product: { select: { id: true, name: true, sellerId: true } },
          review: { select: { id: true } },
        },
      })
    : null;
  if (!item || item.order.buyerId !== req.user.id) {
    return res.status(404).json({
      success: false,
      message: "Item not found in your orders",
    });
  }
  if (item.order.status !== "FULFILLED") {
    return res.status(400).json({
      success: false,
      message: "You can rate an item once the order is fulfilled",
    });
  }
  if (item.review) {
    return res.status(400).json({
      success: false,
      message: "You already rated this item",
    });
  }

  // Unique orderItemId also stops a double tap from saving two reviews
  const review = await prisma.review.create({
    data: {
      orderItemId,
      productId: item.product.id,
      buyerId: req.user.id,
      sellerId: item.product.sellerId,
      rating,
      comment: comment || null,
    },
    select: { id: true, rating: true, comment: true, createdAt: true },
  });

  // The seller sees the new rating in their bell
  notifyNewReview(item.product.sellerId, item.product.name, rating);

  res.status(201).json({
    success: true,
    message: "Thanks for rating!",
    data: review,
  });
};

// ── REVIEWS OF ONE PRODUCT (public) ────────────────────
export const getProductReviews = async (req, res) => {
  const productId = parseInt(req.params.id);
  const [reviews, summary] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        rating: true,
        comment: true,
        sellerReply: true,
        repliedAt: true,
        createdAt: true,
        buyer: { select: { name: true } },
      },
    }),
    prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  res.status(200).json({
    success: true,
    message: "Reviews loaded",
    data: {
      average: summary._count.rating
        ? Math.round(summary._avg.rating * 10) / 10
        : 0,
      count: summary._count.rating,
      // First name and last initial only — buyers stay private
      reviews: reviews.map(({ buyer, ...r }) => {
        const parts = (buyer?.name || "Buyer").trim().split(/\s+/);
        const shortName =
          parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
        return { ...r, buyerName: shortName };
      }),
    },
  });
};

// First name and last initial — buyers stay private on public pages
const shortBuyerName = (name) => {
  const parts = (name || "Buyer").trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
};

// ── SELLER: REVIEWS OF MY PRODUCTS ─────────────────────
// GET /api/reviews/seller?filter=all|unreplied|comments (E2E #419)
export const getSellerReviews = async (req, res) => {
  const filter = String(req.query.filter || "all");
  const where = { sellerId: req.user.id };
  if (filter === "unreplied") Object.assign(where, { comment: { not: null }, sellerReply: null });
  if (filter === "comments") Object.assign(where, { comment: { not: null } });

  const [reviews, summary] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        rating: true,
        comment: true,
        sellerReply: true,
        repliedAt: true,
        createdAt: true,
        product: { select: { id: true, name: true, imageUrl: true } },
        buyer: { select: { name: true } },
      },
    }),
    prisma.review.aggregate({
      where: { sellerId: req.user.id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);
  const unreplied = await prisma.review.count({
    where: { sellerId: req.user.id, comment: { not: null }, sellerReply: null },
  });

  res.status(200).json({
    success: true,
    message: "Reviews loaded",
    data: {
      average: summary._count.rating ? Math.round(summary._avg.rating * 10) / 10 : 0,
      count: summary._count.rating,
      unreplied,
      reviews: reviews.map(({ buyer, ...r }) => ({ ...r, buyerName: shortBuyerName(buyer?.name) })),
    },
  });
};

// ── SELLER: REPLY TO A REVIEW ──────────────────────────
// PUT /api/reviews/:id/reply { reply } — saving again edits the reply,
// an empty reply removes it. Only the seller of the product can answer.
export const replyToReview = async (req, res) => {
  const reply = typeof req.body.reply === "string" ? req.body.reply.trim() : "";
  if (reply.length > 500) {
    return res.status(400).json({ success: false, message: "Reply must be 500 characters or less" });
  }
  const review = await prisma.review.findUnique({
    where: { id: parseInt(req.params.id) },
    select: { id: true, sellerId: true, buyerId: true, sellerReply: true, product: { select: { id: true, name: true } } },
  });
  if (!review || review.sellerId !== req.user.id) {
    return res.status(404).json({ success: false, message: "Review not found" });
  }
  const saved = await prisma.review.update({
    where: { id: review.id },
    data: { sellerReply: reply || null, repliedAt: reply ? new Date() : null },
    select: { id: true, sellerReply: true, repliedAt: true },
  });
  // Tell the buyer only on the first reply, not on every edit
  if (reply && !review.sellerReply) notifyReviewReply(review.buyerId, review.product);

  res.status(200).json({
    success: true,
    message: reply ? "Reply saved" : "Reply removed",
    data: saved,
  });
};
