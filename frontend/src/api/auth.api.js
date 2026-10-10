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

// Login — json only
export const loginUser = async (email, password) => {
  // Backend validates via validateLogin
  const res = await api.post("/auth/login", { email, password });
  // Returns { success, message, token, data: { role, accountStatus } }
  return res.data;
};

// Current user — for refresh/sync
export const fetchMe = async () => {
  // Token auto-attached by interceptor
  const res = await api.get("/auth/me");
  return res.data;
};
