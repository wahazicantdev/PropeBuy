import { useState } from "react";

// ── PAGINATION (11-26) ─────────────────────────────────
// Every list shows at most 50 rows per page. Pass the already filtered
// list; the page goes back to 1 whenever its length or resetKey changes
// (a new filter or search).
export const PAGE_SIZE = 50;

export const usePaged = (items, resetKey = "") => {
  const total = items?.length || 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // The page is remembered together with the filter it belongs to. When
  // the filter or the row count changes, the saved page no longer matches
  // and the list starts again from page 1, with no extra render.
  const sig = `${resetKey}|${total}`;
  const [saved, setSaved] = useState({ sig, page: 1 });
  const page = saved.sig === sig ? Math.min(saved.page, pages) : 1;
  const setPage = (n) => setSaved({ sig, page: Math.max(1, Math.min(n, pages)) });

  const start = (page - 1) * PAGE_SIZE;
  return {
    pageItems: (items || []).slice(start, start + PAGE_SIZE),
    page,
    pages,
    total,
    start,
    setPage,
  };
};
