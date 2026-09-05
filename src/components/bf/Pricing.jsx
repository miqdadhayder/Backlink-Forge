import React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    cta: "Start Free",
    to: "/register",
    features: ["10 searches/month", "10 results/search", "Basic filters"]
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    cta: "Upgrade to Pro",
    to: "/register",
    highlighted: true,
    features: ["100 searches/month", "100 results/search", "Advanced filters", "Export results", "Competitor analysis"]
  },
  {
    name: "Agency",
    price: "$99",
    period: "per month",
    cta: "Contact Sales",
    to: "/register",
    features: ["Unlimited searches", "500 results/search", "CSV export", "Advanced competitor analysis", "Priority processing"]
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Simple Pricing</h2>
          <p className="mt-3 text-slate-600">Start free. Upgrade when you need more.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border bg-white p-8 shadow-sm ${
                p.highlighted ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200"
              }`}
            >
              {p.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-slate-900">{p.price}</span>
                <span className="text-sm text-slate-500">/ {p.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/register">
                <Button className="mt-8 w-full" variant={p.highlighted ? "default" : "outline"}>
                  {p.cta}
                </Button>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}