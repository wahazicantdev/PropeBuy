import prisma from "../config/prismaClient.js";
import { pendingReviewWhere } from "../utils/review.helper.js";
import { notifyNewReview } from "../utils/notification.helper.js";

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
