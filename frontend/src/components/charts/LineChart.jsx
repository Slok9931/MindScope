import { useId, useState } from "react";
import { extent, fixed, linear, niceTicks } from "@/lib/scales";
import ChartShell, { Axes, Tip } from "./ChartShell";

/** series: [{name,color,points:[[x,y]], dashed?}]. marker draws a vertical "you are here" line. */
export default function LineChart({ series, xLabel, yLabel, height = 260, marker, yDomain, area = false, xFmt = (v) => fixed(v, 1).replace(/\.0$/, ""), yFmt = (v) => fixed(v, 1).replace(/\.0$/, ""), compact = false }) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState(null);
  return (
    <ChartShell height={height}>
      {({ width, height: h, show, hide }) => {
        const m = { l: compact ? 40 : 52, r: 16, t: 14, b: compact ? 34 : 44 };
        const all = series.flatMap((s) => s.points);
        const [x0, x1] = extent(all.map((p) => p[0]));
        const [y0, y1] = yDomain ?? extent(all.map((p) => p[1]));
        const pad = (y1 - y0) * 0.1 || 0.5;
        const xt = niceTicks(x0, x1, Math.max(3, Math.floor(width / 85))).filter((t) => t >= x0 - 1e-9 && t <= x1 + 1e-9);
        const yt = niceTicks(y0 - pad, y1 + pad, compact ? 3 : 5);
        const x = linear(x0, x1, m.l, width - m.r);
        const y = linear(yt[0], yt.at(-1), h - m.b, m.t);
        const path = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");
        const onMove = (e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const xv = x.invert(e.clientX - r.left + m.l);
          const ref = series[0].points;
          const idx = ref.reduce((b, p, i) => (Math.abs(p[0] - xv) < Math.abs(ref[b][0] - xv) ? i : b), 0);
          setHover(ref[idx][0]);
          show(e, <Tip title={`${xLabel ?? "x"}: ${xFmt(ref[idx][0])}`} rows={series.map((s) => [s.name ?? yLabel ?? "y", yFmt(s.points[idx]?.[1] ?? NaN), s.color])} />);
        };
        return (
          <svg width={width} height={h}>
            <defs>{series.map((s, i) => <linearGradient key={i} id={`${id}${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={s.color} stopOpacity=".35" /><stop offset="1" stopColor={s.color} stopOpacity="0" /></linearGradient>)}</defs>
            <Axes w={width} h={h} m={m} x={x} y={y} xt={xt} yt={yt} xl={compact ? null : xLabel} yl={compact ? null : yLabel} xf={xFmt} yf={yFmt} />
            {marker != null && marker >= x0 && marker <= x1 && (
              <g><line x1={x(marker)} x2={x(marker)} y1={m.t} y2={h - m.b} stroke="#fbbf24" strokeDasharray="4 4" strokeWidth="1.6" /><text x={x(marker)} y={m.t - 3} textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="700">you</text></g>
            )}
            {series.map((s, i) => (
              <g key={i}>
                {area && <path d={`${path(s.points)}L${x(s.points.at(-1)[0])},${h - m.b}L${x(s.points[0][0])},${h - m.b}Z`} fill={s.color} fillOpacity=".08" className="fade-in" />}
                <path d={path(s.points)} fill="none" stroke={s.color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.dashed ? "6 5" : undefined} className="line-draw" pathLength="1" />
                {s.points.length <= 14 && s.points.map((p, k) => <circle key={k} cx={x(p[0])} cy={y(p[1])} r="3.4" fill="#0b1022" stroke={s.color} strokeWidth="2" />)}
              </g>
            ))}
            {hover != null && <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={h - m.b} stroke="#fff" strokeOpacity=".3" style={{ pointerEvents: "none" }} />}
            <rect x={m.l} y={m.t} width={width - m.l - m.r} height={h - m.t - m.b} fill="transparent" onMouseMove={onMove} onMouseLeave={() => { setHover(null); hide(); }} />
          </svg>
        );
      }}
    </ChartShell>
  );
}
