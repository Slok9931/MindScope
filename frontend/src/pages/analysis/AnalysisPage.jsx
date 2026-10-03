import { useState } from "react";
import { api } from "@/api/client";
import { useAsync } from "@/hooks/useAsync";
import Card from "@/components/ui/Card";
import Stat from "@/components/ui/Stat";
import Segmented from "@/components/ui/Segmented";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import { Badge, ErrorState, Skeleton } from "@/components/ui/Feedback";
import Icon from "@/components/ui/Icon";
import BarChart from "@/components/charts/BarChart";
import Histogram from "@/components/charts/Histogram";
import BoxPlot from "@/components/charts/BoxPlot";
import Heatmap from "@/components/charts/Heatmap";
import Scatter from "@/components/charts/Scatter";
import LineChart from "@/components/charts/LineChart";
import Donut from "@/components/charts/Donut";
import { ACCENT, PALETTE, STRESS_COLORS, TONES } from "@/lib/theme";
import { fixed, num } from "@/lib/scales";
import "./analysis.css";

const GENDERS = [{ value: "", label: "All" }, { value: "Male", label: "Male" }, { value: "Female", label: "Female" }];
const LEVELS = [{ value: "", label: "All levels" }, { value: "High School", label: "High School" }, { value: "Undergraduate", label: "Undergrad" }, { value: "Graduate", label: "Graduate" }];

export default function AnalysisPage() {
  const [gender, setGender] = useState("");
  const [level, setLevel] = useState("");
  const [trend, setTrend] = useState("physical");
  const { data, error, loading } = useAsync(() => api.overview({ gender, academic_level: level }), [gender, level]);

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">02 · Exploratory data analysis</span>
        <h1>How does social media use relate to <span className="grad-text">student wellbeing?</span></h1>
        <p>Every chart below is computed live by the API from the cleaned dataset. Slice by gender or academic level to see how each pattern changes.</p>
      </div>

      <div className="filters card">
        <Segmented size="sm" label="Gender" value={gender} onChange={setGender} options={GENDERS} />
        <Segmented size="sm" label="Academic level" value={level} onChange={setLevel} options={LEVELS} />
        <div className="filters-end">
          {(gender || level) && <Button variant="ghost" size="sm" icon={<Icon name="reset" size={14} />} onClick={() => { setGender(""); setLevel(""); }}>Clear</Button>}
          <Badge color={ACCENT}>{data ? `${num(data.kpis.rows)} students` : "…"}</Badge>
        </div>
      </div>

      {error && !data ? <ErrorState error={error} /> : !data ? <Loading /> : <Dashboard d={data} loading={loading} trend={trend} setTrend={setTrend} />}
    </div>
  );
}

const Loading = () => (
  <div className="grid g4" style={{ marginTop: 22 }}>{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} h={120} />)}</div>
);

