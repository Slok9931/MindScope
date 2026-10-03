import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/api/client";
import { useAsync } from "@/hooks/useAsync";
import { useDebounced } from "@/hooks/useDebounced";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Slider from "@/components/ui/Slider";
import Stepper from "@/components/ui/Stepper";
import Segmented from "@/components/ui/Segmented";
import ChipGroup from "@/components/ui/ChipGroup";
import Icon from "@/components/ui/Icon";
import { Callout, ErrorState, Skeleton } from "@/components/ui/Feedback";
import Gauge from "@/components/charts/Gauge";
import LineChart from "@/components/charts/LineChart";
import { ACCENT, STRESS_COLORS, TONES } from "@/lib/theme";
import { fixed } from "@/lib/scales";
import "./predict.css";

const DEFAULTS = {
  Age: 21, Gender: "Female", Academic_Level: "Undergraduate", Country: "India",
  Avg_Daily_Usage_Hours: 5, Daily_Unlocks: 170, Most_Used_Platform: "Instagram", Purpose_Of_Use: "Entertainment",
  Study_Hours: 3, Sleep_Hours_Per_Night: 6.6, Physical_Activity_Hours: 1.7, Stress_Level: "Medium",
};
const PRESETS = [
  { name: "Balanced routine", icon: "heart", v: { Avg_Daily_Usage_Hours: 3.5, Daily_Unlocks: 110, Study_Hours: 4, Sleep_Hours_Per_Night: 7.8, Physical_Activity_Hours: 2.5, Stress_Level: "Low", Most_Used_Platform: "LinkedIn", Purpose_Of_Use: "Networking" } },
  { name: "Heavy scroller", icon: "phone", v: { Avg_Daily_Usage_Hours: 8, Daily_Unlocks: 250, Study_Hours: 1, Sleep_Hours_Per_Night: 4.5, Physical_Activity_Hours: 0.2, Stress_Level: "Very High", Most_Used_Platform: "TikTok", Purpose_Of_Use: "Entertainment" } },
  { name: "Rested & active", icon: "bolt", v: { Avg_Daily_Usage_Hours: 2.5, Daily_Unlocks: 90, Study_Hours: 5, Sleep_Hours_Per_Night: 8.5, Physical_Activity_Hours: 3, Stress_Level: "Low", Most_Used_Platform: "YouTube", Purpose_Of_Use: "Education" } },
];

export default function PredictPage() {
  const { data: opts, error: optsError } = useAsync(api.options, []);
  const [form, setForm] = useState(DEFAULTS);
  const [res, setRes] = useState({ data: null, error: null, loading: true });
  const abort = useRef(null);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const run = useCallback(async (payload) => {
    abort.current?.abort();
    const ctl = (abort.current = new AbortController());
    setRes((r) => ({ ...r, loading: true }));
    try {
      const data = await api.predict(payload, ctl.signal);
      setRes({ data, error: null, loading: false });
    } catch (e) {
      if (e.name !== "AbortError") setRes((r) => ({ ...r, error: e, loading: false }));
    }
  }, []);

  const debounced = useDebounced(form, 450);
  useEffect(() => { run(debounced); }, [debounced, run]);

  if (optsError) return <div className="page"><ErrorState error={optsError} /></div>;
  if (!opts) return <div className="page"><Skeleton h={600} /></div>;
  const R = opts.numeric_ranges;
  const sl = (key, cfg) => <Slider {...cfg} value={form[key]} onChange={set(key)} range={[R[key].min, R[key].max]} mean={R[key].mean} />;

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">01 · Prediction lab</span>
        <h1>Describe a student, <span className="grad-text">get a predicted score.</span></h1>
        <p>Inputs go straight to the saved Extra Trees pipeline through <code className="mono">POST /api/predict</code>. Predictions update as you adjust the controls; the shaded track shows the value range the model saw during training.</p>
      </div>

      <div className="presets">
        <span>Quick start</span>
        {PRESETS.map((p) => <button key={p.name} className="preset" onClick={() => setForm((f) => ({ ...f, ...p.v }))}><Icon name={p.icon} size={15} />{p.name}</button>)}
        <button className="preset ghost" onClick={() => setForm(DEFAULTS)}><Icon name="reset" size={15} />Reset</button>
      </div>

      <div className="lab">
        <div className="lab-form">
          <Card title="Profile" subtitle="Who is the student?">
            <div className="form-grid">
              <Stepper label="Age" unit="yrs" min={16} max={30} value={form.Age} onChange={set("Age")} />
              <Segmented label="Gender" value={form.Gender} onChange={set("Gender")} options={opts.genders} />
              <Segmented label="Academic level" value={form.Academic_Level} onChange={set("Academic_Level")} options={opts.academic_levels} />
              <Select label="Country" searchable value={form.Country} onChange={set("Country")} options={opts.countries} />
            </div>
          </Card>

          <Card title="Digital habits" subtitle="How do they use social media?">
            <div className="form-grid">
              {sl("Avg_Daily_Usage_Hours", { label: "Daily usage", min: 0, max: 12, step: 0.1, unit: " h", decimals: 1 })}
              {sl("Daily_Unlocks", { label: "Phone unlocks per day", min: 0, max: 350, step: 1 })}
              <div className="full"><ChipGroup label="Most used platform" value={form.Most_Used_Platform} onChange={set("Most_Used_Platform")} options={opts.platforms} /></div>
              <div className="full"><Segmented label="Main purpose" value={form.Purpose_Of_Use} onChange={set("Purpose_Of_Use")} options={opts.purposes} /></div>
            </div>
          </Card>

          <Card title="Lifestyle" subtitle="Rest, study, movement and stress">
            <div className="form-grid">
              {sl("Sleep_Hours_Per_Night", { label: "Sleep per night", min: 2, max: 12, step: 0.1, unit: " h", decimals: 1 })}
              {sl("Study_Hours", { label: "Study per day", min: 0, max: 10, step: 0.1, unit: " h", decimals: 1 })}
              {sl("Physical_Activity_Hours", { label: "Physical activity", min: 0, max: 6, step: 0.1, unit: " h", decimals: 1 })}
              <Segmented label="Stress level" value={form.Stress_Level} onChange={set("Stress_Level")} options={opts.stress_levels.map((s) => ({ value: s, label: s, color: STRESS_COLORS[s] }))} />
            </div>
            <div className="day-bar">
              <DayBar form={form} />
            </div>
          </Card>
          <div className="submit-row">
            <Button size="lg" onClick={() => run(form)} loading={res.loading} icon={<Icon name="spark" size={18} />}>Predict mental health score</Button>
            <span className="muted">Auto-updates 0.4 s after you stop editing</span>
          </div>
        </div>

        <aside className="lab-result"><Result res={res} /></aside>
      </div>

      {res.data && (
        <>
          <h2 className="section-title">What-if explorer <span>change one habit, keep everything else fixed</span></h2>
          <div className="grid g2">
            {Object.entries(res.data.sensitivity).map(([k, s], i) => (
              <Card key={k} title={`Predicted score vs. ${s.label.toLowerCase()}`} subtitle={`Your value: ${s.current} ${s.unit}`}>
                <LineChart area compact height={210} marker={s.current} xLabel={s.label} yLabel="Score" yDomain={[Math.min(...res.data.sensitivity[k].points.map((p) => p[1])), Math.max(...res.data.sensitivity[k].points.map((p) => p[1]))]}
                  series={[{ name: "Predicted score", color: ACCENT, points: s.points }]} />
              </Card>
            ))}
          </div>
          <Callout tone="info" title="How to read the curves">
            Tree ensembles produce step-like, piece-wise constant responses rather than smooth lines. The curves show what the model <em>learned</em> from this dataset — they are associations, not proof that changing a habit will change someone's wellbeing.
          </Callout>
        </>
      )}

      {res.data && <div className="mini-score" style={{ "--tc": TONES[res.data.band.tone] }}><b>{res.data.score.toFixed(2)}</b><span>{res.data.band.label}</span></div>}
    </div>
  );
}

