import { useEffect, useMemo, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import Icon from "./Icon";
import "./ui.css";

/** Fully custom dropdown: keyboard navigation, type-to-filter, scroll-into-view, ARIA listbox. */
export default function Select({ label, value, onChange, options, placeholder = "Select…", searchable = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const list = useRef(null);
  const search = useRef(null);
  useClickOutside(root, () => setOpen(false), open);

  const items = useMemo(() => options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)), [options]);
  const shown = useMemo(() => items.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase())), [items, query]);
  const current = items.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(Math.max(0, items.findIndex((o) => o.value === value)));
    if (searchable) setTimeout(() => search.current?.focus(), 30);
  }, [open]); // eslint-disable-line

  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => {
    if (open) list.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const pick = (o) => { onChange(o.value); setOpen(false); root.current?.querySelector(".select-trigger")?.focus(); };
  const onKey = (e) => {
    if (!open) { if (["ArrowDown", "Enter", " "].includes(e.key)) { e.preventDefault(); setOpen(true); } return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(shown.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); shown[active] && pick(shown[active]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="field" ref={root} onKeyDown={onKey}>
      {label && <span className="field-label">{label}</span>}
      <button type="button" className={`select-trigger ${open ? "is-open" : ""}`} onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}>
        <span className={current ? "" : "placeholder"}>{current?.label ?? placeholder}</span>
        <Icon name="chevron" size={16} className="select-chevron" />
      </button>
      {open && (
        <div className="select-pop">
          {searchable && (
            <div className="select-search">
              <Icon name="search" size={15} />
              <input ref={search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to filter…" aria-label="Filter options" />
              <small>{shown.length}</small>
            </div>
          )}
          <ul ref={list} role="listbox" className="select-list">
            {shown.length === 0 && <li className="select-empty">No matches</li>}
            {shown.map((o, i) => (
              <li key={o.value} data-i={i} role="option" aria-selected={o.value === value}
                  className={`select-opt ${i === active ? "is-active" : ""} ${o.value === value ? "is-selected" : ""}`}
                  onPointerEnter={() => setActive(i)} onClick={() => pick(o)}>
                <span>{o.label}</span>
                {o.value === value && <Icon name="check" size={15} />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
