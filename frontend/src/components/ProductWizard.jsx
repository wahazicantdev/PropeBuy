import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Select from "./Select.jsx";
import Spinner from "./Spinner.jsx";
import FieldLabel from "./FieldLabel.jsx";
import Stepper from "./Stepper.jsx";
import PhotoPicker from "./PhotoPicker.jsx";
import Icon from "./Icon.jsx";
import { fetchCategories } from "../api/product.api.js";
import { formatPeso } from "../utils/format.js";
import { productPhotos } from "../utils/photos.js";

// The 4 steps of adding or editing a product
const STEPS = ["Details", "Price & stock", "Photos", "Review"];
// Fields checked before leaving each step
const STEP_FIELDS = [["name", "description"], ["price", "stock"], [], []];

// Shared step-by-step product form for Add Product and Edit Product.
// mode "add": steps unlock in order, photo and description required.
// mode "edit": prefilled from product, any step can be opened, and
// "Save changes" works from every step.
const ProductWizard = ({ mode = "add", product = null, saving, onSave }) => {
  const isEdit = mode === "edit";
  const {
    register,
    trigger,
    getValues,
    watch,
    formState: { errors },
  } = useForm({
    // Edit starts from the saved product; numbers as strings for inputs
    defaultValues: product
      ? {
          name: product.name,
          price: String(product.price),
          stock: String(product.stock),
          description: product.description || "",
        }
      : {},
  });
  const [step, setStep] = useState(0);
  const [categoryId, setCategoryId] = useState(product?.categoryId ? String(product.categoryId) : "");
  const [categories, setCategories] = useState([]);
  // Physical-goods confirmation, asked when a listing enters Others
  const [deliverable, setDeliverable] = useState(false);
  // Variations — rows of { id?, name, price, stock } as input strings.
  // A product with variations takes its price and stock from them.
  const [variants, setVariants] = useState(() =>
    (product?.variants || []).map((x) => ({ id: x.id, name: x.name, price: String(Number(x.price)), stock: String(x.stock) })),
  );
  const [useVariants, setUseVariants] = useState(() => (product?.variants || []).length > 0);
  // Edit one cell of one row
  const setVariant = (i, key, value) =>
    setVariants((rows) => rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  // Photos, cover first — saved ones as { url }, new ones as { file }
  const [photos, setPhotos] = useState(() => productPhotos(product).map((url) => ({ url })));

  // Load categories once
  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  // Cover preview for the review step, revoked when it changes
  const coverSrc = useMemo(
    () => (photos[0]?.file ? URL.createObjectURL(photos[0].file) : photos[0]?.url || null),
    [photos],
  );
  useEffect(
    () => () => {
      if (photos[0]?.file && coverSrc) URL.revokeObjectURL(coverSrc);
    },
    [coverSrc, photos],
  );

  const categoryOptions = [
    { value: "", label: "Select category" },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ];
  const categoryName = categories.find((c) => String(c.id) === categoryId)?.name || "";
  // Others is open-ended, so the seller confirms it is a physical good.
  // A listing already in Others was confirmed when it entered it.
  const needsConfirm =
    categoryName.toLowerCase() === "others" && String(product?.categoryId ?? "") !== categoryId;

  // Checks one step; returns true when it is complete
  const checkStep = async (i) => {
    // With variations on, the rows are checked instead of price and stock
    const fields = i === 1 && useVariants ? [] : STEP_FIELDS[i];
    if (!(await trigger(fields))) return false;
    if (i === 1 && useVariants) {
      const problem = variantProblem();
      if (problem) {
        toast.error(problem);
        return false;
      }
    }
    if (i === 0 && !categoryId) {
      toast.error("Please select a category");
      return false;
    }
    if (i === 0 && needsConfirm && !deliverable) {
      toast.error("Please confirm this is a physical item");
      return false;
    }
    if (i === 2 && !isEdit && photos.length === 0) {
      toast.error("Add at least 1 photo. Buyers trust listings with pictures.");
      return false;
    }
    return true;
  };

  // First problem in the variation rows, or null when they are fine
  const variantProblem = () => {
    if (variants.length < 2) return "Add at least 2 variations, or turn variations off";
    const names = new Set();
    for (const r of variants) {
      const name = r.name.trim().toLowerCase();
      if (!name) return "Every variation needs a name";
      if (names.has(name)) return `"${r.name.trim()}" is listed twice`;
      names.add(name);
      if (!(parseFloat(r.price) >= 1)) return `Price of "${r.name.trim()}" must be at least ₱1`;
      if (!Number.isInteger(Number(r.stock)) || r.stock === "" || Number(r.stock) < 0) return `Stock of "${r.name.trim()}" must be 0 or more`;
    }
    if (!isEdit && variants.every((r) => Number(r.stock) === 0)) return "At least one variation needs stock";
    return null;
  };
  // Lowest price and total stock — what buyers see on the product card
  const variantPrice = variants.length ? Math.min(...variants.map((r) => parseFloat(r.price) || 0)) : 0;
  const variantStock = variants.reduce((sum, r) => sum + (Number(r.stock) || 0), 0);

  // Next — validate the current step first
  const next = async () => {
    if (await checkStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  // Jump — going back is free, going forward checks the current step
  const jump = async (i) => {
    if (i < step || (await checkStep(step))) setStep(i);
  };

  // Final save — checks every step, opens the first one with a problem
  const save = async () => {
    for (let i = 0; i < STEPS.length - 1; i++) {
      if (!(await checkStep(i))) return setStep(i);
    }
    const v = getValues();
    const rows = useVariants
      ? variants.map((r) => ({ ...(r.id ? { id: r.id } : {}), name: r.name.trim(), price: parseFloat(r.price), stock: Number(r.stock) }))
      : [];
    onSave({
      data: {
        name: v.name,
        // Lowest variation price and total stock when variations are on
        price: useVariants ? String(variantPrice) : v.price,
        stock: useVariants ? String(variantStock) : v.stock,
        // Empty list on edit removes old variations
        variants: rows,
        categoryId,
        description: v.description || "",
        deliverableConfirmed: needsConfirm && deliverable,
      },
      photos,
    });
  };

  // Enter key moves forward instead of submitting half a form
  const onKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "BUTTON") {
      e.preventDefault();
      if (step < STEPS.length - 1) next();
    }
  };

  // Live values for the review step and the character counter
  const v = watch();
  const inputCls = "w-full px-5 py-3.5 font-body text-sm";

  return (
    <form onSubmit={(e) => e.preventDefault()} onKeyDown={onKeyDown} className="space-y-6">
      <Stepper steps={STEPS} current={step} onJump={jump} jumpAll={isEdit} />

      <div className="bg-white border border-black/10 rounded-xl p-5 md:p-6 space-y-4">
        {/* ── STEP 1: name, category, description ── */}
        {step === 0 && (
          <>
            <h2 className="heading-body text-lg font-bold">What are you selling?</h2>
            <div>
              <FieldLabel htmlFor="name">Product name</FieldLabel>
              <input
                id="name"
                {...register("name", {
                  required: "Product name is required",
                  minLength: { value: 2, message: "At least 2 characters" },
                  maxLength: { value: 255, message: "255 characters at most" },
                })}
                placeholder="Example: Handwoven bayong"
                className={inputCls}
              />
              {errors.name && <p className="text-danger text-xs mt-1 pl-5">{errors.name.message}</p>}
            </div>
            <div>
              <FieldLabel>Category</FieldLabel>
              <Select value={categoryId} onChange={setCategoryId} options={categoryOptions} ariaLabel="Select category" />
            </div>
            {/* Others confirmation — keeps services and non-deliverables out */}
            {needsConfirm && (
              <label className="flex items-start gap-3 bg-surface rounded-xl p-4 font-body text-sm text-black cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliverable}
                  onChange={(e) => setDeliverable(e.target.checked)}
                  className="mt-0.5 w-4 h-4 shrink-0 accent-black"
                />
                <span>
                  I confirm this is a physical item that can be picked up or delivered. Services,
                  dine-in meals and fresh produce are not allowed.
                </span>
              </label>
            )}
            <div>
              <FieldLabel htmlFor="description">Description{isEdit ? " (optional)" : ""}</FieldLabel>
              <textarea
                id="description"
                {...register("description", {
                  required: isEdit ? false : "Description is required",
                  maxLength: { value: 1000, message: "Description cannot exceed 1000 characters" },
                })}
                rows={5}
                placeholder="Condition, size, materials, what is included"
                className={`${inputCls} rounded-xl resize-y`}
              />
              <div className="flex justify-between mt-1 px-1">
                <p className="text-danger text-xs">{errors.description?.message}</p>
                <p className="font-body text-xs text-black/50">{(v.description || "").length}/1000</p>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 2: price and stock ── */}
        {step === 1 && (
          <>
            <h2 className="heading-body text-lg font-bold">Price and stock</h2>
            {/* Variations switch — sizes, colors, pack sizes */}
            <label className="flex items-start gap-3 bg-surface rounded-xl p-4 font-body text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={useVariants}
                onChange={(e) => {
                  setUseVariants(e.target.checked);
                  // Two empty rows to start, the plain price prefilled
                  if (e.target.checked && variants.length === 0) {
                    const base = getValues("price") || "";
                    setVariants([
                      { name: "", price: base, stock: "" },
                      { name: "", price: base, stock: "" },
                    ]);
                  }
                }}
                className="mt-0.5 w-4 h-4 shrink-0 accent-black"
              />
              <span>
                <span className="font-bold block">This product has variations</span>
                <span className="text-black/60">Different sizes, colors or pack sizes, each with its own price and stock.</span>
              </span>
            </label>
            {useVariants ? (
              <div className="space-y-3">
                {variants.map((r, i) => (
                  // One row per option — stacks on phones
                  <div key={r.id ?? `new-${i}`} className="grid grid-cols-2 sm:grid-cols-[1fr_8rem_7rem_auto] gap-2 items-center">
                    <input
                      value={r.name}
                      onChange={(e) => setVariant(i, "name", e.target.value)}
                      maxLength={50}
                      placeholder="Name, e.g. Small or Red"
                      aria-label={`Variation ${i + 1} name`}
                      className="col-span-2 sm:col-span-1 px-5 py-3 font-body text-sm"
                    />
                    <input
                      value={r.price}
                      onChange={(e) => setVariant(i, "price", e.target.value)}
                      type="number"
                      min="1"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Price ₱"
                      aria-label={`Variation ${i + 1} price`}
                      className="px-5 py-3 font-body text-sm"
                    />
                    <input
                      value={r.stock}
                      onChange={(e) => setVariant(i, "stock", e.target.value)}
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="Stock"
                      aria-label={`Variation ${i + 1} stock`}
                      className="px-5 py-3 font-body text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setVariants((rows) => rows.filter((_, j) => j !== i))}
                      className="col-span-2 sm:col-span-1 justify-self-end p-2 text-black/50 hover:text-danger"
                      aria-label={`Remove variation ${i + 1}`}
                    >
                      <Icon name="delete" size={20} />
                    </button>
                  </div>
                ))}
                {variants.length < 20 && (
                  <button
                    type="button"
                    onClick={() => setVariants((rows) => [...rows, { name: "", price: rows[rows.length - 1]?.price || "", stock: "" }])}
                    className="font-body text-sm font-bold underline flex items-center gap-1"
                  >
                    <Icon name="add" size={18} /> Add variation
                  </button>
                )}
                <p className="font-body text-xs text-black/60">
                  Buyers pick one before adding to cart. The card shows the lowest price ({formatPeso(variantPrice)}) and a total stock of {variantStock}.
                </p>
              </div>
            ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="price">Price (₱)</FieldLabel>
                <input
                  id="price"
                  {...register("price", {
                    required: "Price is required",
                    validate: (x) => parseFloat(x) > 0 || "Price must be greater than 0",
                  })}
                  type="number"
                  min="1"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  className={inputCls}
                />
                {errors.price && <p className="text-danger text-xs mt-1 pl-5">{errors.price.message}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="stock">Stock</FieldLabel>
                <input
                  id="stock"
                  {...register("stock", {
                    required: "Stock is required",
                    // New listings start with at least 1. Editing can set 0 (sold out).
                    validate: (x) =>
                      (Number.isInteger(Number(x)) && Number(x) >= (isEdit ? 0 : 1)) ||
                      (isEdit ? "Stock must be 0 or more" : "Stock must be at least 1"),
                  })}
                  type="number"
                  min={isEdit ? 0 : 1}
                  inputMode="numeric"
                  placeholder="How many you have"
                  className={inputCls}
                />
                {errors.stock && <p className="text-danger text-xs mt-1 pl-5">{errors.stock.message}</p>}
              </div>
            </div>
            )}
            <p className="font-body text-xs text-black/60 flex items-start gap-2">
              <Icon name="info" size={16} className="mt-px" />
              Stock goes down by itself after every order, and you get a notice when it runs low.
            </p>
          </>
        )}

        {/* ── STEP 3: photos ── */}
        {step === 2 && (
          <>
            <h2 className="heading-body text-lg font-bold">Photos</h2>
            <PhotoPicker photos={photos} onChange={setPhotos} />
          </>
        )}

        {/* ── STEP 4: review — what buyers will see ── */}
        {step === 3 && (
          <>
            <h2 className="heading-body text-lg font-bold">Review your listing</h2>
            <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
              <div className="relative aspect-square rounded-xl bg-card overflow-hidden max-w-[10rem]">
                {coverSrc ? (
                  <img src={coverSrc} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-black/25">
                    <Icon name="image" size={40} />
                  </span>
                )}
              </div>
              <dl className="font-body text-sm space-y-3 min-w-0">
                <div>
                  <dt className="text-black/50 text-xs">Name</dt>
                  <dd className="font-bold break-words">{v.name}</dd>
                </div>
                <div>
                  <dt className="text-black/50 text-xs">Category</dt>
                  <dd>{categoryName || "—"}</dd>
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  <div>
                    <dt className="text-black/50 text-xs">Price</dt>
                    <dd className="font-bold">
                      {useVariants ? `From ${formatPeso(variantPrice)}` : v.price ? formatPeso(v.price) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-black/50 text-xs">Stock</dt>
                    <dd>{useVariants ? variantStock : v.stock}</dd>
                  </div>
                  <div>
                    <dt className="text-black/50 text-xs">Photos</dt>
                    <dd>{photos.length}/4</dd>
                  </div>
                </div>
                {useVariants && (
                  <div>
                    <dt className="text-black/50 text-xs">Variations</dt>
                    <dd>
                      <ul className="mt-1 space-y-0.5">
                        {variants.map((r, i) => (
                          <li key={i} className="flex justify-between gap-3">
                            <span className="truncate">{r.name || "—"}</span>
                            <span className="shrink-0 text-black/70">{formatPeso(parseFloat(r.price) || 0)} · {Number(r.stock) || 0} left</span>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
                {v.description && (
                  <div>
                    <dt className="text-black/50 text-xs">Description</dt>
                    <dd className="text-black/70 whitespace-pre-line break-words">{v.description}</dd>
                  </div>
                )}
              </dl>
            </div>
          </>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className="flex items-center gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="btn-outline btn-active px-5 py-3 font-body text-sm font-medium flex items-center gap-1"
          >
            <Icon name="arrow_back" size={18} /> Back
          </button>
        )}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Edit mode can save from any step */}
          {isEdit && step < STEPS.length - 1 && (
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="btn-outline btn-active px-5 py-3 font-body text-sm font-medium disabled:opacity-50"
            >
              Save
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="btn-primary btn-active px-7 py-3 font-body text-sm font-medium flex items-center gap-1"
            >
              Next <Icon name="arrow_forward" size={18} />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="btn-primary btn-active px-7 py-3 font-body text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Spinner /> : <Icon name="check_circle" size={18} />}
              {saving ? "Saving..." : isEdit ? "Save changes" : "Publish product"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default ProductWizard;
