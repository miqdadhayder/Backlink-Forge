import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Link2, ArrowLeft, Target, AlertCircle, Gauge } from "lucide-react";
import GapForm from "@/components/bf/gap/GapForm";
import GapLoadingState from "@/components/bf/gap/GapLoadingState";
import GapResults from "@/components/bf/gap/GapResults";

export default function BacklinkGapFinder() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [authed, setAuthed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState(null);
  const [query, setQuery] = React.useState(null);
  const [analysisId, setAnalysisId] = React.useState(null);
  const [apiError, setApiError] = React.useState("");
  const [savedIds, setSavedIds] = React.useState(new Set());
  const [usage, setUsage] = React.useState(null);

  React.useEffect(() => {
    base44.auth.isAuthenticated().then((a) => {
      setAuthed(a);
      if (a) {
        loadSaved();
        const reopenId = searchParams.get("analysis");
        if (reopenId) loadAnalysis(reopenId);
      } else {
        window.location.href = "/login";
      }
    }).catch(() => {
      setAuthed(false);
      window.location.href = "/login";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSaved = async () => {
    try {
      const saved = await base44.entities.SavedGapOpportunity.list("-created_date", 200);
      setSavedIds(new Set((saved || []).map((s) => s.backlink_gap_id)));
    } catch (e) { /* ignore */ }
  };

  const loadAnalysis = async (id) => {
    setLoading(true);
    setApiError("");
    try {
      const analysis = await base44.entities.BacklinkGapAnalysis.get(id);
      const [competitors, gaps] = await Promise.all([
        base44.entities.Competitor.filter({ analysis_id: id }).catch(() => []),
        base44.entities.BacklinkGap.filter({ analysis_id: id }).catch(() => [])
      ]);
      const numCompetitors = (competitors || []).length || 1;
      const gapList = (gaps || []).map((g) => ({
        ...g,
        website: g.domain,
        numCompetitors,
        _gapId: `${id}:${g.domain}`
      }));
      const totalOpps = gapList.length;
      const referringDomains = new Set(gapList.map((g) => g.domain)).size;
      const highQuality = gapList.filter((g) => g.opportunity_score >= 75).length;
      const guestPostOpps = gapList.filter((g) => g.guest_post_url).length;
      const avgDa = gapList.length
        ? Math.round(gapList.reduce((s, g) => s + (g.domain_authority || 0), 0) / gapList.length)
        : 0;
      const commonDomains = gapList
        .filter((g) => g.competitor_count >= 2)
        .sort((a, b) => b.competitor_count - a.competitor_count || b.opportunity_score - a.opportunity_score)
        .slice(0, 10)
        .map((g) => ({
          domain: g.domain, competitor_count: g.competitor_count, numCompetitors,
          domain_authority: g.domain_authority, priority: g.priority, opportunity_score: g.opportunity_score
        }));
      setData({
        is_demo: analysis.is_demo,
        user: { domain: domainOf(analysis.website_url), url: analysis.website_url, referring_domains: 0 },
        competitors: (competitors || []).map((c) => ({
          name: c.competitor_name, url: c.competitor_url, domain: domainOf(c.competitor_url),
          referring_domains: c.referring_domains
        })),
        gaps: gapList,
        stats: { totalOpportunities: totalOpps, referringDomains, highQuality, guestPostOpps, avgDa },
        commonDomains,
        contentGaps: gapList.filter((g) => g.source_title).slice(0, 6).map((g) => ({
          domain: g.domain, source_title: g.source_title, source_url: g.source_url,
          domain_authority: g.domain_authority,
          suggestion: "Create a better resource and pitch it to websites linking to this article."
        })),
        brokenLinks: gapList.filter((g) => g.is_broken).slice(0, 6).map((g) => ({
          domain: g.domain, broken_target: `${domainOf(analysis.website_url)}/old-page`,
          source_url: g.source_url,
          suggestion: "Create a relevant replacement page and contact the referring website."
        }))
      });
      setQuery({
        website_url: analysis.website_url, keyword: analysis.keyword,
        competitors: (analysis.competitors_summary || "").split(", ").filter(Boolean)
      });
      setAnalysisId(id);
      setSearchParams({ analysis: id });
      setTimeout(() => {
        const el = document.getElementById("gap-results");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e) {
      setApiError("We couldn't load this analysis. It may have been removed.");
    } finally {
      setLoading(false);
    }
  };

  const analyze = async (params) => {
    setLoading(true);
    setApiError("");
    setData(null);
    try {
      const res = await base44.functions.invoke("analyzeBacklinkGaps", params);
      const d = res.data || res;
      if (d.error) {
        setApiError(d.error);
        setLoading(false);
        return;
      }
      const numCompetitors = (d.competitors || []).length || 1;
      const gaps = (d.gaps || []).map((g) => ({
        ...g,
        website: g.website || g.domain,
        numCompetitors,
        _gapId: `${d.analysis_id}:${g.domain}`
      }));
      const result = { ...d, gaps };
      setData(result);
      setQuery(d.query);
      setAnalysisId(d.analysis_id);
      setUsage(d.usage);
      setSearchParams({ analysis: d.analysis_id });
      setTimeout(() => {
        const el = document.getElementById("gap-results");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setApiError("Live backlink data is currently unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (g) => {
    const gapId = g._gapId || `${analysisId}:${g.domain}`;
    if (savedIds.has(gapId)) return;
    try {
      await base44.entities.SavedGapOpportunity.create({
        backlink_gap_id: gapId,
        analysis_id: analysisId,
        domain: g.domain,
        source_url: g.source_url,
        domain_authority: g.domain_authority,
        traffic: g.traffic,
        backlink_type: g.backlink_type,
        competitor_names: g.competitor_names,
        competitor_count: g.competitor_count,
        relevance_score: g.relevance_score,
        opportunity_score: g.opportunity_score,
        priority: g.priority,
        guest_post_url: g.guest_post_url,
        contact_url: g.contact_url,
        niche: g.niche,
        country: g.country
      });
      setSavedIds((prev) => new Set(prev).add(gapId));
      toast({ title: "Opportunity saved", description: g.domain });
    } catch (e) {
      toast({ title: "Could not save", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleSignOut = async () => {
    await base44.auth.logout();
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
        <div className="flex items-center gap-2">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
            <ArrowLeft className="inline h-4 w-4" /> Back to tool
          </Link>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Target className="h-4 w-4" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Backlink Gap Finder</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Compare your backlink profile with competitors and find websites that link to them but not to you.
        </p>

        {usage && usage.limit != null && !data && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
            <Gauge className="h-3.5 w-3.5 text-slate-400" />
            {usage.used} / {usage.limit} analyses used this month
          </div>
        )}

        <div className="mx-auto mt-6 max-w-3xl">
          <GapForm onAnalyze={analyze} loading={loading} />
        </div>

        {loading && (
          <div id="gap-results" className="mx-auto mt-8 max-w-5xl scroll-mt-20">
            <GapLoadingState />
          </div>
        )}

        {apiError && (
          <div className="mx-auto mt-8 flex max-w-3xl items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {apiError}
          </div>
        )}

        {!loading && data && (
          <div id="gap-results" className="mx-auto mt-8 max-w-5xl scroll-mt-20">
            <GapResults data={data} query={query} savedIds={savedIds} onSave={handleSave} />
          </div>
        )}
      </div>
    </div>
  );
}

function domainOf(url) {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch (e) { return url || ""; }
}