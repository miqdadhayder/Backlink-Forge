import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Search as SearchIcon, Bookmark, Link2, TrendingUp, BarChart3,
  User, ArrowLeft, Mail, Target, History as HistoryIcon, FileCode2
} from "lucide-react";
import moment from "moment";
import { exportOpportunitiesToCSV } from "@/utils/csvExport";
import { formatTraffic } from "@/utils/opportunityHelpers";
import TemplateManager from "@/components/bf/TemplateManager";
import { GapFinderCTA, GapHistory, SavedGaps } from "@/components/bf/gap/DashboardGapSections";
import { SitemapTab } from "@/components/bf/sitemap/SitemapDashboardSections";
import { validatePassword } from "@/lib/authValidation";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "searches", label: "Backlink Generator", icon: SearchIcon },
  { id: "guestposts", label: "Guest Post Finder", icon: Link2 },
  { id: "gapfinder", label: "Backlink Gap Finder", icon: Target },
  { id: "sitemap", label: "XML Sitemap Generator", icon: FileCode2 },
  { id: "saved", label: "Saved Opportunities", icon: Bookmark },
  { id: "savedgaps", label: "Saved Gap Opportunities", icon: Bookmark },
  { id: "history", label: "Search History", icon: HistoryIcon },
  { id: "templates", label: "Templates", icon: Mail },
  { id: "usage", label: "Usage", icon: TrendingUp },
  { id: "account", label: "Account", icon: User }
];

export default function Dashboard() {
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [user, setUser] = React.useState(authUser);
  const [searches, setSearches] = React.useState([]);
  const [saved, setSaved] = React.useState([]);
  const [templates, setTemplates] = React.useState([]);
  const [gapAnalyses, setGapAnalyses] = React.useState([]);
  const [savedGaps, setSavedGaps] = React.useState([]);
  const [sitemapAnalyses, setSitemapAnalyses] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState("overview");

  React.useEffect(() => {
    (async () => {
      try {
        setUser(authUser);
        const [s, sv, tp, ga, sg, sm] = await Promise.all([
          base44.entities.Search.list("-created_date", 100).catch(() => []),
          base44.entities.SavedOpportunity.list("-created_date", 200).catch(() => []),
          base44.entities.EmailTemplate.list("-updated_date", 100).catch(() => []),
          base44.entities.BacklinkGapAnalysis.list("-created_date", 100).catch(() => []),
          base44.entities.SavedGapOpportunity.list("-created_date", 200).catch(() => []),
          base44.entities.SitemapAnalysis.list("-created_date", 100).catch(() => [])
        ]);
        setSearches(s || []);
        setSaved(sv || []);
        setTemplates(tp || []);
        setGapAnalyses(ga || []);
        setSavedGaps(sg || []);
        setSitemapAnalyses(sm || []);
      } catch (e) { /* data loading is best effort while the Neon API migration is in progress */ }
    })();
  }, [authUser]);

  const totalOpps = React.useMemo(
    () => searches.reduce((sum, s) => sum + (s.opportunities_found || 0), 0),
    [searches]
  );
  const guestPostSaved = saved.filter((s) => s.guest_post_available);

  const handleExport = () => {
    if (saved.length === 0) {
      toast({ title: "Nothing to export", description: "Save some opportunities first." });
      return;
    }
    exportOpportunitiesToCSV(saved, "saved-opportunities.csv");
    toast({ title: "CSV exported", description: `${saved.length} saved opportunities downloaded.` });
  };

  const loadTemplates = async () => {
    try {
      const t = await base44.entities.EmailTemplate.list("-updated_date", 100);
      setTemplates(t || []);
    } catch (e) { /* ignore */ }
  };

  const loadSavedGaps = async () => {
    try {
      const sg = await base44.entities.SavedGapOpportunity.list("-created_date", 200);
      setSavedGaps(sg || []);
    } catch (e) { /* ignore */ }
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
          <Button variant="outline" size="sm" onClick={handleSignOut}>Sign out</Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
            <ArrowLeft className="inline h-4 w-4" /> Back to tool
          </Link>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back{user?.full_name ? `, ${user.full_name}` : ""}.</p>

        <div className="mt-6 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === t.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "overview" && <Overview searches={searches} saved={saved} totalOpps={totalOpps} guestPostSaved={guestPostSaved} sitemapAnalyses={sitemapAnalyses} />}
          {activeTab === "searches" && <SearchesTab searches={searches} />}
          {activeTab === "saved" && <SavedTab saved={saved} onExport={handleExport} />}
          {activeTab === "guestposts" && <SavedTab saved={guestPostSaved} title="Guest Posting Opportunities" onExport={handleExport} />}
          {activeTab === "gapfinder" && <GapFinderCTA analysesCount={gapAnalyses.length} />}
          {activeTab === "sitemap" && <SitemapTab analyses={sitemapAnalyses} />}
          {activeTab === "savedgaps" && <SavedGaps saved={savedGaps} onReload={loadSavedGaps} />}
          {activeTab === "history" && <GapHistory analyses={gapAnalyses} />}
          {activeTab === "templates" && <TemplateManager templates={templates} onReload={loadTemplates} />}
          {activeTab === "usage" && <UsageTab searches={searches} />}
          {activeTab === "account" && <AccountTab user={user} onSignOut={handleSignOut} />}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
    </div>
  );
}

