import { linear, niceTicks, fixed } from "@/lib/scales";
import { PALETTE } from "@/lib/theme";
import ChartShell, { Axes, Tip } from "./ChartShell";

/** items: [{label,min,q1,median,q3,max,mean,n,outliers}] */
export default function BoxPlot({ items, colors = {}, height = 300, yLabel = "Mental health score" }) {
  return (
    <ChartShell height={height}>
      {({ width, height: h, show, hide }) => {
        const m = { l: 50, r: 14, t: 14, b: 40 };
        const all = items.flatMap((d) => [d.min, d.max, ...d.outliers]);
        const yt = niceTicks(Math.min(...all), Math.max(...all), 5);
        const y = linear(yt[0], yt.at(-1), h - m.b, m.t);
        const band = (width - m.l - m.r) / items.length;
        return (
          <svg width={width} height={h}>
            <Axes w={width} h={h} m={m} x={() => 0} y={y} yt={yt} yl={yLabel} yf={(v) => fixed(v, 0)} />
            {items.map((d, i) => {
              const c = colors[d.label] ?? PALETTE[i % PALETTE.length];
              const cx = m.l + band * (i + 0.5);
              const bw = Math.min(70, band * 0.5);
              return (
                <g key={d.label} className="box" style={{ animationDelay: `${i * 90}ms` }}
                   onMouseMove={(e) => show(e, <Tip title={d.label} rows={[["n", d.n], ["Max", fixed(d.max, 2)], ["Q3", fixed(d.q3, 2)], ["Median", fixed(d.median, 2), c], ["Mean", fixed(d.mean, 2)], ["Q1", fixed(d.q1, 2)], ["Min", fixed(d.min, 2)]]} />)} onMouseLeave={hide}>
                  <rect x={cx - band / 2} y={m.t} width={band} height={h - m.t - m.b} fill="transparent" />
                  <line x1={cx} x2={cx} y1={y(d.max)} y2={y(d.min)} stroke={c} strokeWidth="2" />
                  <line x1={cx - bw / 4} x2={cx + bw / 4} y1={y(d.max)} y2={y(d.max)} stroke={c} strokeWidth="2" />
                  <line x1={cx - bw / 4} x2={cx + bw / 4} y1={y(d.min)} y2={y(d.min)} stroke={c} strokeWidth="2" />
                  <rect x={cx - bw / 2} y={y(d.q3)} width={bw} height={Math.max(2, y(d.q1) - y(d.q3))} rx={7} fill={c} fillOpacity=".28" stroke={c} strokeWidth="2" />
                  <line x1={cx - bw / 2} x2={cx + bw / 2} y1={y(d.median)} y2={y(d.median)} stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                  <circle cx={cx} cy={y(d.mean)} r="4" fill="#0b1022" stroke="#fff" strokeWidth="1.8" />
                  {d.outliers.map((o, k) => <circle key={k} cx={cx + ((k % 5) - 2) * 3} cy={y(o)} r="2.6" fill={c} fillOpacity=".7" />)}
                  <text x={cx} y={h - 14} textAnchor="middle" className="cat-label" fontWeight="650">{d.label}</text>
                </g>
              );
            })}
          </svg>
        );
      }}
    </ChartShell>
  );
}
