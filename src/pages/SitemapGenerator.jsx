import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Link2, ArrowLeft, FileCode2, Gauge, Info } from "lucide-react";
import SitemapForm from "@/components/bf/sitemap/SitemapForm";
import SitemapLoading from "@/components/bf/sitemap/SitemapLoading";
import SitemapResults from "@/components/bf/sitemap/SitemapResults";
import ValidateForm from "@/components/bf/sitemap/ValidateForm";
import ValidateResults from "@/components/bf/sitemap/ValidateResults";

export default function SitemapGenerator() {
  const { isAuthenticated: authed } = useAuth();
  const [tab, setTab] = React.useState("generate");
  const [genLoading, setGenLoading] = React.useState(false);
  const [genResult, setGenResult] = React.useState(null);
  const [genParams, setGenParams] = React.useState(null);
  const [genError, setGenError] = React.useState("");
  const [valLoading, setValLoading] = React.useState(false);
  const [valResult, setValResult] = React.useState(null);
  const [valError, setValError] = React.useState("");
  const [valPrefill, setValPrefill] = React.useState("");
  const [usage, setUsage] = React.useState(null);

  const scrollToRes = () => {
    const el = document.getElementById("sitemap-results");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const generate = async (params) => {
    setGenLoading(true);
    setGenError("");
    setGenResult(null);
    setGenParams(params);
    try {
      const res = await base44.functions.invoke("generateSitemap", params);
      const d = res.data || res;
      if (d.error) { setGenError(d.error); return; }
      setGenResult(d);
      setUsage(d.usage);
      setTimeout(scrollToRes, 100);
    } catch (e) {
      setGenError("We couldn't generate a sitemap. Please check the URL and try again.");
    } finally {
      setGenLoading(false);
    }
  };

  const validate = async (params) => {
    setValLoading(true);
    setValError("");
    setValResult(null);
    try {
      const res = await base44.functions.invoke("validateSitemap", params);
      const d = res.data || res;
      if (d.error) { setValError(d.error); return; }
      setValResult(d);
      setTimeout(scrollToRes, 100);
    } catch (e) {
      setValError("We couldn't validate this sitemap. Please try again.");
    } finally {
      setValLoading(false);
    }
  };

  const validateExisting = (url) => {
    setValPrefill(url);
    setTab("validate");
    setValResult(null);
    setValError("");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Link2 className="h-4 w-4" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900">BacklinkForge</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
            <Button size="sm" variant="outline" onClick={handleSignOut}>Sign out</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="inline h-4 w-4" /> Back to tool
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <FileCode2 className="h-4 w-4" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">XML Sitemap Generator & Validator</h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Generate & Validate XML Sitemaps in Seconds — crawl your website, discover indexable pages,
          generate a clean XML sitemap, and identify sitemap errors before submitting it to search engines.
        </p>

        <div className="mt-6 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 sm:max-w-xs">
          {[
            { id: "generate", label: "Generate Sitemap" },
            { id: "validate", label: "Validate Sitemap" }
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${tab === t.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {usage && usage.limit != null && !genResult && tab === "generate" && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
            <Gauge className="h-3.5 w-3.5 text-slate-400" /> {usage.used} / {usage.limit} generations used this month
          </div>
        )}

        <div className="mt-6">
          {tab === "generate" && (
            <>
              <div className="mx-auto max-w-2xl">
                <SitemapForm onGenerate={generate} loading={genLoading} usage={usage} />
              </div>
              {genLoading && (
                <div id="sitemap-results" className="mx-auto mt-8 max-w-3xl scroll-mt-20"><SitemapLoading /></div>
              )}
              {genError && (
                <div className="mx-auto mt-8 flex max-w-3xl items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0" /> {genError}
                </div>
              )}
              {!genLoading && genResult && (
                <div id="sitemap-results" className="mx-auto mt-8 max-w-5xl scroll-mt-20">
                  <SitemapResults
                    result={genResult}
                    onRegenerate={() => genParams && generate(genParams)}
                    onValidateExisting={() => genResult.existing_sitemaps[0] && validateExisting(genResult.existing_sitemaps[0])}
                  />
                </div>
              )}
            </>
          )}
          {tab === "validate" && (
            <>
              <div className="mx-auto max-w-2xl">
                <ValidateForm onValidate={validate} loading={valLoading} prefillUrl={valPrefill} />
              </div>
              {valLoading && (
                <div id="sitemap-results" className="mx-auto mt-8 max-w-3xl scroll-mt-20"><SitemapLoading /></div>
              )}
              {valError && (
                <div className="mx-auto mt-8 flex max-w-3xl items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0" /> {valError}
                </div>
              )}
              {!valLoading && valResult && (
                <div id="sitemap-results" className="mx-auto mt-8 max-w-5xl scroll-mt-20">
                  <ValidateResults result={valResult} />
                </div>
              )}
            </>
          )}
        </div>

        <div className="mx-auto mt-16 max-w-3xl space-y-8 border-t border-slate-200 pt-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">What is an XML Sitemap?</h2>
            <p className="mt-2 text-sm text-slate-600">
              An XML sitemap is a file that lists the URLs on your website so search engines like Google can
              discover and crawl them efficiently. It's especially useful for new sites, large sites, and
              sites with pages that aren't well linked internally.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Why Validate Your Sitemap?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Common sitemap problems hurt crawling: broken (404) URLs, redirects that waste crawl budget,
              invalid XML that search engines reject, duplicate URLs, noindex pages that shouldn't be listed,
              and URLs blocked by robots.txt. Validating before submission catches these issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}