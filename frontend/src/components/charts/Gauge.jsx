import { useId } from "react";

/** Half-circle gauge, value 0..max, animated via stroke-dashoffset. */
export default function Gauge({ value, low, high, max = 10, color = "#22d3ee", label }) {
  const id = useId().replace(/:/g, "");
  const R = 96, cx = 120, cy = 120, len = Math.PI * R;
  const pt = (v, rad = R) => { const a = Math.PI + (v / max) * Math.PI; return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]; };
  const arc = `M${cx - R},${cy}A${R},${R} 0 0 1 ${cx + R},${cy}`;
  const [nx, ny] = pt(value, R - 26);
  const [l0x, l0y] = pt(low, R + 14), [l1x, l1y] = pt(high, R + 14);
  return (
    <svg viewBox="0 -6 240 156" className="gauge" role="img" aria-label={`Predicted score ${value} out of ${max}`}>
      <defs><linearGradient id={id} x1="0" x2="1"><stop offset="0" stopColor="#fb7185" /><stop offset=".5" stopColor="#fbbf24" /><stop offset="1" stopColor="#34d399" /></linearGradient></defs>
      <path d={arc} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="18" strokeLinecap="round" />
      <path d={arc} fill="none" stroke={color} strokeWidth="18" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - value / max)} className="gauge-arc" />
      <path d={`M${l0x},${l0y}A${R + 14},${R + 14} 0 0 1 ${l1x},${l1y}`} fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="3" strokeLinecap="round" />
      <circle cx={nx} cy={ny} r="5" fill="#fff" style={{ transition: "all .7s cubic-bezier(.22,1,.36,1)" }} />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="40" fontWeight="800" fill="#fff">{value.toFixed(2)}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="12" fill={color} fontWeight="700">{label}</text>
      <text x={cx - R} y={cy + 20} textAnchor="middle" fontSize="10" fill="#626d90">0</text>
      <text x={cx + R} y={cy + 20} textAnchor="middle" fontSize="10" fill="#626d90">{max}</text>
    </svg>
  );
}
