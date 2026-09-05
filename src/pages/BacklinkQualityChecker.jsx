import React from "react";
import { Link } from "react-router-dom";
import { Gauge, ListChecks, History, Link2, ArrowLeft, AlertCircle, LogIn } from "lucide-react";
import Header from "@/components/bf/Header";
import Footer from "@/components/bf/Footer";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import QualityCheckerForm from "@/components/bqc/QualityCheckerForm";
import QualityLoading from "@/components/bqc/QualityLoading";
import QualityReport from "@/components/bqc/QualityReport";
import BulkAnalysis from "@/components/bqc/BulkAnalysis";
import AnalysisHistory from "@/components/bqc/AnalysisHistory";
import EducationalContent from "@/components/bqc/EducationalContent";
import FinalCta from "@/components/bqc/FinalCta";

const TABS = [
  { id: "single", label: "Single Analysis", icon: Gauge },
  { id: "bulk", label: "Multiple Backlinks", icon: ListChecks },
  { id: "history", label: "History", icon: History }
];

export default function BacklinkQualityChecker() {
  const { toast } = useToast();
  const [tab, setTab] = React.useState("single");
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [authed, setAuthed] = React.useState(false);
  const [checkedAuth, setCheckedAuth] = React.useState(false);
  const resultsRef = React.useRef(null);

  React.useEffect(() => {
    base44.auth.isAuthenticated().then(setAuthed).catch(() => setAuthed(false)).finally(() => setCheckedAuth(true));
  }, []);

  const analyze = async (values) => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await base44.functions.invoke("analyzeBacklinkQuality", values);
      const data = res.data;
      if (!data || data.error) {
        setError(data?.error || "We couldn't analyze this backlink. Please try again.");
      } else if (data.report) {
        setReport(data.report);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        if (data.usage && data.usage.limit && data.usage.used >= data.usage.limit) {
          toast({ title: `You've used ${data.usage.used}/${data.usage.limit} free analyses today.` });
        }
      } else {
        setError("Unexpected response from the analysis service.");
      }
    } catch (e) {
      const status = e?.response?.status;
      if (status === 429) setError("You've reached your free analysis limit for today. Upgrade your plan to continue.");
      else if (status === 400) setError(e?.response?.data?.error || "Please check the URLs you entered.");
      else setError("We couldn't analyze this backlink right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <TooltipProvider>
        <main className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to home
          </Link>

          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Gauge className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Backlink Quality Checker</h1>
              <p className="text-sm text-slate-500">Analyze the SEO value, relevance, authority, and potential risks of any backlink.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  tab === t.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {tab === "single" && (
              <>
                <QualityCheckerForm onAnalyze={analyze} loading={loading} />
                {loading && <div className="mt-6"><QualityLoading /></div>}
                {error && !loading && (
                  <div className="mt-6 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> <span>{error}</span>
                  </div>
                )}
                {!loading && !report && !error && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                      <Link2 className="h-6 w-6 text-slate-400" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-slate-900">Check Your Backlink Quality</h3>
                    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Enter a backlink URL to see how valuable and trustworthy the link may be.</p>
                  </div>
                )}
                {report && !loading && (
                  <div ref={resultsRef} className="mt-6">
                    <QualityReport report={report} onReanalyze={() => { setReport(null); setError(null); }} />
                  </div>
                )}
              </>
            )}

            {tab === "bulk" && <BulkAnalysis />}

            {tab === "history" && (
              checkedAuth && authed
                ? <AnalysisHistory onOpen={(r) => { setReport(r); setTab("single"); }} />
                : checkedAuth && !authed ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <p className="text-sm text-slate-600">Sign in to save and revisit your analysis history.</p>
                    <div className="mt-4">
                      <Link to="/login"><Button size="sm"><LogIn className="mr-2 h-4 w-4" /> Sign In</Button></Link>
                    </div>
                  </div>
                ) : null
            )}
          </div>
        </main>

        <EducationalContent />
        <FinalCta />
      </TooltipProvider>
      <Footer />
    </div>
  );
}