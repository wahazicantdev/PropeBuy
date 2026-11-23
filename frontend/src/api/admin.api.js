import api from "./axios.js";

// ── VERIFICATIONS ──────────────────────────────────────
// Pending queue — users who registered but nobody reviewed yet.
// Backend already parses ocrIssues + ocrExtractedData into objects,
// so the pages read them straight without JSON.parse.
export const fetchPendingVerifications = async () => {
  // GET /admin/users/verifications/pending, ADMIN only
  const res = await api.get("/admin/users/verifications/pending");
  // Returns { success, count, data: [{ ...user, ocrResult, ocrConfidence }] }
  return res.data;
};

// Full OCR audit trail for one user — works on ANY status,
// not just pending, so disputes can be reviewed after the fact
export const fetchUserOCRDetails = async (id) => {
  const res = await api.get(`/admin/users/${id}/ocr-details`);
  // Returns { success, data: { documents, ocrVerification: { summary } } }
  return res.data;
};

// Re-run OCR — admin triggers a fresh read of the same two documents.
// Slow call: backend downloads both images from Cloudinary then runs
// Tesseract, so the UI must show a spinner and never a frozen button.
export const rerunUserOCR = async (id) => {
  const res = await api.post(`/admin/users/${id}/ocr-rerun`);
  // Returns { success, message, data: { ocrResult, ocrConfidence, issues } }
  return res.data;
};

// Signed link to a private verification document (11-24).
// kind = "id" | "certificate". The link expires in a few minutes, and
// the backend writes the opening to the activity log.
export const fetchUserDocumentLink = async (id, kind) => {
  const res = await api.get(`/admin/users/${id}/documents/${kind}`);
  // Returns { success, data: { url, expiresInSeconds } }
  return res.data;
};

// Approve or reject a registration.
// barangayId is REQUIRED when approving — it assigns the verified
// barangay, which is what the Verified Local Vendor badge rests on.
export const verifyUser = async (id, action, barangayId) => {
  // Body shape must match validateVerifyUser exactly
  const body = { action };
  if (action === "approve") body.barangayId = Number(barangayId);
  const res = await api.put(`/admin/users/${id}/verify`, body);
  // Returns { success, message, data: updatedUser }
  return res.data;
};

// ── USERS ──────────────────────────────────────────────
// All users — role and status filters are server-side, so the
// dropdowns refetch instead of filtering a stale list in memory
export const fetchUsers = async (params = {}) => {
  // Strip empty values so the backend ignores unset filters
  const clean = {};
  if (params.role) clean.role = params.role;
  if (params.status) clean.status = params.status;
  const res = await api.get("/admin/users", { params: clean });
  // Returns { success, count, data: [...] }
  return res.data;
};

// One user with documents plus their active product listings
export const fetchUser = async (id) => {
  const res = await api.get(`/admin/users/${id}`);
  // Returns { success, data: { ...user, products: [...] } }
  return res.data;
};

// Suspend — backend flips accountStatus to REJECTED.
// Guarded server-side: cannot suspend yourself, cannot suspend an admin.
export const suspendUser = async (id) => {
  const res = await api.put(`/admin/users/${id}/suspend`);
  // Returns { success, message, data: suspendedUser }
  return res.data;
};

// ── PRODUCT MODERATION ─────────────────────────────────
// Every product on the platform, inactive rows included —
// the buyer-facing /products route hides inactive ones
export const fetchAllProducts = async (params = {}) => {
  const clean = {};
  if (params.barangayId) clean.barangayId = params.barangayId;
  if (params.categoryId) clean.categoryId = params.categoryId;
  // isActive rides as a string — backend compares against "true"
  if (params.isActive !== undefined && params.isActive !== "")
    clean.isActive = params.isActive;
  const res = await api.get("/admin/products", { params: clean });
  // Returns { success, count, data: [{ seller, barangay, category }] }
  return res.data;
};

// Remove a listing — soft delete, reason is mandatory server-side
export const removeProduct = async (id, reason) => {
  const res = await api.put(`/admin/products/${id}/remove`, { reason });
  // Returns { success, message, data: { productName, seller, reason } }
  return res.data;
};

// ── ORDERS OVERSIGHT ───────────────────────────────────
// Every order on the platform with buyer + items + seller per item.
// All three filters are server-side query params.
export const fetchAllOrders = async (params = {}) => {
  const clean = {};
  if (params.status) clean.status = params.status;
  if (params.paymentMethod) clean.paymentMethod = params.paymentMethod;
  if (params.paymentStatus) clean.paymentStatus = params.paymentStatus;
  const res = await api.get("/admin/orders", { params: clean });
  // Returns { success, count, data: [...] }
  return res.data;
};

// ── BARANGAYS ──────────────────────────────────────────
// Admin list — includes DISABLED rows plus _count of products and users.
// Phase E added this route because the public one filters them out.
export const fetchAdminBarangays = async () => {
  const res = await api.get("/admin/barangays");
  // Returns { success, count, data: [{ ...barangay, _count }] }
  return res.data;
};

// Add barangay — city defaults to Muntinlupa City on the backend
export const addBarangay = async (name, city) => {
  const res = await api.post("/admin/barangays", { name, city });
  // Returns { success, message, data: barangay }
  return res.data;
};

// Toggle barangay — backend flips isActive, no body needed
export const toggleBarangay = async (id) => {
  const res = await api.put(`/admin/barangays/${id}/toggle`);
  // Returns { success, message, data: updated }
  return res.data;
};

// ── CATEGORIES ─────────────────────────────────────────
// Admin list — disabled categories included, with product counts
export const fetchAdminCategories = async () => {
  const res = await api.get("/admin/categories");
  // Returns { success, count, data: [{ ...category, _count }] }
  return res.data;
};

// Add category — name must be 2 to 100 characters
export const addCategory = async (name) => {
  const res = await api.post("/admin/categories", { name });
  // Returns { success, message, data: category }
  return res.data;
};

// Toggle category — same flip pattern as barangays
export const toggleCategory = async (id) => {
  const res = await api.put(`/admin/categories/${id}/toggle`);
  // Returns { success, message, data: updated }
  return res.data;
};

// ── STAFF ACCOUNTS — super admin (Yoy, 11-18) ──────────
// Every admin account with level and barangay
export const fetchStaff = async () => {
  const res = await api.get("/admin/staff");
  return res.data;
};

// New staff account — the super admin hands over the temporary password
export const createStaff = async (data) => {
  const res = await api.post("/admin/staff", data);
  return res.data;
};

// Turn a staff account off (logs them out) or back on
export const setStaffActive = async (id, active) => {
  const res = await api.put(`/admin/staff/${id}/active`, { active });
  return res.data;
};

// ── AUDIT LOG — super admin ────────────────────────────
// Latest 200 admin actions; filter by action name
export const fetchActivity = async (action) => {
  const res = await api.get("/admin/activity", { params: action ? { action } : {} });
  return res.data;
};

// ── BARANGAY INSIGHTS ──────────────────────────────────
// Totals for one barangay. Verifiers always get their own.
export const fetchInsights = async (barangayId) => {
  const res = await api.get("/admin/insights", { params: barangayId ? { barangayId } : {} });
  return res.data;
};
