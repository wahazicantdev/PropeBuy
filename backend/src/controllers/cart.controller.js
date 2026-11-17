import prisma from "../config/prismaClient.js";
import { cleanInt } from "../utils/format.helper.js";

// In-memory cart is handled on the frontend
// Backend cart validation happens at checkout
// But we need these endpoints for cart item validation

// ── VALIDATE CART ITEM ─────────────────────────────────
// Check if product exists and has enough stock
// Called before buyer adds to cart on frontend
export const validateCartItem = async (req, res) => {
  const { productId, quantity, variantId } = req.body;

  if (!productId || !quantity) {
    return res.status(400).json({
      success: false,
      message: "Product ID and quantity are required",
    });
  }

  const product = await prisma.product.findUnique({
    where: {
      id: cleanInt(productId),
      isActive: true,
    },
    include: {
      variants: { where: { isActive: true }, select: { id: true, name: true, price: true, stock: true } },
      seller: {
        select: {
          id: true,
          name: true,
          accountStatus: true,
        },
      },
      barangay: {
        select: { id: true, name: true },
      },
      category: {
        select: { id: true, name: true },
      },
    },
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  // With options, the picked option's stock is what counts
  if (variantId) {
    const variant = product.variants.find((v) => v.id === cleanInt(variantId));
    if (!variant) {
      return res.status(404).json({ success: false, message: "That option is no longer available" });
    }
    if (variant.stock < cleanInt(quantity)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${variant.stock} items available`,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Product is available",
      data: { ...product, price: variant.price, stock: variant.stock, variant },
    });
  }

  if (product.stock < cleanInt(quantity)) {
    return res.status(400).json({
      success: false,
      message: `Insufficient stock. Only ${product.stock} items available`,
    });
  }

  res.status(200).json({
    success: true,
    message: "Product is available",
    data: product,
  });
};
