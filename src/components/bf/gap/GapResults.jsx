import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Search, Download, AlertCircle, ExternalLink, FileText, Bookmark, BookmarkCheck, Link2, BarChart3, Flame, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import GapDetailDialog from "./GapDetailDialog";
import GapOutreachDraft from "./GapOutreachDraft";
import { exportGapOpportunitiesToCSV } from "@/utils/csvExport";
import { formatTraffic } from "@/utils/opportunityHelpers";
import { scoreLabel, priorityBadge, priorityEmoji } from "@/utils/gapHelpers";
import { useToast } from "@/components/ui/use-toast";

const DA_OPTIONS = ["Any", "20", "30", "40", "50", "60", "70"];
const TRAFFIC_OPTIONS = ["Any", "1000", "10000", "50000", "100000"];
const TYPE_OPTIONS = ["All", "Guest Post", "Editorial", "Resource Page", "Directory", "Forum", "Profile", "Blog Link", "Broken Link"];
const PRIORITY_OPTIONS = ["All", "High", "Medium", "Low"];

export default function GapResults({ data, query, savedIds, onSave }) {
  const { toast } = useToast();
  const [filters, setFilters] = React.useState({
    minDa: "Any", minTraffic: "Any", type: "All", competitor: "All",
    priority: "All", country: "All", search: ""
  });
  const [detail, setDetail] = React.useState(null);
  const [outreach, setOutreach] = React.useState(null);

  const competitors = data.competitors || [];
  const allGaps = data.gaps || [];

  const competitorNames = ["All", ...competitors.map((c) => c.name)];

  const filtered = React.useMemo(() => {
    return allGaps.filter((g) => {
      if (filters.minDa !== "Any" && g.domain_authority < Number(filters.minDa)) return false;
      if (filters.minTraffic !== "Any" && g.traffic < Number(filters.minTraffic)) return false;
      if (filters.type !== "All" && g.backlink_type !== filters.type) return false;
      if (filters.priority !== "All" && g.priority !== filters.priority) return false;
      if (filters.country !== "All" && g.country !== filters.country) return false;
      if (filters.competitor !== "All") {
        if (!g.competitor_names || !g.competitor_names.includes(filters.competitor)) return false;
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const hay = `${g.domain} ${g.website || ""} ${g.competitor_names || ""} ${g.niche || ""} ${g.backlink_type || ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [allGaps, filters]);

  const handleExport = () => {
    const ok = exportGapOpportunitiesToCSV(filtered.map((g) => ({ ...g, website: g.website || g.domain })), "backlink-gap-opportunities.csv");
    if (ok) toast({ title: "CSV exported", description: `${filtered.length} opportunities downloaded.` });
    else toast({ title: "Nothing to export", description: "No opportunities match the current filters." });
  };

  const chartData = [
    { name: "You", domain: data.user?.domain || "You", referring: data.user?.referring_domains || 0, you: true },
    ...competitors.map((c) => ({ name: c.name, domain: c.domain, referring: c.referring_domains, you: false }))
  ];

  const statCards = [
    { label: "Backlink Opportunities", value: data.stats?.totalOpportunities ?? 0, icon: Link2 },
    { label: "Referring Domains", value: data.stats?.referringDomains ?? 0, icon: BarChart3 },
    { label: "High-Quality Opportunities", value: data.stats?.highQuality ?? 0, icon: Flame },
    { label: "Guest Post Opportunities", value: data.stats?.guestPostOpps ?? 0, icon: FileText },
    { label: "Average Domain Authority", value: data.stats?.avgDa ?? 0, icon: TrendingUp }
  ];

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      {data.is_demo && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <span className="font-semibold">Demo Mode</span> — These results are sample data. Connect a supported backlink data provider to retrieve live competitor backlink information.
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{s.label}</span>
              <s.icon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Comparison chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Backlink Profile Comparison</h3>
          {data.is_demo && <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Demo Data</span>}
        </div>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(v) => [`${v} referring domains`, ""]}
                labelFormatter={(l) => l}
              />
              <Bar dataKey="referring" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.you ? "#0f172a" : "#3b82f6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
          {chartData.map((c) => (
            <span key={c.name}><span className="font-medium text-slate-700">{c.name}</span> ({c.domain}): {c.referring} referring domains</span>
          ))}
        </div>
      </div>

      {/* Common domains */}
      {data.commonDomains && data.commonDomains.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Domains Linking to Multiple Competitors</h3>
          <p className="mt-1 text-sm text-slate-500">Prioritized by how many competitors receive links from each domain.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Domain</th>
                  <th className="px-3 py-2 text-center font-medium">Competitors</th>
                  <th className="px-3 py-2 text-center font-medium">DA</th>
                  <th className="px-3 py-2 font-medium">Opportunity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.commonDomains.map((d) => (
                  <tr key={d.domain} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2 font-medium text-slate-900">{d.domain}</td>
                    <td className="px-3 py-2 text-center text-slate-600">{d.competitor_count}/{d.numCompetitors}</td>
                    <td className="px-3 py-2 text-center text-slate-600">{d.domain_authority}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityBadge(d.priority)}`}>{priorityEmoji(d.priority)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-xs">Search opportunities</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="domain, competitor, niche..."
                value={filters.search}
                onChange={(e) => set("search", e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Domain Authority</Label>
            <Select value={filters.minDa} onValueChange={(v) => set("minDa", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{DA_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o === "Any" ? "Any" : `${o}+`}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Traffic</Label>
            <Select value={filters.minTraffic} onValueChange={(v) => set("minTraffic", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{TRAFFIC_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o === "Any" ? "Any" : `${Number(o) / 1000}K+`}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Opportunity Type</Label>
            <Select value={filters.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Competitors</Label>
            <Select value={filters.competitor} onValueChange={(v) => set("competitor", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{competitorNames.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Priority</Label>
            <Select value={filters.priority} onValueChange={(v) => set("priority", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORITY_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Export + count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-900">{filtered.length}</span> of {allGaps.length} opportunities
          {query?.keyword && <> for "<span className="font-medium text-slate-900">{query.keyword}</span>"</>}
        </p>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Results table (desktop) */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm font-medium text-slate-700">No significant backlink gaps were found.</p>
          <p className="mt-1 text-sm text-slate-500">Try adding more competitors, lowering the minimum DA, or selecting All backlink types.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Website</th>
                  <th className="px-4 py-3 font-medium">DA</th>
                  <th className="px-4 py-3 font-medium">Traffic</th>
                  <th className="px-4 py-3 font-medium">Competitor</th>
                  <th className="px-4 py-3 font-medium">Link Type</th>
                  <th className="px-4 py-3 font-medium">Relevance</th>
                  <th className="px-4 py-3 font-medium">Opportunity</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((g, i) => (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{g.domain}</div>
                      <div className="max-w-[180px] truncate text-xs text-slate-500">{g.niche}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{g.domain_authority}</td>
                    <td className="px-4 py-3 text-slate-700">{formatTraffic(g.traffic)}</td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600">{g.competitor_count}/{g.numCompetitors}</span>
                      <div className="text-xs text-slate-400">{g.competitor_names}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{g.backlink_type}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{g.relevance_score}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{g.opportunity_score}</span>
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityBadge(g.priority)}`}>{priorityEmoji(g.priority)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setDetail({ ...g })}>View</Button>
                        <Button variant="ghost" size="sm" onClick={() => onSave({ ...g })} disabled={savedIds && savedIds.has(g._gapId)}>
                          {savedIds && savedIds.has(g._gapId) ? <BookmarkCheck className="h-4 w-4 text-emerald-600" /> : <Bookmark className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Results cards (mobile) */}
          <div className="space-y-3 md:hidden">
            {filtered.map((g, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{g.domain}</p>
                  <span className="text-sm font-semibold text-slate-900">DA {g.domain_authority}</span>
                </div>
                <p className="text-xs text-slate-500">{formatTraffic(g.traffic)} traffic · {g.backlink_type}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{g.competitor_count}/{g.numCompetitors} competitors</span>
                  <span>{g.relevance_score}% relevant</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityBadge(g.priority)}`}>{priorityEmoji(g.priority)} · {g.opportunity_score}/100</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setDetail({ ...g })}>View</Button>
                    <Button variant="ghost" size="sm" onClick={() => onSave({ ...g })} disabled={savedIds && savedIds.has(g._gapId)}>
                      {savedIds && savedIds.has(g._gapId) ? <BookmarkCheck className="h-4 w-4 text-emerald-600" /> : <Bookmark className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Content gaps */}
      {data.contentGaps && data.contentGaps.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Content Opportunities</h3>
          <p className="mt-1 text-sm text-slate-500">Potential outreach opportunities — no guarantee a link will be granted.</p>
          <div className="mt-3 space-y-2">
            {data.contentGaps.map((c, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <p className="text-sm font-medium text-slate-900">{c.source_title}</p>
                <p className="mt-0.5 text-xs text-slate-500">Source: {c.domain} · DA {c.domain_authority}</p>
                <p className="mt-1 text-xs text-slate-600">{c.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Broken links */}
      {data.brokenLinks && data.brokenLinks.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Broken Link Opportunities</h3>
          <p className="mt-1 text-sm text-slate-500">Pages linking to competitors' dead content — potential replacement targets.</p>
          <div className="mt-3 space-y-2">
            {data.brokenLinks.map((b, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{b.domain}</p>
                  <a href={b.source_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                  </a>
                </div>
                <p className="mt-0.5 text-xs text-rose-600">Broken target: {b.broken_target}</p>
                <p className="mt-1 text-xs text-slate-600">{b.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <GapDetailDialog
        opportunity={detail}
        savedIds={savedIds}
        onClose={() => setDetail(null)}
        onSave={onSave}
        onOutreach={(o) => { setDetail(null); setOutreach(o); }}
      />
      <GapOutreachDraft opportunity={outreach} onClose={() => setOutreach(null)} />
    </div>
  );
}