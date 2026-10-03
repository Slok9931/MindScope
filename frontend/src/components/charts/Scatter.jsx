import { extent, fixed, linear, niceTicks } from "@/lib/scales";
import ChartShell, { Axes, Tip } from "./ChartShell";

function regression(pts) {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  pts.forEach(([a, b]) => { sxy += (a - mx) * (b - my); sxx += (a - mx) ** 2; syy += (b - my) ** 2; });
  const slope = sxy / (sxx || 1);
  return { slope, intercept: my - slope * mx, r: sxy / Math.sqrt(sxx * syy || 1) };
}

/** points: [[x,y]]. trend draws OLS line + r; identity draws y=x (for actual-vs-predicted). */
export default function Scatter({ points, xLabel, yLabel, color = "#7c6cff", height = 300, trend = true, identity = false, dot = 3.2 }) {
  const reg = trend ? regression(points) : null;
  return (
    <ChartShell height={height}>
      {({ width, height: h, show, hide }) => {
        const m = { l: 52, r: 16, t: 14, b: 44 };
        const [x0, x1] = extent(points.map((p) => p[0]));
        const [y0, y1] = extent(points.map((p) => p[1]));
        const lo = identity ? Math.min(x0, y0) : null, hi = identity ? Math.max(x1, y1) : null;
        const xt = niceTicks(identity ? lo : x0, identity ? hi : x1, Math.max(3, Math.floor(width / 90)));
        const yt = niceTicks(identity ? lo : y0, identity ? hi : y1, 5);
        const x = linear(xt[0], xt.at(-1), m.l, width - m.r);
        const y = linear(yt[0], yt.at(-1), h - m.b, m.t);
        return (
          <svg width={width} height={h}>
            <Axes w={width} h={h} m={m} x={x} y={y} xt={xt} yt={yt} xl={xLabel} yl={yLabel} xf={(v) => fixed(v, 1).replace(/\.0$/, "")} yf={(v) => fixed(v, 1).replace(/\.0$/, "")} />
            {identity && <line x1={x(xt[0])} y1={y(xt[0])} x2={x(xt.at(-1))} y2={y(xt.at(-1))} stroke="#fff" strokeOpacity=".5" strokeDasharray="6 5" />}
            <g className="dots">
              {points.map((p, i) => (
                <circle key={i} cx={x(p[0])} cy={y(p[1])} r={dot} fill={color} fillOpacity=".5" className="dot"
                        onMouseMove={(e) => show(e, <Tip rows={[[xLabel ?? "x", fixed(p[0], 2), color], [yLabel ?? "y", fixed(p[1], 2)]]} />)} onMouseLeave={hide} />
              ))}
            </g>
            {reg && !identity && (
              <g style={{ pointerEvents: "none" }}>
                <line x1={x(xt[0])} x2={x(xt.at(-1))} y1={y(reg.slope * xt[0] + reg.intercept)} y2={y(reg.slope * xt.at(-1) + reg.intercept)} stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                <g transform={`translate(${width - m.r - 8} ${m.t + 14})`}><text textAnchor="end" fontSize="12" fontWeight="700" fill="#fff">r = {fixed(reg.r, 2)}</text></g>
              </g>
            )}
          </svg>
        );
      }}
    </ChartShell>
  );
}
