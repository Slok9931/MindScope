import { api } from "@/api/client";
import { useAsync } from "@/hooks/useAsync";
import Card from "@/components/ui/Card";
import Stat from "@/components/ui/Stat";
import Tabs from "@/components/ui/Tabs";
import Icon from "@/components/ui/Icon";
import DataTable from "@/components/ui/DataTable";
import { Badge, ErrorState, Skeleton } from "@/components/ui/Feedback";
import BarChart from "@/components/charts/BarChart";
import Histogram from "@/components/charts/Histogram";
import Scatter from "@/components/charts/Scatter";
import { fixed } from "@/lib/scales";

export default function Explorer({ data, selected, onSelect }) {
  const order = ["linear_regression", "random_forest", "extra_trees"];
  const tabs = order.map((k) => ({ value: k, label: data.models[k].name, dot: data.models[k].accent }));
  const { data: m, error } = useAsync(() => api.model(selected), [selected]);

  return (
    <>
      <Tabs variant="pill" tabs={tabs} value={selected} onChange={onSelect} />
      <div className="tab-panel" key={selected} style={{ marginTop: 20 }}>
        {error ? <ErrorState error={error} /> : !m ? <Skeleton h={500} /> : <Detail m={m} best={data.meta.best_model === m.key} />}
      </div>
    </>
  );
}

function Detail({ m, best }) {
  const mt = m.metrics;
  const imp = m.importance.filter((i) => i.importance > 0.0005).slice(0, 10);
  const hp = Object.entries(m.hyperparameters);
  return (
    <>
      <div className="grid g2 detail-top">
        <Card glow={m.accent}>
          <div className="detail-head">
            <Badge color={m.accent}>{m.family}</Badge>{best && <Badge color="#6e8bff"><Icon name="trophy" size={12} /> Deployed model</Badge>}
          </div>
          <h2 className="detail-title">{m.name}</h2>
          <p className="detail-desc">{m.description}</p>
          <h4 className="mini-h">Hyper-parameters</h4>
          <div className="hp">{hp.map(([k, v]) => <span key={k}><em>{k}</em>{String(v)}</span>)}</div>
          <h4 className="mini-h">Preprocessing</h4>
          <ul className="steps-list">{m.preprocessing.map((p) => <li key={p}><Icon name="check" size={14} />{p}</li>)}</ul>
        </Card>
        <div className="grid g2 tiles">
          <Stat label="Test R²" value={mt.test_r2} decimals={4} icon="target" color={m.accent} sub="30% hold-out set" />
          <Stat label="Train R²" value={mt.train_r2} decimals={4} icon="database" color="#6e8bff" sub={`gap ${fixed(mt.train_r2 - mt.test_r2, 3)}`} />
          <Stat label="MAE" value={mt.mae} decimals={4} icon="chart" color="#6e8bff" sub="avg absolute error" />
          <Stat label="RMSE" value={mt.rmse} decimals={4} icon="bolt" color="#6e8bff" sub="root mean squared error" />
          <Stat label="CV mean R²" value={m.cv.mean} decimals={4} icon="repeat" color="#6e8bff" sub={`± ${fixed(m.cv.std, 4)} over 5 folds`} />
          <Stat label="Fit time" value={mt.fit_seconds} decimals={2} suffix=" s" icon="cpu" color="#6e8bff" sub="on 3,498 rows" />
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <Card title="Actual vs. predicted" subtitle="700 random test students · dashed line = perfect prediction">
          <Scatter points={m.actual_vs_predicted} identity xLabel="Actual score" yLabel="Predicted score" color={m.accent} height={320} />
        </Card>
        <Card title="Residual distribution" subtitle={`Actual − predicted · mean ${fixed(m.residual_stats.mean, 3)} · std ${fixed(m.residual_stats.std, 3)}`}>
          <Histogram hist={m.residual_hist} color={m.accent} xLabel="Residual (score points)" height={320} markers={[{ label: "zero", value: 0, color: "#fff" }]} />
        </Card>
        <Card title="Permutation importance" subtitle="Drop in test R² when a feature is shuffled (10 repeats)">
          <BarChart rowH={34} data={imp.map((i) => ({ label: i.label, value: i.importance, color: m.accent, sub: [["± std", fixed(i.std, 4)]] }))} format={(v) => fixed(v, 3)} />
        </Card>
        <Card title="Cross-validation folds" subtitle="R² on each of the 5 validation folds">
          <BarChart rowH={34} max={1} data={m.cv.folds.map((f, i) => ({ label: `Fold ${i + 1}`, value: f, color: m.accent }))} format={(v) => fixed(v, 4)} />
        </Card>
      </div>

      <div className="grid g2 proscons" style={{ marginTop: 18 }}>
        <Card title="Strengths"><ul className="pc good">{m.pros.map((p) => <li key={p}><Icon name="check" size={15} />{p}</li>)}</ul></Card>
        <Card title="Limitations"><ul className="pc bad">{m.cons.map((p) => <li key={p}><Icon name="alert" size={15} />{p}</li>)}</ul></Card>
      </div>

      <h2 className="section-title">Hardest students to predict <span>largest absolute errors on the test set</span></h2>
      <DataTable initialSort={{ key: "err", dir: "desc" }} rows={m.worst_predictions.map((w) => ({ ...w, err: Math.abs(w.error) }))} columns={[
        { key: "country", label: "Country" }, { key: "platform", label: "Platform" }, { key: "stress", label: "Stress" },
        { key: "usage", label: "Usage h", align: "right", mono: true }, { key: "sleep", label: "Sleep h", align: "right", mono: true },
        { key: "actual", label: "Actual", align: "right", mono: true, render: (r) => fixed(r.actual, 2) },
        { key: "predicted", label: "Predicted", align: "right", mono: true, render: (r) => fixed(r.predicted, 2) },
        { key: "err", label: "Abs. error", align: "right", mono: true, render: (r) => <b style={{ color: "#e5707a" }}>{fixed(r.err, 2)}</b> },
      ]} />
    </>
  );
}
