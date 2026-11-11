import api from "./axios.js";

// Items I still need to rate
export const fetchPendingReviews = async () => {
  const res = await api.get("/reviews/pending");
  return res.data;
};

// Rate one purchased item
export const submitReview = async (orderItemId, rating, comment) => {
  const res = await api.post("/reviews", { orderItemId, rating, comment });
  return res.data;
};

// Public reviews of a product, with average and count
export const fetchProductReviews = async (productId) => {
  const res = await api.get(`/reviews/product/${productId}`);
  return res.data;
};
