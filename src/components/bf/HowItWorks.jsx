import React from "react";

const STEPS = [
  {
    num: "01",
    title: "Enter Your Website",
    desc: "Add your website and target niche to define where you want backlinks."
  },
  {
    num: "02",
    title: "Generate Opportunities",
    desc: "Our system analyzes potential backlink and guest-posting opportunities."
  },
  {
    num: "03",
    title: "Build Better Links",
    desc: "Review opportunities and visit relevant websites to start outreach."
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">How It Works</h2>
          <p className="mt-3 text-slate-600">Three simple steps to better link-building.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.num} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8">
              <span className="text-sm font-semibold text-indigo-600">{s.num}</span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}