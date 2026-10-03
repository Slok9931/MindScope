import { useEffect, useState } from "react";
import Icon from "./Icon";
import "./ui.css";

function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, t0;
    const tick = (t) => {
      t0 ??= t;
      const p = Math.min(1, (t - t0) / ms);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export default function Stat({ label, value, decimals = 0, suffix = "", sub, icon, color = "#7c6cff" }) {
  const v = useCountUp(Number(value));
  return (
    <div className="stat" style={{ "--sc": color }}>
      <div className="stat-icon">{icon && <Icon name={icon} size={18} />}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
