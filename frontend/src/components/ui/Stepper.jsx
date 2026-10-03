import Icon from "./Icon";
import "./ui.css";

export default function Stepper({ label, value, onChange, min, max, unit }) {
  const set = (v) => onChange(Math.min(max, Math.max(min, v)));
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="stepper" role="spinbutton" aria-valuenow={value} aria-valuemin={min} aria-valuemax={max} tabIndex={0}
           onKeyDown={(e) => { if (e.key === "ArrowUp") { e.preventDefault(); set(value + 1); } if (e.key === "ArrowDown") { e.preventDefault(); set(value - 1); } }}>
        <button type="button" onClick={() => set(value - 1)} disabled={value <= min} aria-label="Decrease"><Icon name="minus" size={16} /></button>
        <div key={value} className="stepper-value">{value}<small>{unit}</small></div>
        <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label="Increase"><Icon name="plus" size={16} /></button>
      </div>
    </div>
  );
}
