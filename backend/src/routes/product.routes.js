import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getBarangays,
  getCategories,
} from "../controllers/product.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { upload } from "../config/cloudinary.js";
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateIdParam,
} from "../middleware/validate.middleware.js";

const productRoutes = Router();

// ── PUBLIC ROUTES ──────────────────────────────────────
// No token needed — buyers can browse freely
productRoutes.get("/", getProducts);
productRoutes.get("/barangays", getBarangays);
productRoutes.get("/categories", getCategories);
productRoutes.get("/:id", validateIdParam, getProduct);

// ── PROTECTED ROUTES — SELLER ONLY ────────────────────
// Token required + must be SELLER role
// Up to 4 photos as "images". The old single "image" field still works.
const productPhotos = upload.fields([
  { name: "images", maxCount: 4 },
  { name: "image", maxCount: 1 },
]);

productRoutes.post(
  "/",
  protect,
  authorize("SELLER"),
  productPhotos,
  validateCreateProduct,
  createProduct,
);

productRoutes.get(
  "/seller/my-products",
  protect,
  authorize("SELLER"),
  getMyProducts,
);

productRoutes.put(
  "/:id",
  protect,
  authorize("SELLER"),
  productPhotos,
  validateUpdateProduct,
  updateProduct,
);

productRoutes.delete("/:id", protect, authorize("SELLER"), deleteProduct);

export default productRoutes;
