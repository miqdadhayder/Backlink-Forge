import React from "react";
import { Link } from "react-router-dom";
import { Link2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function Header() {
  const { toast } = useToast();
  const [authed, setAuthed] = React.useState(false);

  React.useEffect(() => {
    base44.auth.isAuthenticated().then(setAuthed).catch(() => setAuthed(false));
  }, []);

  const handleSignOut = async () => {
    await base44.auth.logout();
    setAuthed(false);
  };

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Link2 className="h-4 w-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">BacklinkForge</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#tool" onClick={scrollTo("tool")} className="text-sm font-medium text-slate-600 hover:text-slate-900">Tool</a>
          <a href="#how-it-works" onClick={scrollTo("how-it-works")} className="text-sm font-medium text-slate-600 hover:text-slate-900">How It Works</a>
          <a href="#gap-finder" onClick={scrollTo("gap-finder")} className="text-sm font-medium text-slate-600 hover:text-slate-900">Backlink Gap Finder</a>
          <Link to="/sitemap-generator" className="text-sm font-medium text-slate-600 hover:text-slate-900">Sitemap Generator</Link>
          <Link to="/backlink-quality-checker" className="text-sm font-medium text-slate-600 hover:text-slate-900">Quality Checker</Link>
          <a href="#pricing" onClick={scrollTo("pricing")} className="text-sm font-medium text-slate-600 hover:text-slate-900">Pricing</a>
        </nav>

        <div className="flex items-center gap-2">
          {authed ? (
            <>
              <Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
              <Button size="sm" variant="outline" onClick={handleSignOut}>Sign out</Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
              <Link to="/register"><Button size="sm">Get Started</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}