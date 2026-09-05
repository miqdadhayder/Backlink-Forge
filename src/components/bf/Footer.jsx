import React from "react";
import { Link2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Link2 className="h-3.5 w-3.5" />
            </span>
            <span className="font-semibold text-slate-900">BacklinkForge</span>
          </div>
          <p className="text-sm text-slate-500">
            Find Better Backlinks. Discover Guest Posting Opportunities.
          </p>
          <div className="flex items-center gap-5 text-sm text-slate-500">
            <a href="#tool" className="hover:text-slate-900">Tool</a>
            <a href="#how-it-works" className="hover:text-slate-900">How It Works</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <Link to="/about" className="hover:text-slate-900">About</Link>
            <Link to="/contact" className="hover:text-slate-900">Contact</Link>
            <Link to="/backlink-quality-checker" className="hover:text-slate-900">Quality Checker</Link>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} BacklinkForge. Demo metrics shown until a live SEO data provider is connected.
        </p>
      </div>
    </footer>
  );
}