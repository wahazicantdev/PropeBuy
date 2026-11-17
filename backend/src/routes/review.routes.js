import { Router } from "express";
import {
  getPendingReviews,
  createReview,
  getProductReviews,
  getSellerReviews,
  replyToReview,
} from "../controllers/review.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { validateIdParam } from "../middleware/validate.middleware.js";

const reviewRoutes = Router();

// Public — anyone can read a product's reviews
reviewRoutes.get("/product/:id", validateIdParam, getProductReviews);

// Buyers rate what they bought
reviewRoutes.get("/pending", protect, authorize("BUYER"), getPendingReviews);
reviewRoutes.post("/", protect, authorize("BUYER"), createReview);

// Sellers read the ratings of their products and answer them
reviewRoutes.get("/seller", protect, authorize("SELLER"), getSellerReviews);
reviewRoutes.put("/:id/reply", protect, authorize("SELLER"), validateIdParam, replyToReview);

export default reviewRoutes;
