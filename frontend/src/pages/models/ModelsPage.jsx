import { useState } from "react";
import { api } from "@/api/client";
import { useAsync } from "@/hooks/useAsync";
import Tabs from "@/components/ui/Tabs";
import { ErrorState, Skeleton } from "@/components/ui/Feedback";
import Comparison from "./Comparison";
import Explorer from "./Explorer";
import TrainingSteps from "./TrainingSteps";
import "./models.css";

export default function ModelsPage() {
  const [tab, setTab] = useState("compare");
  const [selected, setSelected] = useState("extra_trees");
  const { data, error } = useAsync(api.models, []);

  const open = (key) => { setSelected(key); setTab("explore"); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">03 · Model training &amp; evaluation</span>
        <h1>Three regressors, <span className="grad-text">one clear winner.</span></h1>
        <p>Linear Regression, Random Forest and Extra Trees were trained on the same 70/30 split and judged on R², MAE and RMSE, then cross-validated. Explore the leaderboard, dig into each model, or walk through the training pipeline.</p>
      </div>
      <Tabs variant="pill" value={tab} onChange={setTab} tabs={[
        { value: "compare", label: "Leaderboard & comparison" }, { value: "explore", label: "Model explorer" }, { value: "steps", label: "Training steps" },
      ]} />
      <div className="tab-panel" key={tab}>
        {error ? <ErrorState error={error} /> : !data ? <div className="grid g3"><Skeleton h={180} /><Skeleton h={180} /><Skeleton h={180} /></div> : (
          tab === "compare" ? <Comparison data={data} onOpen={open} /> :
          tab === "explore" ? <Explorer data={data} selected={selected} onSelect={setSelected} /> :
          <TrainingSteps data={data} />
        )}
      </div>
    </div>
  );
}
