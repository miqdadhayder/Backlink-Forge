import React from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import ToolForm from "./ToolForm";
import LoadingState from "./LoadingState";
import ResultsDashboard from "./ResultsDashboard";
import GuestPostDialog from "./GuestPostDialog";
import OutreachDialog from "./OutreachDialog";
import { useAuth } from "@/lib/AuthContext";

export default function BacklinkTool() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [loadingCompetitor, setLoadingCompetitor] = React.useState(false);
  const [opportunities, setOpportunities] = React.useState([]);
  const [isDemo, setIsDemo] = React.useState(false);
  const [query, setQuery] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("all");
  const { isAuthenticated: authed } = useAuth();
  const [savedIds, setSavedIds] = React.useState(new Set());
  const [guidelines, setGuidelines] = React.useState(null);
  const [outreach, setOutreach] = React.useState(null);
  const [templates, setTemplates] = React.useState([]);
  const [apiError, setApiError] = React.useState("");

  React.useEffect(() => {
    if (authed) {
      loadSaved();
      loadTemplates();
    }
  }, [authed]);

  const loadTemplates = async () => {
    try {
      const t = await base44.entities.EmailTemplate.list("-updated_date", 100);
      setTemplates(t || []);
    } catch (e) { /* ignore */ }
  };

  const loadSaved = async () => {
    try {
      const saved = await base44.entities.SavedOpportunity.list("-created_date", 200);
      setSavedIds(new Set((saved || []).map((s) => s.opportunity_id)));
    } catch (e) { /* ignore */ }
  };

  const generate = async (params, competitor = false) => {
    setApiError("");
    const isComp = competitor || params.search_type === "competitor";
    if (isComp) setLoadingCompetitor(true); else setLoading(true);
    try {
      const res = await base44.functions.invoke("generateOpportunities", {
        ...params,
        search_type: isComp ? "competitor" : "backlinks"
      });
      const data = res.data || res;
      if (data.error) { setApiError(data.error); return; }
      const list = (data.opportunities || []).map((o) => ({
        ...o,
        _localId: `${o.website}-${o.url}`
      }));
      setOpportunities(list);
      setIsDemo(data.is_demo);
      setQuery(data.query);
      if (isComp) {
        setActiveTab("competitor");
      } else {
        setActiveTab(params.backlink_type === "Guest Posts" ? "guest" : "all");
      }
      const section = document.getElementById("results");
      if (section) setTimeout(() => section.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setApiError("We couldn't retrieve live backlink data right now. Please try again later.");
    } finally {
      setLoading(false);
      setLoadingCompetitor(false);
    }
  };

  const handleCompetitor = (competitor_url) => {
    if (!query) {
      // Need a primary search first; use the competitor as the website+niche basis.
      generate({ website_url: competitor_url, keyword: "backlinks", competitor_url }, true);
      return;
    }
    generate({ ...query, competitor_url }, true);
  };

  const handleSave = async (o) => {
    if (!authed) {
      toast({
        title: "Sign in to save",
        description: "Create a free account to save and track opportunities."
      });
      return;
    }
    const id = o._localId;
    if (savedIds.has(id)) return;
    try {
      await base44.entities.SavedOpportunity.create({
        opportunity_id: id,
        website: o.website,
        url: o.url,
        domain_authority: o.domain_authority,
        traffic: o.traffic,
        niche: o.niche,
        backlink_type: o.backlink_type,
        guest_post_available: o.guest_post_available,
        relevance_score: o.relevance_score,
        difficulty: o.difficulty
      });
      setSavedIds((prev) => new Set(prev).add(id));
      toast({ title: "Opportunity saved", description: o.website });
    } catch (e) {
      toast({ title: "Could not save", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <section id="tool" className="bg-slate-50 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl pt-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Backlink Generator</h2>
          <p className="mt-2 text-slate-600">
            Enter your website and niche to discover backlink and guest-posting opportunities.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-4xl">
          <ToolForm onGenerate={(p) => generate(p)} loading={loading} />
        </div>

        {loading && (
          <div id="results" className="mx-auto mt-8 max-w-4xl">
            <LoadingState />
          </div>
        )}

        {apiError && (
          <div className="mx-auto mt-8 max-w-4xl rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {apiError}
          </div>
        )}

        {!loading && opportunities.length > 0 && (
          <div id="results" className="mx-auto mt-8 max-w-5xl scroll-mt-20">
            <ResultsDashboard
              opportunities={opportunities}
              isDemo={isDemo}
              query={query}
              savedIds={savedIds}
              onSave={handleSave}
              onShowGuidelines={setGuidelines}
              onReachOut={setOutreach}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onCompetitorSearch={handleCompetitor}
              loadingCompetitor={loadingCompetitor}
            />
          </div>
        )}
      </div>

      <GuestPostDialog opportunity={guidelines} onClose={() => setGuidelines(null)} />
      <OutreachDialog opportunity={outreach} templates={templates} onClose={() => setOutreach(null)} />
    </section>
  );
}