function Overview({ searches, saved, totalOpps, guestPostSaved, sitemapAnalyses }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Searches Used" value={searches.length} icon={SearchIcon} />
        <StatCard label="Opportunities Found" value={totalOpps} icon={BarChart3} />
        <StatCard label="Saved Opportunities" value={saved.length} icon={Bookmark} />
        <StatCard label="Guest Posting Opportunities" value={guestPostSaved.length} icon={Link2} />
        <StatCard label="Sitemap Analyses" value={sitemapAnalyses.length} icon={FileCode2} />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Recent Searches</h3>
        {searches.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No searches yet. <Link to="/" className="font-medium text-slate-900 underline">Run your first search</Link>.</p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100">
            {searches.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{s.keyword}</p>
                  <p className="text-xs text-slate-500">{s.website_url} · {s.country} · {s.backlink_type}</p>
                </div>
                <span className="text-sm text-slate-600">{s.opportunities_found || 0} results</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchesTab({ searches }) {
  if (searches.length === 0) return <Empty label="No backlink searches yet." />;
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Keyword</th>
            <th className="px-4 py-3 font-medium">Website</th>
            <th className="px-4 py-3 font-medium">Country</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Min DA</th>
            <th className="px-4 py-3 font-medium">Results</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {searches.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 font-medium text-slate-900">{s.keyword}</td>
              <td className="px-4 py-3 text-slate-600">{s.website_url}</td>
              <td className="px-4 py-3 text-slate-600">{s.country}</td>
              <td className="px-4 py-3 text-slate-600">{s.backlink_type}</td>
              <td className="px-4 py-3 text-slate-600">{s.minimum_da}</td>
              <td className="px-4 py-3 text-slate-600">{s.opportunities_found || 0}</td>
              <td className="px-4 py-3 text-slate-500">{moment(s.created_date).format("MMM D")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SavedTab({ saved, title = "Saved Opportunities", onExport }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <Button variant="outline" size="sm" onClick={onExport} disabled={saved.length === 0}>Export CSV</Button>
      </div>
      {saved.length === 0 ? <Empty label="No saved opportunities yet. Save opportunities from the tool." /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900">{s.website}</p>
                <span className="text-sm font-semibold text-slate-900">{s.domain_authority}</span>
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">{s.url}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s.backlink_type}</span>
                {s.guest_post_available && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">Guest Post</span>}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{formatTraffic(s.traffic)} traffic</span>
                <span>{s.relevance_score}% relevant</span>
              </div>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="mt-3 w-full">Visit Website</Button>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsageTab({ searches }) {
  const used = searches.length;
  const limit = 10;
  const remaining = Math.max(0, limit - used);
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Plan: Free</h3>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Searches used this month</span>
            <span className="font-medium text-slate-900">{used} / {limit}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-slate-900" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">{remaining} searches remaining. Upgrade for more.</p>
        </div>
      </div>
    </div>
  );
}

function AccountTab({ user, onSignOut }) {
  const [displayName, setDisplayName] = React.useState(user?.display_name || "");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const updateProfile = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!displayName.trim()) {
      setError("Enter a display name.");
      return;
    }
    setSaving(true);
    try {
      await supabase.auth.updateUser({ data: { full_name: displayName.trim() } });
      setMessage("Profile updated.");
    } catch (err) {
      setError(err.message || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await supabase.auth.updateUser({ password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed successfully.");
    } catch (err) {
      setError(err.message || "Could not change your password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid max-w-2xl gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Account</h3>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="text-slate-900">{user?.display_name || user?.full_name || "—"}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="text-slate-900">{user?.email || "—"}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Email verified</dt><dd className="text-slate-900">{user?.is_verified ? "Yes" : "No"}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Role</dt><dd className="text-slate-900">{user?.role || "user"}</dd></div>
      </dl>
      <Button variant="outline" className="mt-6" onClick={onSignOut}>Sign out</Button>
      </div>
      <div className="space-y-6">
        <form onSubmit={updateProfile} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Profile</h3>
          <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="display-name">Display name</label>
          <input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
          <Button type="submit" className="mt-4" disabled={saving}>Save profile</Button>
        </form>
        <form onSubmit={changePassword} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Change password</h3>
          <input aria-label="Current password" type="password" autoComplete="current-password" placeholder="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-4 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" required />
          <input aria-label="New password" type="password" autoComplete="new-password" placeholder="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-3 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" required />
          <input aria-label="Confirm new password" type="password" autoComplete="new-password" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-3 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" required />
          <Button type="submit" className="mt-4" disabled={saving}>Change password</Button>
        </form>
        {(message || error) && <p className={`text-sm ${error ? "text-rose-600" : "text-emerald-600"}`} role="status">{error || message}</p>}
      </div>
    </div>
  );
}

function Empty({ label }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}