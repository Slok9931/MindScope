import { useState } from "react";
import { PALETTE } from "@/lib/theme";
import ChartShell, { Tip } from "./ChartShell";

/** data: [{label,value,color?}] */
export default function Donut({ data, height = 220, centerLabel = "Total", format = (v) => v.toLocaleString() }) {
  const [on, setOn] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  return (
    <div className="donut-wrap">
      <ChartShell height={height}>
        {({ width, height: h, show, hide }) => {
          const R = Math.min(width, h) / 2 - 8, r = R * 0.66, cx = width / 2, cy = h / 2;
          const arc = (a0, a1, rad) => [Math.cos(a0) * rad + cx, Math.sin(a0) * rad + cy, Math.cos(a1) * rad + cx, Math.sin(a1) * rad + cy];
          return (
            <svg width={width} height={h}>
              {data.map((d, i) => {
                const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2;
                acc += d.value;
                const a1 = (acc / total) * Math.PI * 2 - Math.PI / 2 - (data.length > 1 ? 0.03 : 0);
                const [x0, y0, x1, y1] = arc(a0, a1, R), [x2, y2, x3, y3] = arc(a1, a0, r);
                const big = a1 - a0 > Math.PI ? 1 : 0;
                const c = d.color ?? PALETTE[i % PALETTE.length];
                return (
                  <path key={d.label} className="donut-seg" style={{ opacity: on == null || on === i ? 1 : 0.35, animationDelay: `${i * 90}ms` }}
                        d={`M${x0},${y0}A${R},${R} 0 ${big} 1 ${x1},${y1}L${x2},${y2}A${r},${r} 0 ${big} 0 ${x3},${y3}Z`} fill={c}
                        onMouseEnter={() => setOn(i)} onMouseMove={(e) => show(e, <Tip title={d.label} rows={[["Count", format(d.value), c], ["Share", `${((d.value / total) * 100).toFixed(1)}%`]]} />)} onMouseLeave={() => { setOn(null); hide(); }} />
                );
              })}
              <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">{format(on == null ? total : data[on].value)}</text>
              <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="#98a2c3">{on == null ? centerLabel : data[on].label}</text>
            </svg>
          );
        }}
      </ChartShell>
      <ul className="legend">{data.map((d, i) => <li key={d.label} onMouseEnter={() => setOn(i)} onMouseLeave={() => setOn(null)}><i style={{ background: d.color ?? PALETTE[i % PALETTE.length] }} />{d.label}</li>)}</ul>
    </div>
  );
}
