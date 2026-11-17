import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../stores/auth.store.js";
import { fetchMe } from "../../api/auth.api.js";
import { fetchBarangays } from "../../api/product.api.js";
import Icon from "../../components/Icon.jsx";
import ProfileView from "../../components/ProfileView.jsx";
import AddressBook from "../../components/AddressBook.jsx";

// Buyer profile — identity card plus the saved delivery address
const BuyerProfile = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [barangayName, setBarangayName] = useState("");
  // True once the fresh profile is in. The address form waits for it, so a
  // quick Save can never send the empty address from the login copy.
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  // Refresh from the server once so the status is never stale
  useEffect(() => {
    fetchMe()
      .then((res) => {
        setUser(res.data);
        setLoaded(true);
        // Barangay id to name for the card
        if (res.data?.barangayId) {
          fetchBarangays()
            .then((b) => setBarangayName(b.data?.find((x) => x.id === res.data.barangayId)?.name || ""))
            .catch(() => setBarangayName(""));
        }
      })
      .catch(() => toast.error("Failed to load profile"));
  }, [setUser]);

  // Log out and land on the home page
  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/");
  };

  return (
    <div className="page-enter">
      {/* Breadcrumb */}
      <nav className="font-body text-sm text-black/60 flex items-center gap-1" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-black">Home</Link>
        <Icon name="chevron_right" size={16} />
        <span className="text-black">My profile</span>
      </nav>
      <h1 className="text-3xl md:text-4xl mt-3 mb-6">My profile</h1>
      <ProfileView
        user={user}
        barangayName={barangayName}
        verifiedLabel="Verified member"
        LinkComp={Link}
        links={[{ to: "/orders", label: "My orders", icon: "receipt_long" }]}
        onLogout={handleLogout}
      >
        {/* Saved delivery addresses — waits for the fresh profile */}
        {loaded ? (
          <AddressBook />
        ) : (
          <div className="h-48 rounded-xl bg-surface animate-pulse" />
        )}
      </ProfileView>
    </div>
  );
};

export default BuyerProfile;
