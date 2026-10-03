import Icon from "./Icon";
import Button from "./Button";
import "./ui.css";

export const Skeleton = ({ h = 220, className = "" }) => <div className={`skeleton ${className}`} style={{ height: h }} />;

export function ErrorState({ error, onRetry }) {
  return (
    <div className="error-state">
      <Icon name="alert" size={28} />
      <h3>Couldn't reach the API</h3>
      <p>{error?.message ?? "Unknown error"}</p>
      <p className="muted">Make sure the backend is running: <code>uvicorn app.main:app --reload</code> inside <code>backend/</code>.</p>
      {onRetry && <Button variant="ghost" onClick={onRetry} icon={<Icon name="reset" size={16} />}>Try again</Button>}
    </div>
  );
}

export function Callout({ tone = "info", title, children }) {
  const icon = { info: "info", why: "bulb", warn: "alert", tip: "bolt" }[tone];
  return (
    <aside className={`callout callout-${tone}`}>
      <Icon name={icon} size={18} />
      <div>{title && <strong>{title}</strong>}<div>{children}</div></div>
    </aside>
  );
}

export const Badge = ({ children, color = "#7c6cff" }) => <span className="badge" style={{ "--bc": color }}>{children}</span>;
