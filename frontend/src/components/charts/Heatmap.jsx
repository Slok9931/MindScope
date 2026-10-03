import { diverging, sequential, fixed } from "@/lib/scales";
import ChartShell, { Tip } from "./ChartShell";

/** values[row][col]; mode 'diverging' (-1..1) or 'sequential' (min..max). null cells render as hatched "no data". */
export default function Heatmap({ rows, cols, values, mode = "diverging", cell = 50, fmt = (v) => fixed(v, 2), rowTitle, colTitle, tipLabel = "Value" }) {
  const flat = values.flat().filter((v) => v != null);
  const [lo, hi] = [Math.min(...flat), Math.max(...flat)];
  const color = (v) => (mode === "diverging" ? diverging(v) : sequential((v - lo) / (hi - lo || 1)));
  const longest = Math.max(...rows.map((r) => r.length));
  const left = Math.min(140, longest * 6.6 + 18) + (rowTitle ? 14 : 0);
  const top = mode === "diverging" ? 78 : 40;
  const height = top + rows.length * cell + 26 + (colTitle ? 16 : 0);
  return (
    <ChartShell height={height}>
      {({ width, height: h, show, hide }) => {
        const cw = Math.min(cell * 1.6, (width - left - 6) / cols.length);
        return (
          <svg width={width} height={h}>
            {cols.map((c, j) => mode === "diverging"
              ? <text key={c} className="cat-label" transform={`translate(${left + cw * (j + 0.5) + 4} ${top - 8}) rotate(-38)`} textAnchor="start">{c}</text>
              : <text key={c} className="cat-label" x={left + cw * (j + 0.5)} y={top - 10} textAnchor="middle" fontSize="10.5">{c}</text>)}
            {colTitle && <text className="axis-title" x={left + (cw * cols.length) / 2} y={mode === "diverging" ? 12 : 12} textAnchor="middle">{colTitle}</text>}
            {rowTitle && <text className="axis-title" transform={`translate(12 ${top + (rows.length * cell) / 2}) rotate(-90)`} textAnchor="middle">{rowTitle}</text>}
            {rows.map((r, i) => (
              <g key={r}>
                <text className="cat-label" x={left - 10} y={top + cell * (i + 0.5)} dy="0.32em" textAnchor="end">{r}</text>
                {cols.map((c, j) => {
                  const v = values[i][j];
                  return (
                    <g key={c} className="hm-cell" style={{ animationDelay: `${(i + j) * 22}ms` }} onMouseMove={(e) => v != null && show(e, <Tip title={`${r} × ${c}`} rows={[[tipLabel, fmt(v), color(v)]]} />)} onMouseLeave={hide}>
                      <rect x={left + cw * j + 2} y={top + cell * i + 2} width={cw - 4} height={cell - 4} rx={9} fill={v == null ? "rgba(255,255,255,.03)" : color(v)} stroke={v == null ? "rgba(255,255,255,.1)" : "none"} strokeDasharray={v == null ? "3 3" : undefined} />
                      {v != null && cw > 36 && <text x={left + cw * (j + 0.5)} y={top + cell * (i + 0.5)} dy="0.34em" textAnchor="middle" fontSize="11.5" fontWeight="700" fill={mode === "diverging" && Math.abs(v) < 0.35 ? "#aeb7d6" : "#fff"} style={{ pointerEvents: "none" }}>{fmt(v)}</text>}
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>
        );
      }}
    </ChartShell>
  );
}
