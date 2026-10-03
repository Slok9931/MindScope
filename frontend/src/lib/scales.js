/** Tiny scale / tick helpers so charts need no external library. */
export const linear = (d0, d1, r0, r1) => {
  const f = (v) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);
  f.invert = (p) => d0 + ((p - r0) / (r1 - r0 || 1)) * (d1 - d0);
  return f;
};

export function niceTicks(min, max, count = 5) {
  const span = max - min || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const err = raw / mag;
  const step = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * mag;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const out = [];
  for (let v = start; v <= end + step / 2; v += step) out.push(+v.toFixed(10));
  return out;
}

export const num = (v, d = 2) => (v == null ? "–" : Number(v).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: 0 }));
export const fixed = (v, d = 2) => (v == null ? "–" : Number(v).toFixed(d));
export const extent = (arr) => arr.reduce(([lo, hi], v) => [Math.min(lo, v), Math.max(hi, v)], [Infinity, -Infinity]);

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a, b, t) => {
  const [r1, g1, b1] = hex(a), [r2, g2, b2] = hex(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
};
/** -1..1 -> rose / neutral / cyan */
export const diverging = (v) => (v < 0 ? mix("#1a2036", "#e5707a", Math.min(1, -v)) : mix("#1a2036", "#5b7cfa", Math.min(1, v)));
/** 0..1 -> deep indigo to violet to cyan */
export const sequential = (t) => mix("#1a2036", "#6e8bff", t);
