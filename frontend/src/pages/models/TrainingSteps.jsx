import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { Callout } from "@/components/ui/Feedback";

const BRANCHES = [
  { title: "Numeric ×6", items: ["Age, usage, unlocks,", "study, sleep, activity"], ops: ["Median imputer", "StandardScaler*"], c: "#8fa6ff" },
  { title: "Ordinal ×1", items: ["Stress_Level"], ops: ["Mode imputer", "OrdinalEncoder", "Low<Med<High<V.High"], c: "#8fa6ff" },
  { title: "Nominal ×5", items: ["Gender, Academic level,", "Platform, Purpose, Country"], ops: ["Mode imputer", "OneHotEncoder", "(unknown → all zeros)"], c: "#8fa6ff" },
];

export default function TrainingSteps({ data }) {
  return (
    <>
      <h2 className="section-title">Pipeline architecture <span>raw input in, score out — one object</span></h2>
      <Card>
        <div className="flow">
          <div className="flow-node src"><Icon name="database" size={20} /><b>Raw row</b><small>12 un-encoded columns</small></div>
          <div className="flow-arrow" />
          <div className="flow-col">
            <div className="flow-label">ColumnTransformer</div>
            {BRANCHES.map((b) => (
              <div key={b.title} className="flow-branch" style={{ "--bc": b.c }}>
                <b>{b.title}</b><small>{b.items.join(" ")}</small>
                <div>{b.ops.map((o) => <span key={o}>{o}</span>)}</div>
              </div>
            ))}
          </div>
          <div className="flow-arrow" />
          <div className="flow-node reg"><Icon name="cpu" size={20} /><b>Regressor</b><small>Extra Trees · 300 trees<br />max_features = 0.8</small></div>
          <div className="flow-arrow" />
          <div className="flow-node out"><Icon name="target" size={20} /><b>Score</b><small>0 – 10</small></div>
        </div>
        <p className="note-sm" style={{ marginTop: 14 }}>* StandardScaler is only used in the Linear Regression pipeline. Tree models skip scaling because splits depend on order, not magnitude.</p>
      </Card>

      <h2 className="section-title">Training timeline <span>{data.steps.length} steps, generated from the real run</span></h2>
      <ol className="timeline">
        {data.steps.map((s, i) => (
          <li key={s.title} style={{ animationDelay: `${i * 70}ms` }}>
            <div className="tl-dot"><Icon name={s.icon} size={18} /></div>
            <div className="tl-card">
              <span className="tl-num">Step {String(i + 1).padStart(2, "0")}</span>
              <h3>{s.title}</h3>
              <p>{s.detail}</p>
              <div className="tl-chips">{s.chips.map((c) => <code key={c}>{c}</code>)}</div>
            </div>
          </li>
        ))}
      </ol>
      <Callout tone="why" title="Why a single Pipeline?">
        Fitting imputers, scalers and encoders on the training split only — and bundling them with the model — prevents data leakage and guarantees that production inputs are transformed exactly as they were during training.
      </Callout>
    </>
  );
}
