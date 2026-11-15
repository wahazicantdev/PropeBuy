// Page title block for seller and admin pages — one look everywhere.
// title: page name. subtitle: one line of help. actions: buttons on the right.
const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
    <div className="min-w-0">
      <h1 className="heading-body text-2xl md:text-3xl font-bold text-black">{title}</h1>
      {subtitle && <p className="font-body text-sm text-passive mt-1">{subtitle}</p>}
    </div>
    {/* Actions wrap under the title on phones */}
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

export default PageHeader;
