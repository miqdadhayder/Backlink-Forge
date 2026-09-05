import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileCode2, ArrowRight, Bot, FileText, CheckCircle2 } from "lucide-react";

export default function SitemapPromo() {
  const navigate = useNavigate();
  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              <FileCode2 className="h-3.5 w-3.5" /> New
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Generate & Validate XML Sitemaps
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Crawl your website, discover indexable pages, and produce a clean, standards-compliant
              XML sitemap. Validate existing sitemaps for broken URLs, redirects, and errors before
              submitting to search engines.
            </p>
            <div className="mt-6">
              <Button size="lg" onClick={() => navigate("/sitemap-generator")}>
                Open Sitemap Generator <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Real website crawl with robots.txt support</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Indexability &amp; canonical detection</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Sitemap validation with health score</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-300">
              <div className="text-slate-500">&lt;?xml version="1.0" encoding="UTF-8"?&gt;</div>
              <div>&lt;urlset xmlns="http://www.sitemaps.org/<wbr/>schemas/sitemap/0.9"&gt;</div>
              <div className="pl-3">&lt;url&gt;</div>
              <div className="pl-6">&lt;loc&gt;https://example.com/&lt;/loc&gt;</div>
              <div className="pl-3">&lt;/url&gt;</div>
              <div className="pl-3">&lt;url&gt;</div>
              <div className="pl-6">&lt;loc&gt;https://example.com/about&lt;/loc&gt;</div>
              <div className="pl-3">&lt;/url&gt;</div>
              <div>&lt;/urlset&gt;</div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Feature icon={Bot} label="Robots.txt aware" />
              <Feature icon={FileText} label="XML + CSV export" />
              <Feature icon={CheckCircle2} label="Issue reports" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon: Icon, label }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-slate-500" />
      <div className="mt-1 text-xs text-slate-600">{label}</div>
    </div>
  );
}