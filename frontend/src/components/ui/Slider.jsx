import { useRef, useState } from "react";
import "./ui.css";

/** Pointer-driven slider. `range` shades the span covered by the training data, `mean` marks the dataset average. */
export default function Slider({ label, value, onChange, min, max, step = 1, unit = "", range, mean, decimals = 0 }) {
  const track = useRef(null);
  const [drag, setDrag] = useState(false);
  const pct = (v) => ((v - min) / (max - min)) * 100;
  const snap = (v) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const fromEvent = (e) => {
    const r = track.current.getBoundingClientRect();
    return snap(min + ((e.clientX - r.left) / r.width) * (max - min));
  };
  const down = (e) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag(true); onChange(+fromEvent(e).toFixed(decimals)); };
  const move = (e) => { if (drag) onChange(+fromEvent(e).toFixed(decimals)); };
  const key = (e) => {
    const d = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: step * 5, PageDown: -step * 5 }[e.key];
    if (d) { e.preventDefault(); onChange(+snap(value + d).toFixed(decimals)); }
    else if (e.key === "Home") onChange(min);
    else if (e.key === "End") onChange(max);
  };
  const outside = range && (value < range[0] || value > range[1]);

  return (
    <div className="field">
      <div className="slider-top">
        <span className="field-label">{label}</span>
        <span className={`slider-value ${outside ? "is-out" : ""}`}>{value.toFixed(decimals)}<small>{unit}</small></span>
      </div>
      <div ref={track} className={`slider ${drag ? "is-drag" : ""}`} onPointerDown={down} onPointerMove={move} onPointerUp={() => setDrag(false)} onPointerCancel={() => setDrag(false)}>
        <div className="slider-rail" />
        {range && <div className="slider-range" style={{ left: `${pct(range[0])}%`, width: `${pct(range[1]) - pct(range[0])}%` }} />}
        <div className="slider-fill" style={{ width: `${pct(value)}%` }} />
        {mean != null && <div className="slider-mean" style={{ left: `${pct(mean)}%` }} title={`Dataset average ${mean}`} />}
        <div className="slider-thumb" role="slider" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}
             style={{ left: `${pct(value)}%` }} onKeyDown={key}><i>{value.toFixed(decimals)}</i></div>
      </div>
      <div className="slider-scale"><span>{min}</span>{range && <span className="slider-legend"><b /> seen in training</span>}<span>{max}</span></div>
    </div>
  );
}
