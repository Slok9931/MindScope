import Icon from "./Icon";
import "./ui.css";

export default function ChipGroup({ label, value, onChange, options }) {
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <div className="chips" role="radiogroup">
        {options.map((o) => (
          <button type="button" key={o} role="radio" aria-checked={o === value} className={`chip ${o === value ? "is-on" : ""}`} onClick={() => onChange(o)}>
            {o === value && <Icon name="check" size={13} stroke={2.6} />}{o}
          </button>
        ))}
      </div>
    </div>
  );
}
