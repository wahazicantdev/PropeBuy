import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import ProductWizard from "../../components/ProductWizard.jsx";
import Spinner from "../../components/Spinner.jsx";
import Icon from "../../components/Icon.jsx";
import { fetchProduct, updateProduct } from "../../api/product.api.js";

// EditProduct — same 4 steps as Add, prefilled. Any step can be opened
// and saved; stock can drop to 0 to mark the item sold out.
const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Product loaded fresh from the API so the photo list is current
  const [product, setProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load the product once per id
  useEffect(() => {
    fetchProduct(id)
      .then((res) => setProduct(res.data))
      .catch(() => {
        // Deleted or foreign product — back to the list, honest message
        toast.error("Product not found or already deleted");
        navigate("/seller/products", { replace: true });
      });
  }, [id, navigate]);

  // Called by the wizard with the edited listing
  const onSave = async ({ data, photos }) => {
    setSaving(true);
    try {
      const res = await updateProduct(id, { data, photos });
      toast.success(res.message || "Product updated");
      navigate("/seller/products");
    } catch (err) {
      toast.error(
        err.response?.data?.errors?.[0]?.message ||
          err.response?.data?.message ||
          "Product update failed",
      );
    } finally {
      setSaving(false);
    }
  };

  // Spinner while the product loads
  if (!product) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner />
        Loading product...
      </div>
    );
  }

  return (
    <div className="page-enter max-w-2xl">
      <Link
        to="/seller/products"
        className="font-body text-sm text-passive hover:text-primary inline-flex items-center gap-1 mb-3"
      >
        <Icon name="arrow_back" size={16} /> My Products
      </Link>
      <h1 className="heading-body text-2xl md:text-3xl font-bold text-black">Edit product</h1>
      <p className="font-body text-sm text-passive mt-1 mb-6 break-words">{product.name}</p>
      {/* key remounts the wizard if a different product loads */}
      <ProductWizard key={product.id} mode="edit" product={product} saving={saving} onSave={onSave} />
    </div>
  );
};

export default EditProduct;
