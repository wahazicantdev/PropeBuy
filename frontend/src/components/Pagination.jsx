import Icon from "./Icon.jsx";

// Page controls under a list (11-26). Hidden when everything fits on one
// page. Takes the object returned by usePaged().
const Pagination = ({ paged, label = "items" }) => {
  const { page, pages, total, start, pageItems, setPage } = paged;
  if (pages <= 1) return null;

  // Go to a page and bring the list back into view
  const go = (n) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-between gap-3 font-body text-sm" aria-label="Pages">
      {/* Where we are, e.g. "51–100 of 230 orders" */}
      <p className="text-black/60">
        {start + 1}–{start + pageItems.length} of {total} {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page === 1}
          className="w-10 h-10 rounded-full bg-surface flex items-center justify-center disabled:opacity-40"
          aria-label="Previous page"
        >
          <Icon name="chevron_left" size={20} />
        </button>
        <span className="px-2 tabular-nums">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={page === pages}
          className="w-10 h-10 rounded-full bg-surface flex items-center justify-center disabled:opacity-40"
          aria-label="Next page"
        >
          <Icon name="chevron_right" size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
