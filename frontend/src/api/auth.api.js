import api from "./axios.js";

// Register — multipart, files included
export const registerUser = async (formData) => {
  // FormData needs multipart, override default json header
  const res = await api.post("/auth/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  // Returns { success, message, ocrResult, ocrConfidence, token, data }
  return res.data;
};

// Ask the backend to email a registration code
export const requestEmailOtp = async (email) => {
  const res = await api.post("/auth/otp/send", { email });
  return res.data;
};

// Forgot password — email a reset code (same answer for unknown emails)
export const requestPasswordReset = async (email) => {
  const res = await api.post("/auth/password/forgot", { email });
  return res.data;
};

// Forgot password — set a new password with the emailed code
export const resetPassword = async (email, code, password) => {
  const res = await api.post("/auth/password/reset", { email, code, password });
  return res.data;
};

// Confirm the code — returns data.otpToken for registration
export const verifyEmailOtp = async (email, code) => {
  const res = await api.post("/auth/otp/verify", { email, code });
  return res.data;
};

// Login — json only
export const loginUser = async (email, password) => {
  // Backend validates via validateLogin
  const res = await api.post("/auth/login", { email, password });
  // Returns { success, message, token, data: { role, accountStatus } }
  return res.data;
};

// Save my own profile fields — address, and delivery settings for sellers
export const updateProfile = async (data) => {
  const res = await api.put("/auth/me", data);
  return res.data;
};

// Current user — for refresh/sync
export const fetchMe = async () => {
  // Token auto-attached by interceptor
  const res = await api.get("/auth/me");
  return res.data;
};

// Profile photo — multipart "avatar", once every 7 days
export const updateAvatar = async (file) => {
  const form = new FormData();
  form.append("avatar", file);
  // Multipart override — the shared client defaults to JSON
  const res = await api.put("/auth/me/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Store name (sellers) — first one any time, then once every 7 days
export const updateStoreName = async (storeName) => {
  const res = await api.put("/auth/me/store-name", { storeName });
  return res.data;
};

// Email — needs the otpToken from verifyEmailOtp for the NEW address
export const updateEmail = async (email, otpToken) => {
  const res = await api.put("/auth/me/email", { email, otpToken });
  return res.data;
};
