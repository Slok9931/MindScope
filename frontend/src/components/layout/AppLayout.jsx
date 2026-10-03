import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { api } from "@/api/client";
import "./layout.css";

const NAV = [
  { to: "/predict", label: "Prediction Lab", hint: "Test the model live", icon: "spark" },
  { to: "/analysis", label: "Data Analysis", hint: "Explore the dataset", icon: "chart" },
  { to: "/models", label: "Models", hint: "Compare & training steps", icon: "layers" },
  { to: "/docs", label: "Documentation", hint: "Code & reasoning", icon: "book" },
];

function ApiStatus() {
  const [ok, setOk] = useState(null);
  useEffect(() => { api.health().then(setOk).catch(() => setOk(false)); }, []);
  return (
    <div className={`api-status ${ok === null ? "" : ok ? "up" : "down"}`}>
      <i /> <span>{ok === null ? "Checking API…" : ok ? "API online" : "API offline"}</span>
    </div>
  );
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }); }, [pathname]);

  return (
    <div className="shell">
      <header className="topbar">
        <Brand />
        <button className="burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle navigation"><Icon name={open ? "x" : "menu"} size={22} /></button>
      </header>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <Brand />
        <nav>
          <span className="nav-title">Explore</span>
          {NAV.map((n, i) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
              <span className="nav-ico"><Icon name={n.icon} size={19} /></span>
              <span className="nav-text"><b>{n.label}</b><small>{n.hint}</small></span>
              <em>0{i + 1}</em>
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="side-card">
            <Icon name="heart" size={16} />
            <p>Educational analytics only — predictions are statistical estimates, not a medical diagnosis.</p>
          </div>
          <ApiStatus />
        </div>
      </aside>
      <main className="content"><Outlet /></main>
    </div>
  );
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark"><svg viewBox="0 0 32 32" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M16 5c-4 0-7 3-7 6.500 0 1.200.3 2 .9 3C8.700 15.400 8 16.700 8 18c0 2.500 2 4.500 4.500 4.500.4 1.500 1.800 2.500 3.500 2.500s3.100-1 3.500-2.500C21.500 22.500 24 20.500 24 18c0-1.300-.7-2.600-1.900-3.500.6-1 .9-1.800.9-3C23 8 20 5 16 5Z" /><path d="M16 9v14M12 13h4m0 4h4" /></svg></div>
      <div><b>Mind<span className="grad-text">Scope</span></b><small>Student wellbeing ML</small></div>
    </div>
  );
}
