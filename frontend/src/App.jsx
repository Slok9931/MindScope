import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/Feedback";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const AnalysisPage = lazy(() => import("@/pages/analysis/AnalysisPage"));
const ModelsPage = lazy(() => import("@/pages/models/ModelsPage"));
const PredictPage = lazy(() => import("@/pages/predict/PredictPage"));
const DocsPage = lazy(() => import("@/pages/docs/DocsPage"));

export default function App() {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary key={pathname}>
    <Suspense fallback={<div className="page"><Skeleton h={400} /></div>}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/predict" replace />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="*" element={<Navigate to="/predict" replace />} />
        </Route>
      </Routes>
    </Suspense>
    </ErrorBoundary>
  );
}
