import api from "./axios.js";

// Barangays — public, register dropdown and browse filter
export const fetchBarangays = async () => {
  // No token needed, backend getBarangays is public
  const res = await api.get("/products/barangays");
  // Returns { success, data: [{ id, name }] }
  return res.data;
};

// Categories — public, browse filter chips
export const fetchCategories = async () => {
  // No token needed, backend getCategories is public
  const res = await api.get("/products/categories");
  // Returns { success, data: [{ id, name }] }
  return res.data;
};

// Product list — public, supports barangay + category + search
export const fetchProducts = async (params = {}) => {
  // Strip empty params so backend ignores them
  const clean = {};
  if (params.barangayId) clean.barangayId = params.barangayId;
  if (params.categoryId) clean.categoryId = params.categoryId;
  if (params.search) clean.search = params.search;
  // Seller store page filter
  if (params.sellerId) clean.sellerId = params.sellerId;
  // GET /products?barangayId=&categoryId=&search=&sellerId=
  const res = await api.get("/products", { params: clean });
  // Returns { success, count, data: [...] }
  return res.data;
};

// Single product — public, detail page
export const fetchProduct = async (id) => {
  // Backend validates id param, 404 if missing or inactive
  const res = await api.get(`/products/${id}`);
  // Returns { success, data: { seller, barangay, category } }
  return res.data;
};

// Build FormData helper — multipart shape the backend multer
// upload.single("image") expects, reuses the proven register pattern
const buildProductForm = ({ data, image }) => {
  // FormData because product images ride along as binary
  const form = new FormData();
  // Text fields — exact keys validateCreateProduct expects
  form.append("name", data.name);
  form.append("price", data.price);
  form.append("stock", data.stock);
  form.append("categoryId", data.categoryId);
  // Description ALWAYS appended — empty string clears it on edit,
  // create maps "" to null server-side (STEP 1 patch handles this)
  form.append("description", data.description || "");
  // Image optional — edit keeps old photo when skipped
  if (image) form.append("image", image);
  return form;
};

// Create product — multipart POST, seller only, VERIFIED required
export const createProduct = async ({ data, image }) => {
  const form = buildProductForm({ data, image });
  const res = await api.post("/products", form, {
    // Override default json header for multipart boundary
    headers: { "Content-Type": "multipart/form-data" },
  });
  // Returns { success, message, data: product }
  return res.data;
};

// My listings — seller only, includes inactive (soft-deleted)
export const fetchMyProducts = async () => {
  // GET /products/seller/my-products with bearer token
  const res = await api.get("/products/seller/my-products");
  // Returns { success, count, data: [...] }
  return res.data;
};

// Update product — multipart PUT, all fields optional server-side
export const updateProduct = async (id, { data, image }) => {
  const form = buildProductForm({ data, image });
  const res = await api.put(`/products/${id}`, form, {
    // Same multipart override as create
    headers: { "Content-Type": "multipart/form-data" },
  });
  // Returns { success, message, data: product }
  return res.data;
};

// Delete product — soft delete, backend flips isActive
export const deleteProduct = async (id) => {
  const res = await api.delete(`/products/${id}`);
  // Returns { success, message } — no data
  return res.data;
};