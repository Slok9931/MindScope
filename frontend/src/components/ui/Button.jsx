import "./ui.css";

export default function Button({ children, variant = "primary", icon, size = "md", loading, ...rest }) {
  return (
    <button className={`btn btn-${variant} btn-${size}`} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className="spinner" /> : icon}
      {children}
    </button>
  );
}
