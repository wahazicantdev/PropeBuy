import api from "./axios.js";

// Buyer saved addresses. Every call returns
// { data: { addresses: [{ id, label, address, isDefault }], address } }
// where address is the default one, mirrored on the user.

// List my saved addresses, default first
export const fetchAddresses = async () => {
  const res = await api.get("/addresses");
  return res.data;
};

// Add one — makeDefault switches the default to it
export const createAddress = async (label, address, makeDefault = false) => {
  const res = await api.post("/addresses", { label, address, makeDefault });
  return res.data;
};

// Edit the label or the address text
export const updateAddress = async (id, label, address) => {
  const res = await api.put(`/addresses/${id}`, { label, address });
  return res.data;
};

// Make this address the default for checkout
export const setDefaultAddress = async (id) => {
  const res = await api.patch(`/addresses/${id}/default`);
  return res.data;
};

// Delete one — the next oldest becomes the default
export const deleteAddress = async (id) => {
  const res = await api.delete(`/addresses/${id}`);
  return res.data;
};
