import React from "react";
import { Link } from "react-router-dom";
import { Link2, ArrowLeft } from "lucide-react";
import Header from "@/components/bf/Header";
import Footer from "@/components/bf/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to home
        </Link>
        <div className="mt-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Link2 className="h-4 w-4" />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">About BacklinkForge</h1>
        </div>

        <div className="prose mt-8 max-w-none text-slate-600">
          <p>
            BacklinkForge is a focused SEO toolkit built to help marketers, agencies, and website owners
            strengthen their search visibility through smarter link building. The platform streamlines
            the work that usually eats up an SEO professional's day: discovering high-quality backlink and
            guest posting opportunities, understanding where competitors are earning links, and keeping a
            website's technical foundation clean for search engines.
          </p>
          <p>
            With BacklinkForge, you can search for relevant websites that accept guest posts and offer
            backlinks, filter results by domain authority and relevance, and save the opportunities worth
            pursuing. The Backlink Gap Finder compares your link profile against competitors to surface the
            domains linking to them but not to you, prioritized by opportunity score so you know exactly
            where to focus your outreach. The XML Sitemap Generator &amp; Validator crawls your site,
            respects robots.txt rules, detects indexable pages, and produces a standards-compliant sitemap —
            then validates existing sitemaps for broken URLs, redirects, and XML errors before you submit
            them to search engines.
          </p>
          <p>
            BacklinkForge is built by a small, independent product team that believes SEO tools should be
            practical, transparent, and free of clutter. Rather than bundling unrelated utilities, we keep
            the product tightly focused on link building and technical SEO essentials. We're continually
            improving the platform and working toward live integrations with leading SEO data providers so
            that the metrics you rely on reflect the real state of the web. Whether you're managing a single
            site or handling outreach for multiple clients, BacklinkForge is designed to help you find
            better links, faster.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}