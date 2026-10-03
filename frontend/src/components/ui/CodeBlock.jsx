import { useState } from "react";
import Icon from "./Icon";
import "./ui.css";

const KEYWORDS = new Set(("import from as def return for in if else elif class with not and or is lambda try except finally raise yield pass None True False print " +
  "const let var function export default await async new this typeof null undefined true false").split(" "));
const TOKEN = /(#.*$|\/\/.*$)|("""[\s\S]*?"""|'[^'\n]*'|"[^"\n]*"|`[^`]*`)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)|(\s+|[^\sA-Za-z_\d])/gm;

/** Dependency-free tokenizer: good enough for Python / JS / shell snippets. */
function highlight(code) {
  const out = [];
  let m, k = 0;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(code))) {
    const [t, com, str, numb, word] = m;
    let cls = null;
    if (com) cls = "t-com"; else if (str) cls = "t-str"; else if (numb) cls = "t-num";
    else if (word) {
      if (KEYWORDS.has(word)) cls = "t-kw";
      else if (code[TOKEN.lastIndex] === "(") cls = "t-fn";
      else if (/^[A-Z]/.test(word)) cls = "t-cls";
    }
    out.push(cls ? <span key={k++} className={cls}>{t}</span> : t);
  }
  return out;
}

export default function CodeBlock({ code, lang = "python", title }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard unavailable */ }
  };
  const lines = code.replace(/\n$/, "").split("\n").length;
  return (
    <figure className="code">
      <figcaption>
        <span className="code-dots"><i /><i /><i /></span>
        <span className="code-title">{title ?? lang}</span>
        <button type="button" onClick={copy} className={copied ? "is-copied" : ""}>
          <Icon name={copied ? "check" : "copy"} size={14} /> {copied ? "Copied" : "Copy"}
        </button>
      </figcaption>
      <pre><code>{highlight(code.replace(/\n$/, ""))}</code>{lines > 1 && <span className="code-lines">{lines} lines</span>}</pre>
    </figure>
  );
}
