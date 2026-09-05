import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Target, Plus, X, AlertCircle, Search } from "lucide-react";

const COUNTRIES = ["Global", "United States", "United Kingdom", "Canada", "Australia", "Pakistan", "India", "UAE"];
const GAP_TYPES = [
  "Guest Posts", "Editorial Links", "Resource Pages", "Directories",
  "Forums", "Profile Links", "Blog Links", "Broken Link Opportunities"
];

function normalizeUrl(u) {
  return (u || "").trim();
}
function isValidUrl(str) {
  try {
    const u = new URL(str.startsWith("http") ? str : `https://${str}`);
    return Boolean(u.hostname && u.hostname.includes("."));
  } catch (e) { return false; }
}
function hostname(u) {
  try {
    return new URL(u.startsWith("http") ? u : `https://${u}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch (e) { return (u || "").toLowerCase().replace(/^www\./, ""); }
}

export default function GapForm({ onAnalyze, loading }) {
  const [website_url, setWebsite] = React.useState("");
  const [competitors, setCompetitors] = React.useState(["", ""]);
  const [keyword, setKeyword] = React.useState("");
  const [country, setCountry] = React.useState("Global");
  const [minimum_da, setMinDa] = React.useState(20);
  const [backlink_types, setTypes] = React.useState(["All"]);
  const [error, setError] = React.useState("");

  const addCompetitor = () => {
    if (competitors.length >= 5) return;
    setCompetitors((c) => [...c, ""]);
  };
  const removeCompetitor = (i) => {
    setCompetitors((c) => c.filter((_, idx) => idx !== i));
  };
  const updateCompetitor = (i, val) => {
    setCompetitors((c) => c.map((v, idx) => (idx === i ? val : v)));
  };

  const toggleType = (t) => {
    setTypes((prev) => {
      if (t === "All") return ["All"];
      let next = prev.filter((x) => x !== "All");
      if (next.includes(t)) next = next.filter((x) => x !== t);
      else next = [...next, t];
      if (next.length === 0) next = ["All"];
      return next;
    });
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!website_url.trim() || !isValidUrl(website_url)) {
      setError("Please enter a valid website URL."); return;
    }
    const comps = competitors.map(normalizeUrl).filter(Boolean);
    if (comps.length < 1) {
      setError("Please add at least one competitor website."); return;
    }
    if (comps.length > 5) {
      setError("You can compare a maximum of 5 competitors."); return;
    }
    for (const c of comps) {
      if (!isValidUrl(c)) { setError("Please enter a valid competitor URL."); return; }
    }
    if (comps.some((c) => hostname(c) === hostname(website_url))) {
      setError("Your website cannot also be a competitor."); return;
    }
    const hosts = comps.map(hostname);
    if (new Set(hosts).size !== hosts.length) {
      setError("This competitor has already been added."); return;
    }
    onAnalyze({
      website_url: website_url.trim(),
      competitors: comps,
      keyword: keyword.trim(),
      country,
      minimum_da,
      backlink_types
    });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
          <Target className="h-4 w-4" />
        </span>
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">Backlink Gap Finder</h3>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Discover backlink opportunities your competitors already have.
      </p>

      <div className="mt-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="gap_website">Your Website *</Label>
          <Input
            id="gap_website"
            placeholder="https://yourwebsite.com"
            value={website_url}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Competitors (1–5)</Label>
          {competitors.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-20 flex-shrink-0 text-xs text-slate-500">Competitor {i + 1}</span>
              <Input
                placeholder={`https://competitor${i + 1}.com`}
                value={c}
                onChange={(e) => updateCompetitor(i, e.target.value)}
              />
              {competitors.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeCompetitor(i)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {competitors.length < 5 && (
            <Button type="button" variant="outline" size="sm" onClick={addCompetitor}>
              <Plus className="mr-2 h-4 w-4" /> Add Competitor
            </Button>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="gap_keyword">Target Keyword or Niche (optional)</Label>
            <Input
              id="gap_keyword"
              placeholder="e.g. digital marketing, AI tools"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Minimum Domain Authority</Label>
            <span className="text-sm font-semibold text-slate-900">{minimum_da}</span>
          </div>
          <Slider value={[minimum_da]} min={0} max={90} step={1} onValueChange={(v) => setMinDa(v[0])} />
        </div>

        <div className="space-y-2">
          <Label>Backlink Type</Label>
          <div className="flex flex-wrap gap-2">
            {["All", ...GAP_TYPES].map((t) => {
              const active = backlink_types.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="mt-6">
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          <Search className="mr-2 h-4 w-4" />
          {loading ? "Analyzing…" : "Find My Backlink Gaps"}
        </Button>
      </div>
    </form>
  );
}