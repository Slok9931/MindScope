import { Fragment, useEffect, useState } from "react";
import CodeBlock from "@/components/ui/CodeBlock";
import { Badge, Callout } from "@/components/ui/Feedback";
import Icon from "@/components/ui/Icon";
import { GROUPS, SECTIONS } from "@/content/docs";
import "./docs.css";

/** Minimal inline markup: **bold**, *italic*, `code`. */
function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((p, i) => {
    if (p.startsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`")) return <code key={i} className="inline-code">{p.slice(1, -1)}</code>;
    if (p.startsWith("*") && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

function Block({ b }) {
  switch (b.t) {
    case "p": return <p className="doc-p"><Inline text={b.text} /></p>;
    case "code": return <CodeBlock title={b.title} lang={b.lang} code={b.src} />;
    case "list": return <ul className="doc-list">{b.items.map((i) => <li key={i}><Inline text={i} /></li>)}</ul>;
    case "table": return (
      <div className="table-wrap doc-table"><table className="dtable"><thead><tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ whiteSpace: "normal" }}><Inline text={c} /></td>)}</tr>)}</tbody></table></div>
    );
    case "why": return <Callout tone="why" title={b.title}><Inline text={b.text} /></Callout>;
    default: return <Callout tone={b.t} title={b.title}><Inline text={b.text} /></Callout>;
  }
}

export default function DocsPage() {
  const [active, setActive] = useState(SECTIONS[0].id);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setActive(vis.target.id);
    }, { rootMargin: "-15% 0px -70% 0px" });
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); el && io.observe(el); });
    const onScroll = () => { const h = document.documentElement; setProgress(h.scrollTop / (h.scrollHeight - h.clientHeight || 1)); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);

  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const byId = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

  return (
    <div className="page docs-page">
      <div className="read-progress" style={{ transform: `scaleX(${progress})` }} />
      <div className="page-head">
        <span className="eyebrow">04 · Documentation</span>
        <h1>From raw CSV to <span className="grad-text">deployed model</span> — every step explained.</h1>
        <p>The real code from the notebook and the application, with the reasoning behind each decision. Blocks marked <b className="grad-text">Why</b> explain the choice.</p>
      </div>

      <div className="docs">
        <nav className="toc" aria-label="Table of contents">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <span className="toc-group">{g.title}</span>
              {g.ids.map((id) => (
                <button key={id} className={`toc-link ${active === id ? "is-active" : ""}`} onClick={() => go(id)}>{byId[id].title}</button>
              ))}
            </div>
          ))}
        </nav>

        <div className="doc-body">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="doc-section">
              <header>
                <Badge color={s.tag === "Application" ? "#8b96b3" : s.tag === "Start here" ? "#4cc38a" : "#6e8bff"}>{s.tag}</Badge>
                <h2>{s.title}</h2>
                <p className="doc-summary">{s.summary}</p>
              </header>
              {s.blocks.map((b, i) => <Block key={i} b={b} />)}
            </section>
          ))}
          <div className="doc-end"><Icon name="check" size={18} /> You've reached the end — head to the <a href="/predict">Prediction Lab</a> and try the model.</div>
        </div>
      </div>
    </div>
  );
}
