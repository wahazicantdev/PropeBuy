import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
// Custom dropdown + spinner — house components
import Select from "../../components/Select.jsx";
import Spinner from "../../components/Spinner.jsx";
import Field from "../../components/Field.jsx";
import { createProduct, fetchCategories } from "../../api/product.api.js";

// AddProduct — new listing, ALL fields required including photo
const AddProduct = () => {
  // Text fields via hook-form, dropdown via state (controlled Select)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  // Category pick — held in state like Register barangay
  const [categoryId, setCategoryId] = useState("");
  // Dropdown options loaded once
  const [categories, setCategories] = useState([]);
  // Photo file + its instant preview URL
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  // Block double submit
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Category options — prompt entry first, ids as strings for Select
  const categoryOptions = [
    { value: "", label: "Select category" },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  // Load the 7 documented categories once
  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  // Preview — object URL, revoked on change and unmount (no leaks)
  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  // Submit — every field required, then multipart to the backend
  const onSubmit = async (values) => {
    // Category is state-driven — check before sending
    if (!categoryId) return toast.error("Please select a category");
    // Photo required — a listing without a picture sells nothing
    if (!image) return toast.error("Please add a product photo");
    setLoading(true);
    try {
      // Wire shape the api layer expects — plain object + file
      const data = {
        name: values.name,
        price: values.price,
        stock: values.stock,
        categoryId,
        description: values.description || "",
      };
      const res = await createProduct({ data, image });
      toast.success(res.message || "Product created");
      // Back to the list — new row is on top (createdAt desc)
      navigate("/seller/products");
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        "Product creation failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter max-w-xl">
      <h1 className="font-header text-xl md:text-2xl text-gray-900">
        Add Product
      </h1>
      <p className="font-body text-sm text-passive mt-1">
        List an item buyers in your barangay can reserve and pay for.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {/* Name — backend wants 2 to 255 chars */}
        <Field label="Product name" error={errors.name?.message}>
          <input
            {...register("name", {
              required: "Product name is required",
              minLength: { value: 2, message: "At least 2 characters" },
            })}
            placeholder="e.g. Bamboo Storage Basket"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 font-body text-sm focus:outline-primary"
          />
        </Field>
        {/* Category — custom dropdown, state-driven */}
        <Field label="Category">
          <Select
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
            ariaLabel="Select category"
          />
        </Field>
        {/* Price and stock — labels above, ₱ prefix on price */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price" error={errors.price?.message}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-sm text-passive">
                ₱
              </span>
              <input
                {...register("price", {
                  required: "Price is required",
                  validate: (v) =>
                    parseFloat(v) > 0 || "Price must be greater than 0",
                })}
                type="number"
                min="1"
                step="0.01"
                placeholder="e.g. 249.75"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-3 font-body text-sm focus:outline-primary"
              />
            </div>
          </Field>
          <Field label="Stock" error={errors.stock?.message}>
            <input
              {...register("stock", {
                required: "Stock is required",
                validate: (v) =>
                  // Creation floor is 1 — the backend guard rejects 0 here.
                  // Zeroing stock is an EDIT action (STEP 1 patch made it work)
                  (parseInt(v, 10) >= 1 && !isNaN(v)) ||
                  "Stock must be at least 1 on creation",
              })}
              type="number"
              min="1"
              placeholder="e.g. 12"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 font-body text-sm focus:outline-primary"
            />
          </Field>
        </div>
        {/* Description — REQUIRED, 1000 char ceiling mirrors backend */}
        <Field label="Description" error={errors.description?.message}>
          <textarea
            {...register("description", {
              required: "Description is required",
              maxLength: {
                value: 1000,
                message: "Description cannot exceed 1000 characters",
              },
            })}
            rows={4}
            placeholder="e.g. Condition, size, what is included"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 font-body text-sm focus:outline-primary resize-y"
          />
        </Field>
        {/* Photo — REQUIRED, dashed picker, instant preview */}
        <div>
          <label className="border border-dashed border-gray-300 rounded-lg p-4 font-body text-sm text-passive cursor-pointer block">
            {image ? `Photo selected — ${image.name}` : "Add a product photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImage(e.target.files[0] || null)}
            />
          </label>
          {/* Live preview — same size the cards use */}
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-3 h-40 w-full object-cover rounded-lg border border-gray-100"
            />
          )}
        </div>
        {/* Submit — spinner rides inside the button while busy */}
        <button
          disabled={loading}
          className="btn-primary w-full rounded-lg py-3 font-body text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Spinner />}
          {loading ? "Saving product..." : "Save product"}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;