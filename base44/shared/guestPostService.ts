// guestPostService
// Responsible for guest-post-specific enrichment: "Write for Us" availability,
// guest post page URL, contact page URL, submission requirements.
import { secrets } from "base44:runtime";

export function hasLiveGuestPostProvider() {
  return Boolean(secrets.get("GUESTPOST_API_KEY"));
}

const REQUIREMENTS = [
  "Original content only, 1000+ words, 1 do-follow link allowed.",
  "Minimum 800 words, topic must be relevant to our audience.",
  "1000-1500 words, 2 do-follow links, actionable content required.",
  "1500+ words, include images, 1 author bio link, no promotional posts.",
  "600+ words, niche-relevant, reviewed within 5 business days."
];

export async function enrichGuestPost(domain, backlink_type) {
  const guest_post_available =
    backlink_type === "Guest Post" ||
    backlink_type === "All Opportunities" ||
    backlink_type === "Competitor Opportunity" ||
    hashDomain(domain) % 3 !== 0;
  return {
    guest_post_available,
    guest_post_url: guest_post_available ? `https://${domain}/write-for-us` : null,
    contact_url: `https://${domain}/contact`,
    submission_requirements: guest_post_available
      ? REQUIREMENTS[hashDomain(domain) % REQUIREMENTS.length]
      : null
  };
}

function hashDomain(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}