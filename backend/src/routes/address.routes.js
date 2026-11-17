import { Router } from "express";
import {
  getAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from "../controllers/address.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { validateIdParam } from "../middleware/validate.middleware.js";

// Buyer delivery addresses — list, add, edit, pick default, delete
const addressRoutes = Router();

addressRoutes.get("/", protect, authorize("BUYER"), getAddresses);
addressRoutes.post("/", protect, authorize("BUYER"), createAddress);
addressRoutes.put("/:id", protect, authorize("BUYER"), validateIdParam, updateAddress);
addressRoutes.patch("/:id/default", protect, authorize("BUYER"), validateIdParam, setDefaultAddress);
addressRoutes.delete("/:id", protect, authorize("BUYER"), validateIdParam, deleteAddress);

export default addressRoutes;
