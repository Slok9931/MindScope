import { useId } from "react";
import { fixed, linear, niceTicks } from "@/lib/scales";
import { PALETTE } from "@/lib/theme";
import ChartShell, { Tip } from "./ChartShell";

/** Horizontal bars. data: [{label, value, color?, sub?: [[k,v]]}] */
export default function BarChart({ data, format = (v) => fixed(v, 2), color, max, rowH = 32, valueLabel = true, tipTitle, domainMin = 0 }) {
  const id = useId().replace(/:/g, "");
  const height = data.length * rowH + 28;
  return (
    <ChartShell height={height}>
      {({ width, height: h, show, hide }) => {
        const left = Math.min(150, Math.max(70, Math.max(...data.map((d) => d.label.length)) * 6.6 + 10));
        const m = { l: left, r: valueLabel ? 56 : 16, t: 4, b: 22 };
        const hi = max ?? Math.max(...data.map((d) => d.value)) * 1.02;
        const x = linear(domainMin, hi, m.l, width - m.r);
        const ticks = niceTicks(domainMin, hi, 4).filter((t) => t <= hi * 1.001);
        return (
          <svg width={width} height={h}>
            <defs>
              {data.map((d, i) => {
                const c = d.color ?? color ?? PALETTE[i % PALETTE.length];
                return <linearGradient key={i} id={`${id}${i}`} x1="0" x2="1"><stop offset="0" stopColor={c} stopOpacity=".55" /><stop offset="1" stopColor={c} /></linearGradient>;
              })}
            </defs>
            <g className="axes">
              {ticks.map((t) => (
                <g key={t}><line x1={x(t)} x2={x(t)} y1={m.t} y2={h - m.b} className="grid-line" /><text x={x(t)} y={h - 6} textAnchor="middle">{format(t)}</text></g>
              ))}
            </g>
            {data.map((d, i) => {
              const y = m.t + i * rowH;
              const bw = Math.max(2, x(d.value) - m.l);
              return (
                <g key={d.label} onMouseMove={(e) => show(e, <Tip title={tipTitle ? tipTitle(d) : d.label} rows={[["Value", format(d.value), d.color ?? color ?? PALETTE[i % PALETTE.length]], ...(d.sub ?? [])]} />)} onMouseLeave={hide} className="bar-row">
                  <rect x={0} y={y} width={width} height={rowH} fill="transparent" />
                  <text x={m.l - 10} y={y + rowH / 2} dy="0.32em" textAnchor="end" className="cat-label">{d.label}</text>
                  <rect className="bar-x" x={m.l} y={y + 5} width={bw} height={rowH - 10} rx={6} fill={d.color ?? color ?? PALETTE[i % PALETTE.length]} fillOpacity=".9" style={{ animationDelay: `${i * 40}ms` }} />
                  {valueLabel && <text x={m.l + bw + 8} y={y + rowH / 2} dy="0.32em" className="val-label">{d.text ?? format(d.value)}</text>}
                </g>
              );
            })}
          </svg>
        );
      }}
    </ChartShell>
  );
}
