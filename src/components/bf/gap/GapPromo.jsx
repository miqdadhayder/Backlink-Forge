import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight } from "lucide-react";

export default function GapPromo() {
  const navigate = useNavigate();
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              <Target className="h-3.5 w-3.5" /> New
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Discover Your Competitors' Backlink Gaps
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Stop guessing where to build backlinks. Find domains that already link to your competitors
              and identify potential opportunities for your own website.
            </p>
            <div className="mt-6">
              <Button size="lg" onClick={() => navigate("/backlink-gap-finder")}>
                Try Backlink Gap Finder <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Compare up to 5 competitors · Opportunity scoring · Export to CSV
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Opportunities", value: "247" },
                { label: "Referring Domains", value: "86" },
                { label: "High Quality", value: "34" }
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                  <div className="text-2xl font-semibold text-slate-900">{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {[
                { d: "marketinghub.com", da: 72, p: "High", n: "3/5" },
                { d: "techblog.com", da: 65, p: "High", n: "3/5" },
                { d: "contentloop.com", da: 51, p: "Medium", n: "2/5" }
              ].map((r) => (
                <div key={r.d} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <span className="font-medium text-slate-800">{r.d}</span>
                  <span className="text-slate-500">DA {r.da}</span>
                  <span className="text-slate-500">{r.n}</span>
                  <span className={r.p === "High" ? "rounded bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600" : "rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600"}>
                    {r.p === "High" ? "🔥 High" : "🟡 Medium"}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">Preview — sample data shown for illustration.</p>
          </div>
        </div>
      </div>
    </section>
  );
}