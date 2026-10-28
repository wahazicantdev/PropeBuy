import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
// Custom dropdown + spinner — house components
import Select from "../../components/Select.jsx";
import Spinner from "../../components/Spinner.jsx";
import Field from "../../components/Field.jsx";
import {
  fetchProduct,
  fetchCategories,
  updateProduct,
} from "../../api/product.api.js";

// EditProduct — prefilled form; photo optional; stock can drop to 0
const EditProduct = () => {
  // Route id + optional fast prefill from the list page
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  // Text fields via hook-form, dropdown via state
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  // Resolved product object — route state first, API fallback
  const [product, setProduct] = useState(null);
  // Resolving flag — covers state-less loads
  const [resolving, setResolving] = useState(true);
  // Category pick
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  // Replacement photo — stays null to keep the current one
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const categoryOptions = [
    { value: "", label: "Select category" },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  // Categories load once
  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  // Resolve the product — state passes instantly, API covers refreshes
  useEffect(() => {
    const run = async () => {
      try {
        let src = location.state?.product;
        if (!src) {
          // Public endpoint — resolves active products after refresh
          const res = await fetchProduct(id);
          src = res.data;
        }
        setProduct(src);
        // Prefill — numbers as strings for inputs and Select matching
        reset({
          name: src.name,
          price: String(src.price),
          stock: String(src.stock),
          description: src.description || "",
        });
        setCategoryId(src.categoryId ? String(src.categoryId) : "");
      } catch (err) {
        // Deleted or foreign product — back to the list, honest message
        toast.error("Product not found or already deleted");
        navigate("/seller/products", { replace: true });
      } finally {
        setResolving(false);
      }
    };
    run();
    // Runs per id change only — prefill needs no re-trigger
  }, [id]);

  // Replacement preview — same revoke discipline as Add
  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  // Submit — full field set, photo only when replaced
  const onSubmit = async (values) => {
    if (!categoryId) return toast.error("Please select a category");
    setLoading(true);
    try {
      const data = {
        name: values.name,
        price: values.price,
        stock: values.stock,
        categoryId,
        description: values.description || "",
      };
      const res = await updateProduct(id, { data, image });
      toast.success(res.message || "Product updated");
      navigate("/seller/products");
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        "Product update failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resolving — spinner while the product loads
  if (resolving) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner />
        Loading product...
      </div>
    );
  }

  return (
    <div className="page-enter max-w-xl">
      {/* Back link — one tap to the list, above the title */}
      <Link
        to="/seller/products"
        className="font-body text-xs text-passive hover:text-primary inline-block mb-2"
      >
        Back to My Products
      </Link>
      <h1 className="font-header text-xl md:text-2xl text-gray-900">
        Edit Product
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {/* Name — same rules as create */}
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
        {/* Category — prefilled from the product */}
        <Field label="Category">
          <Select
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
            ariaLabel="Select category"
          />
        </Field>
        {/* Price and stock — edit allows stock 0 (sold out) */}
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
                  // 0 is legal on EDIT — marks the product sold out,
                  // hidden from browse by the backend stock filter
                  (parseInt(v, 10) >= 0 && !isNaN(v)) ||
                  "Stock must be 0 or more",
              })}
              type="number"
              min="0"
              placeholder="e.g. 12"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 font-body text-sm focus:outline-primary"
            />
          </Field>
        </div>
        {/* Description — optional, clearable */}
        <Field
          label="Description (optional)"
          error={errors.description?.message}
        >
          <textarea
            {...register("description", {
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
        {/* Photo — current shown by default, replace only when picked */}
        <div>
          <label className="border border-dashed border-gray-300 rounded-lg p-4 font-body text-sm text-passive cursor-pointer block">
            {image
              ? `New photo — ${image.name}`
              : "Replace photo (optional — keep current if skipped)"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImage(e.target.files[0] || null)}
            />
          </label>
          {/* New preview wins, else the live Cloudinary photo */}
          {preview ? (
            <img
              src={preview}
              alt="New preview"
              className="mt-3 h-40 w-full object-cover rounded-lg border border-gray-100"
            />
          ) : (
            product?.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="mt-3 h-40 w-full object-cover rounded-lg border border-gray-100"
              />
            )
          )}
        </div>
        {/* Submit — spinner while the multipart PUT runs */}
        <button
          disabled={loading}
          className="btn-primary w-full rounded-lg py-3 font-body text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Spinner />}
          {loading ? "Saving changes..." : "Save changes"}
        </button>
      </form>
    </div>
  );
};

export default EditProduct;