import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Icon from "@/components/ui/Icon";
import { Badge, Callout } from "@/components/ui/Feedback";
import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import { fixed } from "@/lib/scales";

export default function Comparison({ data, onOpen }) {
  const models = Object.values(data.models).sort((a, b) => b.metrics.test_r2 - a.metrics.test_r2);
  const best = models[0];
  const bar = (fn, extra = {}) => models.map((m) => ({ label: m.name, value: fn(m), color: m.accent, ...extra }));
  const rows = models.map((m) => ({
    id: m.key, name: m.name, train: m.metrics.train_r2, test: m.metrics.test_r2, gap: m.metrics.train_r2 - m.metrics.test_r2, mae: m.metrics.mae, rmse: m.metrics.rmse,
    cv: m.cv.mean, cvstd: m.cv.std, time: m.metrics.fit_seconds, top: m.top_feature, accent: m.accent,
  }));

  return (
    <>
      <div className="grid g3 leaderboard">
        {models.map((m, i) => (
          <button key={m.key} className="lb-card" style={{ "--mc": m.accent }} onClick={() => onOpen(m.key)}>
            <div className="lb-top">
              <span className="lb-rank">{i === 0 ? <Icon name="trophy" size={15} /> : `#${i + 1}`}</span>
              <Badge color={m.accent}>{m.family}</Badge>
            </div>
            <h2>{m.name}</h2>
            <p>{m.tagline}</p>
            <div className="lb-r2"><span>{fixed(m.metrics.test_r2, 3)}</span><small>test R²</small></div>
            <div className="lb-bar"><i style={{ width: `${m.metrics.test_r2 * 100}%` }} /></div>
            <div className="lb-meta"><span>MAE <b>{fixed(m.metrics.mae, 3)}</b></span><span>RMSE <b>{fixed(m.metrics.rmse, 3)}</b></span><span>CV <b>{fixed(m.cv.mean, 3)}</b></span></div>
            <span className="lb-go">Open details →</span>
          </button>
        ))}
      </div>

      <Callout tone="info" title={`${best.name} wins on every metric`}>
        It explains {fixed(best.metrics.test_r2 * 100, 1)}% of the variance on unseen students and its typical error is only ±{fixed(best.metrics.mae, 2)} points on a 10-point scale. Training R² of {fixed(best.metrics.train_r2, 2)} looks perfect, so the honest number is the test R² and the cross-validated score.
      </Callout>

      <h2 className="section-title">Metric comparison <span>same split, same features</span></h2>
      <div className="grid g2">
        <Card title="Test R² ↑" subtitle="Share of variance explained on the 30% hold-out set"><BarChart rowH={46} data={bar((m) => m.metrics.test_r2)} max={1} format={(v) => fixed(v, 3)} /></Card>
        <Card title="Mean absolute error ↓" subtitle="Average miss, in score points"><BarChart rowH={46} data={bar((m) => m.metrics.mae)} format={(v) => fixed(v, 3)} /></Card>
        <Card title="RMSE ↓" subtitle="Penalises large misses more than MAE"><BarChart rowH={46} data={bar((m) => m.metrics.rmse)} format={(v) => fixed(v, 3)} /></Card>
        <Card title="Generalisation gap ↓" subtitle="Training R² − test R² (bigger = more over-fitting)"><BarChart rowH={46} data={bar((m) => Math.max(0, m.metrics.train_r2 - m.metrics.test_r2))} format={(v) => fixed(v, 3)} /></Card>
      </div>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <Card title="5-fold cross-validation (R²)" subtitle="Each line is a model; points are individual folds">
          <LineChart xLabel="Fold" yLabel="R²" xFmt={(v) => `#${Math.round(v)}`} yFmt={(v) => fixed(v, 2)}
            series={models.map((m) => ({ name: m.name, color: m.accent, points: m.cv.folds.map((f, i) => [i + 1, f]) }))} height={280} />
        </Card>
        <Card title="Cross-validation summary" subtitle="Mean ± standard deviation across folds">
          <BarChart rowH={46} max={1} data={models.map((m) => ({ label: m.name, value: m.cv.mean, color: m.accent, text: `${fixed(m.cv.mean, 3)} ±${fixed(m.cv.std, 3)}`, sub: [["Std dev", fixed(m.cv.std, 4)]] }))} format={(v) => fixed(v, 2)} />
          <p className="note-sm">CV scores sit slightly below the test score because each fold trains on only 80% of the training rows. The small standard deviation shows the ranking is stable.</p>
        </Card>
      </div>

      <h2 className="section-title">Full results table <span>click a header to sort</span></h2>
      <DataTable initialSort={{ key: "test", dir: "desc" }} rows={rows} columns={[
        { key: "name", label: "Model", render: (r) => <span className="model-cell"><i style={{ background: r.accent }} />{r.name}</span> },
        { key: "train", label: "Train R²", align: "right", mono: true, render: (r) => fixed(r.train, 4) },
        { key: "test", label: "Test R²", align: "right", mono: true, render: (r) => <b>{fixed(r.test, 4)}</b> },
        { key: "gap", label: "Gap", align: "right", mono: true, render: (r) => fixed(r.gap, 4) },
        { key: "mae", label: "MAE", align: "right", mono: true, render: (r) => fixed(r.mae, 4) },
        { key: "rmse", label: "RMSE", align: "right", mono: true, render: (r) => fixed(r.rmse, 4) },
        { key: "cv", label: "CV mean", align: "right", mono: true, render: (r) => fixed(r.cv, 4) },
        { key: "cvstd", label: "CV std", align: "right", mono: true, render: (r) => fixed(r.cvstd, 4) },
        { key: "time", label: "Fit time", align: "right", mono: true, render: (r) => `${fixed(r.time, 2)} s` },
        { key: "top", label: "Top feature" },
      ]} />
    </>
  );
}
