import { useMemo, useState } from "react";
import "./ui.css";

/** columns: [{key,label,align,render(row),sortable,mono}] */
export default function DataTable({ columns, rows, initialSort }) {
  const [sort, setSort] = useState(initialSort ?? null);
  const data = useMemo(() => {
    if (!sort) return rows;
    const s = [...rows].sort((a, b) => (a[sort.key] > b[sort.key] ? 1 : a[sort.key] < b[sort.key] ? -1 : 0));
    return sort.dir === "desc" ? s.reverse() : s;
  }, [rows, sort]);
  const toggle = (c) => c.sortable !== false && setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "desc" }));
  return (
    <div className="table-wrap">
      <table className="dtable">
        <thead>
          <tr>{columns.map((c) => (
            <th key={c.key} style={{ textAlign: c.align ?? "left" }} onClick={() => toggle(c)} className={c.sortable === false ? "" : "sortable"}>
              {c.label}{sort?.key === c.key && <em>{sort.dir === "asc" ? " ▲" : " ▼"}</em>}
            </th>))}</tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={r.id ?? i}>{columns.map((c) => (
              <td key={c.key} className={c.mono ? "mono" : ""} style={{ textAlign: c.align ?? "left" }}>{c.render ? c.render(r) : r[c.key]}</td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
