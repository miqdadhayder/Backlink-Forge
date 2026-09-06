// domainMetricsService
// Responsible for Domain Authority / traffic estimates.
// When a real provider key (e.g. MOZ_API_KEY, AHREFS_API_KEY) is available,
// call the live API here. Otherwise return deterministic demo metrics.
import { secrets } from "./envSecrets.ts";

export function hasLiveMetricsProvider() {
  return Boolean(secrets.get("MOZ_API_KEY") || secrets.get("AHREFS_API_KEY"));
}

// Deterministic pseudo-random so the same domain always returns the same metrics.
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export async function getDomainMetrics(domain, niche) {
  if (hasLiveMetricsProvider()) {
    // TODO: call Moz/Ahrefs API using secrets.get("MOZ_API_KEY")
    // For now the key may be set but integration wiring is not yet implemented,
    // so we still fall through to deterministic demo metrics.
  }
  const seed = hashString(domain);
  const domain_authority = 15 + (seed % 80); // 15 - 94
  const trafficBase = 500 + (seed % 90000);
  const traffic = Math.round(trafficBase / 100) * 100;
  return {
    domain_authority,
    traffic,
    source: "demo"
  };
}