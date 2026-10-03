import "./ui.css";

export default function Card({ title, subtitle, action, children, className = "", pad = true, glow }) {
  return (
    <section className={`card ${glow ? "card-glow" : ""} ${className}`} style={glow ? { "--glow": glow } : undefined}>
      {(title || action) && (
        <header className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={pad ? "card-body" : ""}>{children}</div>
    </section>
  );
}
