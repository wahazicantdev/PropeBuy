import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../stores/auth.store.js";
import { fetchMe } from "../../api/auth.api.js";
import { fetchBarangays } from "../../api/product.api.js";
import PageHeader from "../../components/PageHeader.jsx";
import ProfileView from "../../components/ProfileView.jsx";
import ProfileAddress from "../../components/ProfileAddress.jsx";
import AccountSettings from "../../components/AccountSettings.jsx";
import Icon from "../../components/Icon.jsx";

// Shop profile — same layout as the buyer profile, plus store settings
const SellerProfile = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [barangayName, setBarangayName] = useState("");
  // True once the fresh profile is in, so a quick Save never sends the
  // empty address from the login copy
  const [loaded, setLoaded] = useState(false);

  // Refresh from the server so the status is never a stale store copy
  useEffect(() => {
    fetchMe()
      .then((res) => {
        setUser(res.data);
        setLoaded(true);
        if (res.data?.barangayId) {
          fetchBarangays()
            .then((b) => setBarangayName(b.data?.find((x) => x.id === res.data.barangayId)?.name || ""))
            .catch(() => setBarangayName(""));
        }
      })
      .catch(() => toast.error("Failed to load profile"));
  }, [setUser]);

  // Hard reload to the seller door so protected routes never race the store clear
  const handleLogout = () => {
    useAuthStore.getState().logout();
    toast.success("Logged out");
    window.location.href = "/login/seller";
  };

  const verified = user?.accountStatus === "VERIFIED";

  return (
    <div className="page-enter">
      <PageHeader
        title="Shop profile"
        subtitle="Your store details, location and delivery settings."
        actions={
          verified && (
            <Link to={`/store/${user?.id}`} className="btn-outline btn-active px-5 py-2.5 font-body text-sm font-medium flex items-center gap-1.5">
              <Icon name="storefront" size={18} /> View my store
            </Link>
          )
        }
      />
      {/* Pending sellers land here first — say what happens next */}
      {user?.accountStatus === "PENDING" && (
        <div className="mb-5 rounded-xl bg-surface p-4 font-body text-sm flex items-start gap-3">
          <Icon name="pending" className="mt-px" />
          <span>Your documents are being checked by the barangay administrator. You can set up your store address now; selling opens once you are verified.</span>
        </div>
      )}
      <ProfileView
        user={user}
        barangayName={barangayName}
        verifiedLabel="Verified Local Vendor"
        LinkComp={Link}
        links={[
          { to: "/seller/products", label: "My products", icon: "inventory_2" },
          { to: "/seller/earnings", label: "Earnings and payouts", icon: "account_balance_wallet" },
        ]}
        onLogout={handleLogout}
      >
        {/* Store address, pin and delivery — key remounts it with fresh values */}
        {loaded && <AccountSettings key={`${user?.name}-${user?.email}`} />}
        {loaded ? (
          <ProfileAddress
            isSeller
            key={`${user?.id}-${user?.address ?? ""}-${user?.offersDelivery}-${user?.deliveryFee}-${user?.storeLat}-${user?.storeLng}`}
          />
        ) : (
          <div className="h-96 rounded-xl bg-surface animate-pulse" />
        )}
      </ProfileView>
    </div>
  );
};

export default SellerProfile;
