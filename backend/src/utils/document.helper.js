import axios from "axios";
import cloudinary from "../config/cloudinary.js";
import { CLOUDINARY_CLOUD_NAME } from "../config/env.js";

// ── PRIVATE VERIFICATION DOCUMENTS (evaluation feedback, 11-24) ──
// Government IDs and Barangay Certificates are sensitive personal
// information (RA 10173 Sec. 3). So they are:
//   1. uploaded to Cloudinary as "authenticated", with no public link
//   2. opened only through a signed link that expires in a few minutes
//   3. deleted once staff approve or reject the account
// The database keeps a reference, never a link:
//   "private:<resource type>:<format>:<public id>"
// Older accounts may still hold a public https link (legacy). Those are
// cleaned by prisma/privatize.documents.js.

const PREFIX = "private:";

// How long a signed link works, in seconds
export const LINK_SECONDS = 5 * 60;

// Uploads one document buffer as an authenticated (non-public) asset
// and returns the reference string to store in the database
export const uploadPrivateDocument = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        // "authenticated" means the file can only be opened with a signature
        { folder: "propebuy/documents", resource_type: "auto", type: "authenticated" },
        (error, result) => {
          if (error) return reject(error);
          // Keep what we need to sign a link and to delete it later
          resolve(`${PREFIX}${result.resource_type}:${result.format}:${result.public_id}`);
        },
      )
      .end(buffer);
  });

// Splits a stored reference into its parts, or null for a legacy link
const parseRef = (stored) => {
  if (!stored?.startsWith(PREFIX)) return null;
  const [resourceType, format, ...rest] = stored.slice(PREFIX.length).split(":");
  return { resourceType, format, publicId: rest.join(":") };
};

// Finds the public id inside a legacy public Cloudinary link from our
// own cloud. Returns null for anything else (demo images, other hosts).
// Example: https://res.cloudinary.com/<cloud>/image/upload/v123/propebuy/documents/abc.jpg
export const parseLegacyUrl = (url) => {
  const match = String(url || "").match(
    /^https:\/\/res\.cloudinary\.com\/([^/]+)\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i,
  );
  if (!match || match[1] !== CLOUDINARY_CLOUD_NAME) return null;
  return { resourceType: match[2], publicId: match[3] };
};

// Signed link that opens the document for LINK_SECONDS, then stops working.
// A legacy public link is returned as it is until the cleanup script runs.
export const signedDocumentLink = (stored) => {
  if (!stored) return null;
  const ref = parseRef(stored);
  if (!ref) return stored;
  return cloudinary.utils.private_download_url(ref.publicId, ref.format, {
    resource_type: ref.resourceType,
    type: "authenticated",
    // Unix time in seconds when the link expires
    expires_at: Math.floor(Date.now() / 1000) + LINK_SECONDS,
  });
};

// Downloads a document as a buffer, used when staff re-run the OCR
export const fetchDocument = async (stored) => {
  const res = await axios.get(signedDocumentLink(stored), { responseType: "arraybuffer" });
  return Buffer.from(res.data);
};

// Deletes one stored document from Cloudinary. Never throws: a failed
// delete is logged and the admin's decision still goes through.
export const deleteDocument = async (stored) => {
  if (!stored) return;
  try {
    const ref = parseRef(stored);
    if (ref) {
      await cloudinary.uploader.destroy(ref.publicId, {
        type: "authenticated",
        resource_type: ref.resourceType,
        // Also clear any cached copy on Cloudinary's CDN
        invalidate: true,
      });
      return;
    }
    // Legacy public upload from our own cloud
    const legacy = parseLegacyUrl(stored);
    if (legacy) {
      await cloudinary.uploader.destroy(legacy.publicId, {
        type: "upload",
        resource_type: legacy.resourceType,
        invalidate: true,
      });
    }
  } catch (err) {
    console.error("Document delete failed:", err.message);
  }
};

// Replaces the stored references with true/false before a user is sent
// to the admin portal, so no link or reference ever leaves the server
export const hideDocuments = ({ idDocumentUrl, certDocumentUrl, ...user }) => ({
  ...user,
  hasIdDocument: Boolean(idDocumentUrl),
  hasCertDocument: Boolean(certDocumentUrl),
});
