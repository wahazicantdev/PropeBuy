import Icon from "./Icon.jsx";

// Five stars, filled up to the rounded value. Read only.
const Stars = ({ value = 0, size = 16 }) => (
  <span className="inline-flex items-center" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Icon
        key={n}
        name="star"
        size={size}
        className={n <= Math.round(value) ? "text-star" : "text-black/15"}
      />
    ))}
  </span>
);

export default Stars;
