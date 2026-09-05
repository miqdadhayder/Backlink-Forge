import React from "react";
import { Link } from "react-router-dom";
import { Link2, ArrowRight } from "lucide-react";

export default function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-slate-900 px-6 py-12 text-center sm:px-12">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <Link2 className="h-5 w-5 text-white" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Build a stronger backlink profile</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">Discover new link opportunities and find gaps your competitors are exploiting — all in one place.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">
            Find Backlinks <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link to="/backlink-gap-finder" className="inline-flex items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
            Find Backlink Gaps <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}