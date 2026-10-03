import { useCallback, useLayoutEffect, useRef, useState } from "react";
import "./charts.css";

/** Responsive SVG host. Children is a render-prop receiving {width,height,show,hide}. Tooltip lives in HTML above the SVG. */
export default function ChartShell({ height = 280, children }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  const [tip, setTip] = useState(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const show = useCallback((e, content) => {
    const r = ref.current.getBoundingClientRect();
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top, content });
  }, []);
  const hide = useCallback(() => setTip(null), []);

  return (
    <div ref={ref} className="chart" style={{ height }}>
      {width > 0 && children({ width, height, show, hide })}
      {tip && <div className={`chart-tip ${tip.x > width * 0.6 ? "flip" : ""}`} style={{ left: tip.x, top: tip.y }}>{tip.content}</div>}
    </div>
  );
}

/** Grid lines + tick labels shared by cartesian charts. */
export function Axes({ w, h, m, x, y, xt, yt, xl, yl, xf = String, yf = String, xBand = false }) {
  return (
    <g className="axes">
      {yt?.map((t) => (
        <g key={`y${t}`}>
          <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} className="grid-line" />
          <text x={m.l - 9} y={y(t)} dy="0.32em" textAnchor="end">{yf(t)}</text>
        </g>
      ))}
      {xt?.map((t) => (
        <text key={`x${t}`} x={x(t)} y={h - m.b + 18} textAnchor="middle">{xf(t)}</text>
      ))}
      {xl && <text className="axis-title" x={(m.l + w - m.r) / 2} y={h - 4} textAnchor="middle">{xl}</text>}
      {yl && <text className="axis-title" transform={`translate(13 ${(m.t + h - m.b) / 2}) rotate(-90)`} textAnchor="middle">{yl}</text>}
    </g>
  );
}

export const Tip = ({ title, rows = [] }) => (
  <>
    {title && <b>{title}</b>}
    {rows.map(([k, v, c], i) => (
      <div key={i} className="tip-row">{c && <i style={{ background: c }} />}<span>{k}</span><strong>{v}</strong></div>
    ))}
  </>
);
