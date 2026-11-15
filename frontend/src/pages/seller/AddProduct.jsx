import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import ProductWizard from "../../components/ProductWizard.jsx";
import Icon from "../../components/Icon.jsx";
import { createProduct } from "../../api/product.api.js";

// AddProduct — new listing in 4 steps: details, price and stock,
// up to 4 photos, then a review before publishing
const AddProduct = () => {
  // Block double submit while photos upload
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Called by the wizard's last step with the full listing
  const onSave = async ({ data, photos }) => {
    setSaving(true);
    try {
      const res = await createProduct({ data, photos });
      toast.success(res.message || "Product created");
      // Back to the list — the new row is on top (newest first)
      navigate("/seller/products");
    } catch (err) {
      toast.error(
        err.response?.data?.errors?.[0]?.message ||
          err.response?.data?.message ||
          "Product creation failed",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter max-w-2xl">
      {/* Back link — one tap to the list */}
      <Link
        to="/seller/products"
        className="font-body text-sm text-passive hover:text-primary inline-flex items-center gap-1 mb-3"
      >
        <Icon name="arrow_back" size={16} /> My Products
      </Link>
      <h1 className="heading-body text-2xl md:text-3xl font-bold text-black">Add product</h1>
      <p className="font-body text-sm text-passive mt-1 mb-6">
        List an item buyers in your barangay can reserve and pay for.
      </p>
      <ProductWizard mode="add" saving={saving} onSave={onSave} />
    </div>
  );
};

export default AddProduct;
