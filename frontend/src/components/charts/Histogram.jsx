import { useId } from "react";
import { linear, niceTicks, fixed } from "@/lib/scales";
import ChartShell, { Axes, Tip } from "./ChartShell";

/** hist: {edges, counts, mean?, median?}. Optional reference lines. */
export default function Histogram({ hist, color = "#7c6cff", height = 260, xLabel, yLabel = "Students", markers = [] }) {
  const id = useId().replace(/:/g, "");
  return (
    <ChartShell height={height}>
      {({ width, height: h, show, hide }) => {
        const m = { l: 46, r: 14, t: 16, b: 38 };
        const { edges, counts } = hist;
        const x = linear(edges[0], edges.at(-1), m.l, width - m.r);
        const yt = niceTicks(0, Math.max(...counts), 4);
        const y = linear(0, yt.at(-1), h - m.b, m.t);
        const xt = niceTicks(edges[0], edges.at(-1), Math.max(3, Math.floor(width / 80))).filter((t) => t >= edges[0] - 1e-6 && t <= edges.at(-1) + 1e-6);
        return (
          <svg width={width} height={h}>
            <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} /><stop offset="1" stopColor={color} stopOpacity=".25" /></linearGradient></defs>
            <Axes w={width} h={h} m={m} x={x} y={y} xt={xt} yt={yt} xl={xLabel} yl={yLabel} xf={(v) => fixed(v, 1).replace(/\.0$/, "")} />
            {counts.map((c, i) => (
              <rect key={i} className="bar-y" x={x(edges[i]) + 1} y={y(c)} width={Math.max(1, x(edges[i + 1]) - x(edges[i]) - 2)} height={h - m.b - y(c)} rx={3} fill={color} fillOpacity=".85"
                    style={{ animationDelay: `${i * 18}ms` }}
                    onMouseMove={(e) => show(e, <Tip title={`${fixed(edges[i], 2)} – ${fixed(edges[i + 1], 2)}`} rows={[["Students", c, color]]} />)} onMouseLeave={hide} />
            ))}
            {markers.map((mk) => mk.value != null && (
              <g key={mk.label}>
                <line x1={x(mk.value)} x2={x(mk.value)} y1={m.t - 4} y2={h - m.b} stroke={mk.color} strokeDasharray="5 4" strokeWidth="1.6" />
                <text x={x(mk.value) + 5} y={m.t + 6} fill={mk.color} fontSize="11" fontWeight="700">{mk.label} {fixed(mk.value, 2)}</text>
              </g>
            ))}
          </svg>
        );
      }}
    </ChartShell>
  );
}