function Dashboard({ d, loading, trend, setTrend }) {
  const k = d.kpis, q = d.quality;
  const trendMeta = {
    physical: { label: "Physical activity (h)", color: ACCENT, data: d.trends.physical },
    study: { label: "Study hours", color: ACCENT, data: d.trends.study },
    unlocks: { label: "Daily unlocks", color: ACCENT, data: d.trends.unlocks },
  }[trend];
  const topCountries = [...d.country].sort((a, b) => b.mean - a.mean);
  const platformByMean = [...d.platform].sort((a, b) => b.mean - a.mean);

  return (
    <div className={loading ? "is-loading" : ""} style={{ transition: "opacity .3s" }}>
      <div className="grid g4 kpis">
        <Stat label="Students analysed" value={k.rows} icon="user" color={ACCENT} sub={`${k.countries} countries`} />
        <Stat label="Avg mental health score" value={k.avg_score} decimals={2} icon="heart" color={ACCENT} sub="out of 10 (higher = better)" />
        <Stat label="Avg daily usage" value={k.avg_usage} decimals={1} suffix=" h" icon="phone" color={ACCENT} sub={`${num(k.avg_unlocks)} unlocks / day`} />
        <Stat label="High / very high stress" value={k.high_stress_pct} decimals={0} suffix="%" icon="bolt" color={ACCENT} sub={`${fixed(k.avg_sleep, 1)} h average sleep`} />
      </div>

      <div className="grid g4 insights">
        {d.insights.map((i) => (
          <div key={i.title} className="insight" style={{ "--ic": TONES[i.tone] }}>
            <Icon name="bulb" size={17} /><div><b>{i.title}</b><p>{i.text}</p></div>
          </div>
        ))}
      </div>

      <h2 className="section-title">Distributions <span>what a typical student looks like</span></h2>
      <div className="grid g3">
        <Card title="Mental health score" subtitle="Distribution with mean & median">
          <Histogram hist={d.score_hist} color={ACCENT} xLabel="Score" markers={[{ label: "mean", value: d.score_hist.mean, color: TONES.warn }, { label: "median", value: d.score_hist.median, color: "#e6e9f2" }]} />
        </Card>
        <Card title="Daily social-media usage" subtitle="Hours per day">
          <Histogram hist={d.usage_hist} color={ACCENT} xLabel="Hours / day" markers={[{ label: "mean", value: d.usage_hist.mean, color: TONES.warn }]} />
        </Card>
        <Card title="Sleep per night" subtitle="Hours per night">
          <Histogram hist={d.sleep_hist} color={ACCENT} xLabel="Hours / night" markers={[{ label: "mean", value: d.sleep_hist.mean, color: TONES.warn }]} />
        </Card>
      </div>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <Card title="Stress level vs. mental health score" subtitle="Box = interquartile range · white bar = median · dot = mean">
          <BoxPlot items={d.stress_box} colors={STRESS_COLORS} />
        </Card>
        <Card title="Academic level vs. mental health score" subtitle="Same encoding as the stress plot">
          <BoxPlot items={d.academic_box} />
        </Card>
      </div>

      <h2 className="section-title">Behaviour vs. wellbeing <span>each dot is a student · white line = least-squares fit</span></h2>
      <div className="grid g2">
        <Card title="Daily usage vs. score" subtitle="Heavier use → clearly lower scores"><Scatter points={d.scatter.usage} xLabel="Usage (h/day)" yLabel="Score" color={ACCENT} /></Card>
        <Card title="Sleep vs. score" subtitle="More sleep → higher scores"><Scatter points={d.scatter.sleep} xLabel="Sleep (h/night)" yLabel="Score" color={ACCENT} /></Card>
        <Card title="Daily unlocks vs. score" subtitle="Compulsive checking tracks with lower scores"><Scatter points={d.scatter.unlocks} xLabel="Phone unlocks / day" yLabel="Score" color={ACCENT} /></Card>
        <Card title="Study hours vs. score" subtitle="Students who study more tend to score higher"><Scatter points={d.scatter.study} xLabel="Study (h/day)" yLabel="Score" color={ACCENT} /></Card>
      </div>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <Card title="Binned average trend" subtitle="Mean score per equal-width bin of the selected feature"
              action={<Tabs variant="pill" value={trend} onChange={setTrend} tabs={[{ value: "physical", label: "Activity" }, { value: "study", label: "Study" }, { value: "unlocks", label: "Unlocks" }]} />}>
          <LineChart key={trend} area xLabel={trendMeta.label} yLabel="Avg score" series={[{ name: "Avg score", color: trendMeta.color, points: trendMeta.data.map(([x, y]) => [x, y]) }]} />
        </Card>
        <Card title="Sleep × usage heat-map" subtitle="Average score for each combination (cells with <5 students hidden)">
          <Heatmap mode="sequential" cell={40} rows={d.heatmap.rows} cols={d.heatmap.cols} values={d.heatmap.values} rowTitle="Sleep (h)" colTitle="Usage (h / day)" fmt={(v) => fixed(v, 1)} tipLabel="Avg score" />
        </Card>
      </div>

      <h2 className="section-title">Relationships <span>Pearson correlation between numeric columns</span></h2>
      <div className="grid g2">
        <Card title="Correlation matrix" subtitle="Cyan = positive · rose = negative">
          <Heatmap rows={d.correlation.labels} cols={d.correlation.labels} values={d.correlation.matrix} cell={46} />
        </Card>
        <Card title="Correlation with mental health score" subtitle="Bar length = |r| · colour = direction">
          <BarChart rowH={44} data={d.target_corr.map((c) => c.value == null
            ? { label: c.label, value: 0, text: "n/a", color: "#667089", sub: [["Pearson r", "undefined (constant column)"]] }
            : { label: c.label, value: Math.abs(c.value), text: (c.value > 0 ? "+" : "−") + Math.abs(c.value).toFixed(2), color: c.value < 0 ? TONES.bad : ACCENT, sub: [["Pearson r", c.value.toFixed(3)]] })} max={1} format={(v) => v.toFixed(2)} />
          {d.constant_features.length > 0 && <p className="note note-warn">{d.constant_features.join(", ")} has the same value for every student in this selection, so its correlation is undefined (shown as n/a / empty cells).</p>}
          <p className="note">Correlation is not causation: heavy users may also sleep less, study less and feel more stressed — the model has to untangle these together.</p>
        </Card>
      </div>

      <h2 className="section-title">Who is in the data? <span>demographics &amp; platforms</span></h2>
      <div className="grid g3">
        <Card title="Gender split"><Donut data={d.gender.map((g, i) => ({ label: g.label, value: g.count, color: [ACCENT, "#8b96b3"][i] }))} centerLabel="students" /></Card>
        <Card title="Academic level"><Donut data={d.academic.map((g, i) => ({ label: g.label, value: g.count, color: PALETTE[i + 1] }))} centerLabel="students" /></Card>
        <Card title="Stress levels"><Donut data={d.stress_counts.map((s) => ({ label: s.label, value: s.count, color: STRESS_COLORS[s.label] }))} centerLabel="students" /></Card>
      </div>
      <div className="grid g2" style={{ marginTop: 18 }}>
        <Card title="Most used platforms" subtitle="Number of students">
          <BarChart data={d.platform.map((p, i) => ({ label: p.label, value: p.count, color: PALETTE[i % PALETTE.length], sub: [["Avg score", fixed(p.mean, 2)]] }))} format={(v) => num(v, 0)} />
        </Card>
        <Card title="Average score by platform" subtitle="Sorted from best to worst average">
          <BarChart data={platformByMean.map((p) => ({ label: p.label, value: p.mean, color: ACCENT, sub: [["Students", num(p.count)]] }))} max={10} />
        </Card>
        <Card title="Purpose of use" subtitle="Average score by why students use social media">
          <BarChart data={[...d.purpose].sort((a, b) => b.mean - a.mean).map((p, i) => ({ label: p.label, value: p.mean, color: PALETTE[i + 2], sub: [["Students", num(p.count)]] }))} max={10} />
        </Card>
        <Card title="Top 12 countries by sample size" subtitle="Average score (the model keeps all 111 countries)">
          <BarChart rowH={28} data={topCountries.map((c) => ({ label: c.label, value: c.mean, color: ACCENT, sub: [["Students", num(c.count)]] }))} max={10} />
        </Card>
      </div>

      <h2 className="section-title">Data quality &amp; summary statistics</h2>
      <div className="grid g3">
        <Card title="Cleaning report" subtitle="Applied before any plot or model">
          <ul className="quality">
            <li><span>Raw rows</span><b>{num(q.raw_rows)}</b></li>
            <li><span>Duplicate rows removed</span><b>{q.duplicates_removed}</b></li>
            <li><span>Negative activity hours clipped to 0</span><b>{q.negative_activity_clipped}</b></li>
            <li><span>Missing values</span><b>{q.missing_values}</b></li>
            <li><span>Rows after cleaning</span><b className="grad-text">{num(q.clean_rows)}</b></li>
          </ul>
        </Card>
        <Card className="span2" title="Descriptive statistics" subtitle="Numeric columns for the current selection" pad>
          <DataTable columns={[
            { key: "feature", label: "Feature", sortable: false }, { key: "mean", label: "Mean", align: "right", mono: true }, { key: "std", label: "Std", align: "right", mono: true },
            { key: "min", label: "Min", align: "right", mono: true }, { key: "q25", label: "25%", align: "right", mono: true }, { key: "median", label: "Median", align: "right", mono: true },
            { key: "q75", label: "75%", align: "right", mono: true }, { key: "max", label: "Max", align: "right", mono: true },
          ]} rows={d.describe} />
        </Card>
      </div>
    </div>
  );
}
