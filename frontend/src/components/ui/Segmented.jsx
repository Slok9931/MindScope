import "./ui.css";

/** Sliding-pill single choice control. options: [{value,label,color?}] or strings. */
export default function Segmented({ label, value, onChange, options, size = "md" }) {
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const idx = Math.max(0, items.findIndex((o) => o.value === value));
  const key = (e) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (d) { e.preventDefault(); onChange(items[(idx + d + items.length) % items.length].value); }
  };
  const color = items[idx]?.color;
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <div className={`seg seg-${size}`} role="radiogroup" onKeyDown={key} style={{ "--n": items.length, "--i": idx, "--c": color }}>
        <span className={`seg-thumb ${color ? "has-color" : ""}`} />
        {items.map((o) => (
          <button type="button" key={o.value} role="radio" aria-checked={o.value === value} tabIndex={o.value === value ? 0 : -1}
                  className={o.value === value ? "is-on" : ""} onClick={() => onChange(o.value)}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}
