// ── PRIVATIZE OLD VERIFICATION DOCUMENTS (11-24) ───────────
// Before 11-24, IDs and Barangay Certificates were uploaded as PUBLIC
// Cloudinary files, so anyone with the link could open them. New
// uploads are private. This one-off script cleans up the old ones:
//   - PENDING accounts: copy each file to a private (authenticated)
//     upload, store the new reference, delete the public file
//   - VERIFIED or REJECTED accounts: the review is done, so delete the
//     public file and clear the column (documents are no longer kept)
// Only links from our own Cloudinary cloud are touched.
//
// Usage (in backend/):
//   npm run privatizeDocs            dry run, only prints what it would do
//   npm run privatizeDocs -- --apply really does it
import cloudinary from "../src/config/cloudinary.js";
// House Prisma client — loads env.js automatically on import
import prisma from "../src/config/prismaClient.js";
import { parseLegacyUrl, deleteDocument } from "../src/utils/document.helper.js";

const APPLY = process.argv.includes("--apply");

// Copies one public file into a private upload, returns the new reference
const copyToPrivate = async (url) => {
  const result = await cloudinary.uploader.upload(url, {
    folder: "propebuy/documents",
    resource_type: "auto",
    type: "authenticated",
  });
  return `private:${result.resource_type}:${result.format}:${result.public_id}`;
};

const main = async () => {
  // Every account still holding an old public https link
  const users = await prisma.user.findMany({
    where: {
      OR: [{ idDocumentUrl: { startsWith: "https://" } }, { certDocumentUrl: { startsWith: "https://" } }],
    },
    select: { id: true, email: true, accountStatus: true, idDocumentUrl: true, certDocumentUrl: true },
    orderBy: { id: "asc" },
  });

  console.log(`${users.length} account(s) with public document links. ${APPLY ? "APPLYING" : "Dry run (add --apply to change things)"}\n`);

  // Pending accounts first, so a shared file is copied before any
  // reviewed account's cleanup deletes it
  users.sort((a, b) => (a.accountStatus === "PENDING" ? -1 : 0) - (b.accountStatus === "PENDING" ? -1 : 0));

  for (const u of users) {
    const fields = ["idDocumentUrl", "certDocumentUrl"].filter((f) => u[f]?.startsWith("https://"));
    for (const field of fields) {
      const url = u[field];
      const ours = Boolean(parseLegacyUrl(url));
      if (u.accountStatus === "PENDING") {
        // Still waiting for review: staff need the file, so keep a private copy
        console.log(`#${u.id} ${u.email} ${field}: copy to private${ours ? " and delete public file" : ""}`);
        if (APPLY) {
          const ref = await copyToPrivate(url);
          await prisma.user.update({ where: { id: u.id }, data: { [field]: ref } });
          if (ours) await deleteDocument(url);
        }
      } else {
        // Already reviewed: nothing to keep
        console.log(`#${u.id} ${u.email} ${field}: ${u.accountStatus}, ${ours ? "delete public file and " : ""}clear`);
        if (APPLY) {
          if (ours) await deleteDocument(url);
          await prisma.user.update({ where: { id: u.id }, data: { [field]: null } });
        }
      }
    }
  }

  console.log("\nDone.");
};

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
