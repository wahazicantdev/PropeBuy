import { Router } from "express";
import {
  getPendingReviews,
  createReview,
  getProductReviews,
} from "../controllers/review.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { validateIdParam } from "../middleware/validate.middleware.js";

const reviewRoutes = Router();

// Public — anyone can read a product's reviews
reviewRoutes.get("/product/:id", validateIdParam, getProductReviews);

// Buyers rate what they bought
reviewRoutes.get("/pending", protect, authorize("BUYER"), getPendingReviews);
reviewRoutes.post("/", protect, authorize("BUYER"), createReview);

export default reviewRoutes;
