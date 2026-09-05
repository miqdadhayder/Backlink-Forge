// Decides whether a crawled URL is indexable / should be included in the sitemap.

export interface IndexDecision {
  indexable: boolean;
  included: boolean;
  reason: string | null;
}

export function decideIndexable(opts: {
  statusCode: number;
  isRedirect: boolean;
  contentType: string;
  canonical: string | null;
  selfUrl: string;
  noindex: boolean;
  includeNonHtml: boolean;
}): IndexDecision {
  const { statusCode, isRedirect, contentType, canonical, selfUrl, noindex, includeNonHtml } = opts;
  const isHtml = /text\/html|application\/xhtml/i.test(contentType);
  if (statusCode === 0) return { indexable: false, included: false, reason: "Unreachable" };
  if (statusCode >= 500) return { indexable: false, included: false, reason: `Server error (${statusCode})` };
  if (statusCode >= 400) return { indexable: false, included: false, reason: `Client error (${statusCode})` };
  if (isRedirect) return { indexable: false, included: false, reason: "Redirect" };
  if (noindex) return { indexable: false, included: false, reason: "noindex directive" };
  if (canonical && canonical !== selfUrl) {
    return { indexable: false, included: false, reason: "Canonical points elsewhere" };
  }
  if (!isHtml && !includeNonHtml) {
    return { indexable: false, included: false, reason: "Non-HTML (excluded by settings)" };
  }
  return { indexable: true, included: true, reason: null };
}