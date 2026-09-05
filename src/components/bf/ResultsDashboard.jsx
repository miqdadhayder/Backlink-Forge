import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Search, Download, AlertCircle } from "lucide-react";
import OpportunityTable from "./OpportunityTable";
import { exportOpportunitiesToCSV } from "@/utils/csvExport";
import { useToast } from "@/components/ui/use-toast";

const TYPE_OPTIONS = [
  "All", "Guest Post", "Resource Page", "Business Directory", "Profile Link",
  "Blog Comment", "Forum", "Broken Link", "Competitor Opportunity"
];
const DIFFICULTY_OPTIONS = ["All", "Easy", "Medium", "Hard"];

export default function ResultsDashboard({
  opportunities, isDemo, query, savedIds, onSave, onShowGuidelines, onReachOut,
  activeTab, onTabChange, onCompetitorSearch, loadingCompetitor
}) {
  const { toast } = useToast();
  const [filters, setFilters] = React.useState({
    minDa: 0, minTraffic: 0, country: "All", type: "All", difficulty: "All", search: ""
  });

  const filtered = React.useMemo(() => {
    return opportunities.filter((o) => {
      if (o.domain_authority < filters.minDa) return false;
      if (o.traffic < filters.minTraffic) return false;
      if (filters.country !== "All" && o.country !== filters.country) return false;
      if (filters.type !== "All" && o.backlink_type !== filters.type) return false;
      if (filters.difficulty !== "All" && o.difficulty !== filters.difficulty) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (!o.website.toLowerCase().includes(s) && !o.url.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [opportunities, filters]);

  const guestPostOnly = filtered.filter((o) => o.guest_post_available);
  const competitorOnly = filtered.filter((o) => o.backlink_type === "Competitor Opportunity");

  const handleExport = () => {
    const ok = exportOpportunitiesToCSV(filtered);
    if (ok) toast({ title: "CSV exported", description: `${filtered.length} opportunities downloaded.` });
  };

  const TABS = [
    { id: "all", label: "All Opportunities", count: filtered.length },
    { id: "guest", label: "Guest Posting Opportunities", count: guestPostOnly.length },
    { id: "competitor", label: "Competitor Analysis", count: competitorOnly.length }
  ];

  let list = filtered;
  if (activeTab === "guest") list = guestPostOnly;
  if (activeTab === "competitor") list = competitorOnly;

  return (
    <div className="space-y-5">
      {isDemo && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <span className="font-semibold">Demo Data</span> — Connect a backlink data provider to retrieve live results.
            The architecture supports Moz, Ahrefs, SERP API, and DataForSEO — add an API key in server settings to go live.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`relative -mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              activeTab === t.id
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {t.label}
            <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{t.count}</span>
          </button>
        ))}
      </div>

      {activeTab === "competitor" && (
        <CompetitorPanel onSearch={onCompetitorSearch} loading={loadingCompetitor} />
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-6">
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filter websites..."
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Link Type</Label>
            <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Difficulty</Label>
            <Select value={filters.difficulty} onValueChange={(v) => setFilters((f) => ({ ...f, difficulty: v }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIFFICULTY_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Country</Label>
            <Select value={filters.country} onValueChange={(v) => setFilters((f) => ({ ...f, country: v }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {["Global", "USA", "UK", "Canada", "Australia", "Pakistan", "India", "UAE"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Min DA</Label>
              <span className="text-xs font-medium">{filters.minDa}</span>
            </div>
            <Slider value={[filters.minDa]} min={0} max={90} onValueChange={(v) => setFilters((f) => ({ ...f, minDa: v[0] }))} />
          </div>
        </div>
      </div>

      {/* Export + count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-900">{list.length}</span> opportunities
          {query?.keyword && <> for "<span className="font-medium text-slate-900">{query.keyword}</span>"</>}
        </p>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={list.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <OpportunityTable
        opportunities={list}
        savedIds={savedIds}
        onSave={onSave}
        onShowGuidelines={onShowGuidelines}
        onReachOut={onReachOut}
      />
    </div>
  );
}

function CompetitorPanel({ onSearch, loading }) {
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState("");

  const submit = (e) => {
    e.preventDefault();
    setError("");
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      if (!u.hostname.includes(".")) throw new Error("invalid");
      onSearch(url.trim());
    } catch (err) {
      setError("Please enter a valid competitor URL.");
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-6">
      <h3 className="text-base font-semibold text-slate-900">Analyze Competitor</h3>
      <p className="mt-1 text-sm text-slate-600">
        Enter a competitor's URL to discover websites linking to them — opportunities you may also pursue.
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="https://competitor.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button type="submit" disabled={loading} className="sm:w-auto">
          {loading ? "Analyzing…" : "Find Their Backlink Opportunities"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      <p className="mt-3 text-xs text-slate-500">
        Without a live backlink API, results are labeled as demo data.
      </p>
    </div>
  );
}