import prisma from "../config/prismaClient.js";

// ── SAVED DELIVERY ADDRESSES (E2E #423) ────────────────
// A buyer keeps up to 5 addresses and marks one as default. The default
// is also copied to users.address, so older code and the seller order
// page keep working without changes. Checkout picks any saved address.

const MAX_ADDRESSES = 5;

// Fields every response returns, newest default first
const listFor = (userId) =>
  prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: { id: true, label: true, address: true, isDefault: true },
  });

// Keeps exactly one default and mirrors it into users.address.
// preferId — the address that should be default, when one was chosen.
const syncDefault = async (tx, userId, preferId = null) => {
  const all = await tx.address.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, address: true, isDefault: true },
  });
  // Chosen one, else the current default, else the oldest
  const pick =
    all.find((a) => a.id === preferId) || all.find((a) => a.isDefault) || all[0] || null;
  await tx.address.updateMany({ where: { userId, NOT: { id: pick?.id ?? 0 } }, data: { isDefault: false } });
  if (pick) await tx.address.update({ where: { id: pick.id }, data: { isDefault: true } });
  await tx.user.update({ where: { id: userId }, data: { address: pick?.address ?? null } });
};

// Shared input check for create and edit
const readInput = (body) => {
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  if (!address) return { error: "Enter the address" };
  if (address.length > 300) return { error: "Address must be 300 characters or less" };
  if (label.length > 40) return { error: "Label must be 40 characters or less" };
  return { label: label || "Address", address };
};

// The address must belong to the logged-in buyer
const findOwn = (userId, id) =>
  prisma.address.findFirst({ where: { id: Number(id), userId } });

// Same reply shape everywhere: the list plus the mirrored default
const reply = async (res, status, message, userId) => {
  const addresses = await listFor(userId);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { address: true } });
  res.status(status).json({ success: true, message, data: { addresses, address: user.address } });
};

// GET /api/addresses
export const getAddresses = async (req, res) => {
  await reply(res, 200, "Addresses loaded", req.user.id);
};

// POST /api/addresses { label, address, makeDefault }
export const createAddress = async (req, res) => {
  const input = readInput(req.body);
  if (input.error) return res.status(400).json({ success: false, message: input.error });
  const count = await prisma.address.count({ where: { userId: req.user.id } });
  if (count >= MAX_ADDRESSES) {
    return res.status(400).json({ success: false, message: `You can save up to ${MAX_ADDRESSES} addresses. Delete one first.` });
  }
  await prisma.$transaction(async (tx) => {
    const created = await tx.address.create({
      data: { userId: req.user.id, label: input.label, address: input.address },
    });
    // The first address, or one marked as default, becomes the default
    const makeDefault = count === 0 || req.body.makeDefault === true;
    await syncDefault(tx, req.user.id, makeDefault ? created.id : null);
  });
  await reply(res, 201, "Address saved", req.user.id);
};

// PUT /api/addresses/:id { label, address }
export const updateAddress = async (req, res) => {
  const own = await findOwn(req.user.id, req.params.id);
  if (!own) return res.status(404).json({ success: false, message: "Address not found" });
  const input = readInput(req.body);
  if (input.error) return res.status(400).json({ success: false, message: input.error });
  await prisma.$transaction(async (tx) => {
    await tx.address.update({ where: { id: own.id }, data: input });
    // Editing the default changes the mirrored text too
    await syncDefault(tx, req.user.id);
  });
  await reply(res, 200, "Address updated", req.user.id);
};

// PATCH /api/addresses/:id/default
export const setDefaultAddress = async (req, res) => {
  const own = await findOwn(req.user.id, req.params.id);
  if (!own) return res.status(404).json({ success: false, message: "Address not found" });
  await prisma.$transaction((tx) => syncDefault(tx, req.user.id, own.id));
  await reply(res, 200, "Default address changed", req.user.id);
};

// DELETE /api/addresses/:id — the next oldest becomes the default
export const deleteAddress = async (req, res) => {
  const own = await findOwn(req.user.id, req.params.id);
  if (!own) return res.status(404).json({ success: false, message: "Address not found" });
  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: own.id } });
    await syncDefault(tx, req.user.id);
  });
  await reply(res, 200, "Address deleted", req.user.id);
};