function DayBar({ form }) {
  const parts = [
    ["Sleep", form.Sleep_Hours_Per_Night, "#4a63c9"], ["Social media", form.Avg_Daily_Usage_Hours, "#6e8bff"],
    ["Study", form.Study_Hours, "#9db1ff"], ["Activity", form.Physical_Activity_Hours, "#cdd7ff"],
  ];
  const used = parts.reduce((s, p) => s + p[1], 0);
  const over = used > 24;
  return (
    <div>
      <div className="day-top"><span className="field-label">A day in hours</span><b className={over ? "over" : ""}>{used.toFixed(1)} / 24 h{over && " — too many!"}</b></div>
      <div className="day-track">
        {parts.map(([n, v, c]) => <i key={n} style={{ width: `${(v / Math.max(24, used)) * 100}%`, background: c }} title={`${n}: ${v} h`} />)}
        <i className="free" style={{ flex: 1 }} />
      </div>
      <div className="day-legend">{parts.map(([n, , c]) => <span key={n}><i style={{ background: c }} />{n}</span>)}<span><i className="free" />Other / free</span></div>
    </div>
  );
}

function Result({ res }) {
  const { data: d, error, loading } = res;
  if (!d && loading) return <Card><Skeleton h={420} /></Card>;
  if (!d) return <Card><ErrorState error={error} /></Card>;
  const tone = TONES[d.band.tone];
  return (
    <Card glow={tone} className={loading ? "result is-loading" : "result"}>
      <div className="result-top"><span className="eyebrow">Predicted mental health score</span>{loading && <span className="spinner light" />}</div>
      <Gauge value={d.score} low={d.low} high={d.high} color={tone} label={d.band.label} />
      <p className="band-msg">{d.band.message}</p>
      <div className="res-stats">
        <div><small>Likely range</small><b>{d.low.toFixed(1)} – {d.high.toFixed(1)}</b><em>10–90% of trees</em></div>
        <div><small>vs. dataset avg ({d.dataset_mean.toFixed(2)})</small><b style={{ color: d.delta_vs_mean >= 0 ? TONES.good : TONES.bad }}>{d.delta_vs_mean >= 0 ? "+" : ""}{d.delta_vs_mean.toFixed(2)}</b><em>score points</em></div>
      </div>
      <div className="pct">
        <div className="pct-top"><small>Percentile among students</small><b>{fixed(d.percentile, 0)}<sup>th</sup></b></div>
        <div className="pct-track"><i style={{ left: `${d.percentile}%` }} /><span style={{ width: `${d.percentile}%` }} /></div>
        <div className="pct-scale"><span>lowest</span><span>highest</span></div>
      </div>
      {error && <Callout tone="warn" title="Couldn't update">{error.message}</Callout>}
      {d.warnings.map((w) => <Callout key={w} tone="warn" title="Outside training range">{w}</Callout>)}
      <p className="disclaimer">Statistical estimate from a survey dataset — not a diagnosis. If you're struggling, please talk to a health professional.</p>
    </Card>
  );
}
