// Icon — Google Material Symbols (Outlined, 24px optical size).
// SVGs live in src/assets/icons/material/<group>/<name>.svg and are
// loaded at build time; this component looks them up by name only, so
// a page never cares which group folder an icon sits in.
//
// Usage:  <Icon name="shopping_cart" />            decorative, 20px
//         <Icon name="search" size={24} />          bigger
//         <Icon name="delete" title="Delete" />     meaningful, announced
//
// Color follows the surrounding text (fill="currentColor"), so a
// text-primary or text-danger class on the icon or its parent tints it.

// Eager raw import — every SVG becomes a string in the bundle at build
// time, no network request per icon, no flash of missing icons
const files = import.meta.glob("../assets/icons/material/**/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

// Parse once at module load: name -> { viewBox, paths[] }.
// Files were sanitized on download (svg + path elements only), and we
// render React elements from the parsed d strings — never raw HTML.
const REGISTRY = Object.fromEntries(
  Object.entries(files).map(([path, svg]) => {
    const name = path.split("/").pop().replace(".svg", "");
    const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] || "0 -960 960 960";
    const paths = [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
    return [name, { viewBox, paths }];
  }),
);

const Icon = ({ name, size = 20, className = "", title }) => {
  const icon = REGISTRY[name];

  // Unknown name — loud in dev, invisible-but-sized in the UI so the
  // layout never jumps while someone fixes the typo
  if (!icon) {
    if (import.meta.env.DEV) console.warn(`Icon "${name}" not found`);
    return <span style={{ width: size, height: size }} className="inline-block" />;
  }

  return (
    <svg
      viewBox={icon.viewBox}
      width={size}
      height={size}
      fill="currentColor"
      // shrink-0 — icons never squash inside flex rows
      className={`inline-block shrink-0 ${className}`}
      // Decorative by default; a title makes it a labelled image
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {icon.paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
};

export default Icon;
