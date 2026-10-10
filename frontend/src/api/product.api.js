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
  // GET /products?barangayId=&categoryId=&search=
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
