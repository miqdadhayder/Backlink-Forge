import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, RotateCcw } from "lucide-react";
import ScoreGauge from "./ScoreGauge";
import ScoreBreakdown from "./ScoreBreakdown";
import LinkDetails from "./LinkDetails";
import RiskAnalysis from "./RiskAnalysis";
import Recommendation from "./Recommendation";
import ScoreExplanation from "./ScoreExplanation";
import { reportToCsv, downloadCsv, downloadReportPdf } from "@/utils/qualityExport";

export default function QualityReport({ report, onReanalyze }) {
  const whyText = buildWhy(report);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between">
          <ScoreGauge score={report.overall_score} classification={report.classification} label="Overall Quality Score" />
          <div className="flex-1 lg:pl-8">
            <h3 className="text-base font-semibold text-slate-900">Why this score?</h3>
            <p className="mt-2 text-sm text-slate-600">{whyText}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                Risk: <span className={riskColor(report.risk_level)}>{report.risk_level}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                Confidence: <span className={confColor(report.data_confidence)}>{report.data_confidence}</span>
              </span>
            </div>
          </div>
        </div>

        {report.source?.error && (
          <div className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="font-semibold">We couldn't fully access this page:</span> {report.source.error} Some backlink metrics may be unavailable.
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => downloadCsv(`backlink-quality-${Date.now()}.csv`, reportToCsv(report))}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadReportPdf(report)}>
            <FileText className="mr-2 h-4 w-4" /> Download PDF Report
          </Button>
          {onReanalyze && (
            <Button variant="ghost" size="sm" onClick={onReanalyze}>
              <RotateCcw className="mr-2 h-4 w-4" /> Analyze another
            </Button>
          )}
        </div>
      </div>

      <ScoreBreakdown factors={report.factors} />
      <div className="grid gap-6 lg:grid-cols-2">
        <LinkDetails report={report} />
        <RiskAnalysis report={report} />
      </div>
      <Recommendation report={report} />
      <ScoreExplanation report={report} />
    </div>
  );
}

function riskColor(l) {
  return l === "Low" ? "text-emerald-600" : l === "Medium" ? "text-amber-600" : "text-rose-600";
}
function confColor(c) {
  return c === "High" ? "text-emerald-600" : c === "Medium" ? "text-amber-600" : "text-rose-600";
}

function buildWhy(report) {
  if (report.error) return report.error;
  const positives = [];
  const negatives = [];
  (report.factors || []).forEach((f) => {
    if (f.available && f.score !== null) {
      if (f.score >= 70) positives.push(f.name.toLowerCase());
      else if (f.score < 40) negatives.push(`${f.name.toLowerCase()} (${f.status.toLowerCase()})`);
    }
  });
  let s = "";
  if (report.overall_score >= 75) s = "This backlink receives a high score because ";
  else if (report.overall_score >= 50) s = "This backlink is moderate because ";
  else s = "This backlink scores low because ";
  const parts = [];
  if (positives.length) parts.push(`positive signals were detected in ${positives.slice(0, 3).join(", ")}`);
  if (negatives.length) parts.push(`weaker signals appeared in ${negatives.slice(0, 3).join(", ")}`);
  s += (parts.join(" and ") || "of the available signals") + ".";
  if (report.data_confidence === "Low") s += " Note: several metrics could not be verified, so confidence is low.";
  return s;
}