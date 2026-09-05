import React from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const GLOSSARY = {
  DoFollow: "A link with no nofollow/sponsored/ugc attribute. Search engines may follow it and pass link equity.",
  NoFollow: "A rel=\"nofollow\" link. Search engines are told not to pass equity, but it can still bring referral traffic.",
  Sponsored: "rel=\"sponsored\" marks a paid or affiliate link and is not counted as an editorial vote.",
  UGC: "rel=\"ugc\" marks user-generated content links (e.g. comments, forums).",
  "Anchor Text": "The clickable text of a link. It tells users and search engines what the linked page is about.",
  "Referring Domain": "The domain that links to your site. One quality link per referring domain is ideal.",
  Indexability: "Whether a page can be crawled and added to a search engine's index (no robots/noindex blocks).",
  "Link Placement": "Where the link sits on the page. In-content links are most valuable; footer links least.",
  "Topical Relevance": "How closely the source page's topic matches the target page's topic.",
  "Spam Signals": "Patterns that suggest low-quality or manipulative linking (hidden links, thin content, etc.)."
};

export default function InfoTip({ term }) {
  const text = GLOSSARY[term] || term;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={`What is ${term}`} className="ml-1 inline-flex align-middle text-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 rounded">
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  );
}