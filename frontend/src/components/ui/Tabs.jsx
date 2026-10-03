import "./ui.css";

export default function Tabs({ tabs, value, onChange, variant = "line" }) {
  const idx = Math.max(0, tabs.findIndex((t) => t.value === value));
  return (
    <div className={`tabs tabs-${variant === "line" ? "underline" : "pill"}`} role="tablist" style={{ "--n": tabs.length, "--i": idx }}>
      {variant === "pill" && <span className="tabs-thumb" />}
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={t.value === value} className={t.value === value ? "is-on" : ""} onClick={() => onChange(t.value)}
                style={t.color && t.value === value ? { "--tc": t.color } : undefined}>
          {t.dot && <i className="tab-dot" style={{ background: t.dot }} />}{t.label}
        </button>
      ))}
      {variant === "line" && <span className="tabs-ink" />}
    </div>
  );
}
