// ============================================================
// lib/slugs.ts
// Robust instrument slug mapping for URLs
// E.g., "GBP/JPY" <-> "gbp-jpy", "WTI Crude" <-> "wti-crude"
// ============================================================

export function toSlug(instrument: string): string {
  if (!instrument) return "";
  return instrument.trim().toLowerCase().replace(/[\/\s_]+/g, "-");
}

export function fromSlug(slug: string): string {
  if (!slug) return "";
  const parts = slug.toUpperCase().split("-");
  
  // Known single-word instruments
  const singleWords = ["US500", "US30", "UK100", "GER40", "JPN225", "AUS200", "HK50", "FRA40", "SWI20", "COPPER"];
  
  if (parts.length === 1) {
    if (singleWords.includes(parts[0])) return parts[0];
    // if it looks like a 6 char pair without a separator (e.g. eurusd)
    if (parts[0].length === 6) {
      return `${parts[0].substring(0,3)}/${parts[0].substring(3)}`;
    }
    return parts[0];
  }

  // Handle standard FOREX/CRYPTO e.g. GBP-JPY -> GBP/JPY
  if (parts.length === 2 && parts[0].length >= 2 && parts[1].length >= 2) {
    // Exception for commodities like "WTI Crude"
    if (parts[0] === "WTI" && parts[1] === "CRUDE") return "WTI Crude";
    if (parts[0] === "BRENT" && parts[1] === "CRUDE") return "Brent Crude";
    if (parts[0] === "NATURAL" && parts[1] === "GAS") return "Natural Gas";
    
    return `${parts[0]}/${parts[1]}`;
  }

  // Fallback for complex slugs
  return parts.join(" ");
}
