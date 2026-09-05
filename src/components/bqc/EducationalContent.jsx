import React from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import InfoTip from "./infoTip";

const FAQS = [
  { q: "What is a backlink quality score?", a: "A backlink quality score is a 0–100 summary of how valuable a link is likely to be for SEO, based on factors like relevance, link placement, the rel attribute, page quality, indexability, and risk signals. BacklinkForge only scores signals it can verify or explicitly estimates — it never invents authority or traffic numbers." },
  { q: "What makes a backlink high quality?", a: "A high-quality backlink usually comes from a topically relevant page, sits within the main content, uses a natural anchor, is on an indexable page, and carries no obvious spam signals. Contextual, editorial links inside genuine articles tend to be the most valuable." },
  { q: "Are nofollow links worthless?", a: "No. A nofollow link does not pass direct link equity, but it can still drive real referral traffic, expose your brand to new audiences, and contribute to a natural-looking link profile. Many large sites use nofollow on outbound links by default." },
  { q: "How can I tell if a backlink is risky?", a: "Look for signals like hidden links, links on thin or low-quality pages, excessive outbound links, noindex directives, cross-domain redirects, or generic/unnatural anchor text repeated across many pages. A single weak signal is not proof of toxicity — review the broader context." },
  { q: "Should I remove low-quality backlinks?", a: "Only after manual review. Removing or disavowing links is a serious step. Use the risk analysis as a starting point, then inspect the source page yourself. BacklinkForge never recommends disavowing based solely on an automated score." },
  { q: "What is a good backlink?", a: "A good backlink is a relevant, editorial link from an indexable, content-rich page, using descriptive anchor text and showing no manipulative signals. It looks natural and provides genuine value to readers." },
  { q: "Does domain authority determine backlink quality?", a: "Domain authority is one useful signal, but it is not the whole picture. A link from a high-authority but irrelevant page may be worth less than a contextual link from a smaller, highly relevant site. Authority metrics also require a paid data provider to measure accurately." },
  { q: "How important is topical relevance?", a: "Topical relevance is one of the strongest quality signals. A link from a page that genuinely discusses your subject carries more weight than a link from an unrelated site, even if the unrelated site is more popular overall." },
  { q: "What is anchor text?", a: "Anchor text is the clickable wording of a link. It tells both users and search engines what the linked page is about. Branded and partial-match anchors tend to look natural; overusing exact-match anchors can look manipulative." },
  { q: "How often should I check my backlinks?", a: "Most sites benefit from a review every few weeks or monthly. New links should be checked sooner, and any link flagged with risk signals deserves a closer manual look." }
];

function Faq({ faq, i }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-slate-100">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between py-4 text-left" aria-expanded={open}>
        <span className="text-sm font-medium text-slate-900">{faq.q}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-slate-600">{faq.a}</p>}
    </div>
  );
}

export default function EducationalContent() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Backlink Quality Checker</h1>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">What Is a Backlink Quality Checker?</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">A backlink quality checker evaluates a single backlink against publicly verifiable SEO signals — where the link is placed, what attribute it carries, how relevant the source page is, whether the page is indexable, and whether any risk patterns are present. Rather than guessing at hidden authority scores, BacklinkForge reads what the source page actually exposes and clearly separates verified data from values it could not retrieve.</p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">How to Check the Quality of a Backlink</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">Enter the source page URL (and optionally your target page and anchor text), then click Analyze. The tool fetches the live page, looks for the link to your domain, and grades each factor it can verify. Focus first on relevance and link placement, then review the risk section for anything suspicious before deciding whether to keep or investigate the link.</p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">What Makes a Backlink Valuable?</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">The most valuable backlinks are contextual and editorial — placed inside genuinely useful content by someone who chose to link to you. Relevance matters more than raw popularity: a link from a smaller site in your niche often outperforms an irrelevant link from a large site. A descriptive, natural anchor and an indexable source page complete the picture.</p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">DoFollow vs NoFollow Backlinks <InfoTip term="DoFollow" /></h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">A <strong>dofollow</strong> link has no special rel attribute and may pass link equity. A <strong>nofollow</strong> link carries rel="nofollow", telling search engines not to vouch for the target. Sponsored and UGC attributes mark paid or user-generated links. None of these are inherently bad — they simply describe intent. BacklinkForge detects the attribute from the page's HTML rather than assuming.</p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">How Anchor Text Affects Backlink Quality <InfoTip term="Anchor Text" /></h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">Anchor text gives context to a link. Branded and partial-match anchors look natural and trustworthy. Exact-match anchors can help when used sparingly, but repeated identical anchors across many sites can look manipulative. Generic anchors like "click here" add little topical signal but aren't harmful on their own.</p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">How to Identify Low-Quality Backlinks <InfoTip term="Spam Signals" /></h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">Warning signs include links placed in footers or sidebars across an entire site, hidden links, thin pages with little real content, pages stuffed with dozens of outbound links, noindex directives, and cross-domain redirects. A single signal is rarely conclusive — look for several signals together before judging a link.</p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Are All Backlinks Good for SEO?</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">No. Not every backlink helps rankings. Irrelevant, low-quality, or manipulative links can be ignored by search engines or, in extreme cases, contribute to a penalty risk. The goal is a natural, relevant, and diverse link profile — not simply as many links as possible.</p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="text-sm font-semibold text-slate-900">Related BacklinkForge tools</h3>
        <p className="mt-2 text-sm text-slate-600">Want to discover new backlink opportunities? <Link to="/" className="font-medium text-slate-900 underline">Try Backlink Finder</Link>. Already have a link profile? <Link to="/backlink-gap-finder" className="font-medium text-slate-900 underline">Find backlink gaps against competitors →</Link></p>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">Frequently Asked Questions</h2>
      <div className="mt-2">
        {FAQS.map((f, i) => <Faq key={i} faq={f} i={i} />)}
      </div>
    </section>
  );
}