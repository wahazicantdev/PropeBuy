import toast from "react-hot-toast";
import { fetchUserDocumentLink } from "../api/admin.api.js";

// ── OPEN A PRIVATE VERIFICATION DOCUMENT (11-24) ───────
// IDs and certificates have no public link. On click we ask the backend
// for a signed link that works for a few minutes, then show it.
// The tab is opened right away, before the request, because browsers
// block a window.open that happens after an await.
export const openUserDocument = async (userId, kind) => {
  // Blank tab now, filled once the link arrives
  const tab = window.open("", "_blank");
  try {
    const res = await fetchUserDocumentLink(userId, kind);
    if (tab) {
      // The new tab must not be able to reach back into the admin page
      tab.opener = null;
      tab.location.href = res.data.url;
    } else {
      // Pop-ups blocked: open in this tab instead
      window.location.assign(res.data.url);
    }
  } catch (err) {
    tab?.close();
    toast.error(err.response?.data?.message || "Could not open the document");
  }
};
