export interface ParsedBet {
  team: string;
  betType: "spread" | "moneyline" | "total";
  line: number;
  odds: number;
  amount: number;
  side?: "over" | "under";
  raw: string;
  confidence: "high" | "medium" | "low";
}

// Words that are never part of a team name
const NOISE_WORDS = new Set([
  "on", "for", "vs", "at", "the", "a", "an", "bet", "my", "take", "me",
  "give", "put", "lay", "play", "taking", "laying", "got", "going", "with",
  "to", "and", "or", "in", "of", "by", "is", "it",
  // Informal money words
  "bucks", "buck", "dollars", "dollar", "bux",
]);

// Explicit bet-type keywords
const MONEYLINE_WORDS = /\b(ml|moneyline|money\s*line|straight\s*up|su)\b/i;
const SPREAD_WORDS = /\b(spread|ats|against\s*the\s*spread)\b/i;
const TOTAL_WORDS = /\b(total|over|under|o\/u|ou)\b/i;
const OVER_WORDS = /\b(over|ov?r?)\b/i;
const UNDER_WORDS = /\b(under|un?d?)\b/i;
const PICKEM_WORDS = /\b(pk|pick|pick\s*em|pickem|even)\b/i;
const PARLAY_WORDS = /\b(parlay|teaser|if\s*bet)\b/i;

export function parseBet(text: string): ParsedBet | null {
  if (!text || text.trim().length === 0) return null;

  const raw = text.trim();

  // ── 1. Amount ────────────────────────────────────────────────────────────
  // Match $50, $ 50, $50.50, or a bare number preceded by "for"/"bet"/"@"
  let amount: number | null = null;
  let workingText = raw;

  const dollarMatch = raw.match(/\$\s*(\d{1,6}(?:\.\d{1,2})?)/);
  if (dollarMatch) {
    amount = parseFloat(dollarMatch[1]);
    workingText = workingText.replace(dollarMatch[0], " ");
  }

  // ── 2. Detect keyword-based bet type ──────────────────────────────────────
  const hasMLKeyword  = MONEYLINE_WORDS.test(raw);
  const hasSpreadKeyword = SPREAD_WORDS.test(raw);
  const hasTotalKeyword  = TOTAL_WORDS.test(raw);
  const hasOver   = OVER_WORDS.test(raw);
  const hasUnder  = UNDER_WORDS.test(raw);
  const hasPK     = PICKEM_WORDS.test(raw);

  // ── 3. Extract all numeric tokens ─────────────────────────────────────────
  // We tag each number as: dollar-amount (already handled), signed, or bare
  //   signed  : +7, -4.5, -110, +150
  //   bare    : 50, 220.5 (no $ or +/- prefix in context)

  interface NumToken { raw: string; value: number; index: number; kind: "signed" | "bare" }
  const numTokens: NumToken[] = [];

  // Signed numbers (could be spread, odds, or total line with sign)
  const signedRe = /([+-]\d+(?:\.\d+)?)/g;
  let sm: RegExpExecArray | null;
  while ((sm = signedRe.exec(workingText)) !== null) {
    numTokens.push({ raw: sm[1], value: parseFloat(sm[1]), index: sm.index, kind: "signed" });
  }

  // Bare numbers (not preceded by $, +/-, digit, or decimal point)
  const bareRe = /(?<![+\-$\d.])(\d+(?:\.\d+)?)(?!\s*(?:st|nd|rd|th))/g;
  let bm: RegExpExecArray | null;
  while ((bm = bareRe.exec(workingText)) !== null) {
    numTokens.push({ raw: bm[1], value: parseFloat(bm[1]), index: bm.index, kind: "bare" });
  }

  // ── 4. Classify numeric tokens ────────────────────────────────────────────
  // American odds: signed integer with |value| >= 100  (e.g. -110, +150, -200, +450)
  //   Exception: a value like -105 looks like odds, not a spread
  // Spread: signed number with |value| < 50  (e.g. -4.5, +7, -3)
  // Total line: bare/signed decimal around 100–300 range (e.g. 220.5, 47.5)
  // Amount (fallback): bare number that's a round-ish dollar value

  let spread: number | null = null;
  let odds = -110;
  let totalLine: number | null = null;
  let oddsFound = false;

  // Separate over/under total line if explicit keyword present
  // e.g. "over 220.5" → totalLine = 220.5
  const overUnderMatch = raw.match(/\b(?:over|under|o\/u)\s+(\d+(?:\.\d+)?)/i);
  if (overUnderMatch) {
    totalLine = parseFloat(overUnderMatch[1]);
  }

  for (const tok of numTokens) {
    const abs = Math.abs(tok.value);

    if (tok.kind === "signed") {
      if (abs >= 100 && Number.isInteger(tok.value)) {
        // American odds
        odds = tok.value;
        oddsFound = true;
      } else if (abs < 60) {
        // Point spread or small number
        spread = tok.value;
      }
      // ignore signed decimals that could be totals with sign (rare)
    } else {
      // bare number
      if (amount === null && abs >= 1 && abs <= 100000) {
        // Could be a bet amount — prefer if it looks like a round dollar value
        // or if we haven't found one yet; skip if it matches total line
        if (totalLine === null || Math.abs(abs - totalLine) > 0.1) {
          amount = tok.value;
        }
      } else if (abs > 50 && abs < 500 && totalLine === null) {
        // Could be a total line (like 220.5, 47.5)
        totalLine = tok.value;
      }
    }
  }

  if (amount === null) return null;

  // ── 5. Determine final bet type ───────────────────────────────────────────
  let betType: "spread" | "moneyline" | "total";

  if (hasTotalKeyword || hasOver || hasUnder || totalLine !== null) {
    betType = "total";
  } else if (hasMLKeyword || hasPK) {
    betType = "moneyline";
    spread = 0;
  } else if (hasSpreadKeyword || (spread !== null && !oddsFound)) {
    // If we have a spread-sized number and no explicit odds keyword, it's a spread
    betType = "spread";
  } else if (spread !== null) {
    betType = "spread";
  } else if (oddsFound && !hasSpreadKeyword) {
    betType = "moneyline";
  } else {
    betType = "moneyline";
  }

  // ── 6. Extract team name ──────────────────────────────────────────────────
  // Strip everything that isn't a team name
  let teamText = workingText
    // Remove over/under + number  e.g. "over 220.5"
    .replace(/\b(?:over|under|o\/u)\s+\d+(?:\.\d+)?/gi, " ")
    // Remove bet-type keywords
    .replace(MONEYLINE_WORDS, " ")
    .replace(SPREAD_WORDS, " ")
    .replace(TOTAL_WORDS, " ")
    .replace(PICKEM_WORDS, " ")
    .replace(PARLAY_WORDS, " ")
    // Remove all signed numbers (spreads, odds)
    .replace(/[+-]\d+(?:\.\d+)?/g, " ")
    // Remove bare numbers (amounts, lines)
    .replace(/\b\d+(?:\.\d+)?\b/g, " ")
    // Remove punctuation except apostrophes (for names like O'Brien)
    .replace(/[^\w\s']/g, " ")
    // Remove noise words
    .split(/\s+/)
    .filter(w => w.length >= 2 && !NOISE_WORDS.has(w.toLowerCase()))
    .join(" ")
    .trim();

  // Title-case each word
  const team = teamText
    ? teamText
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    : "";

  // For spread and moneyline bets a team is required; totals can omit it
  if (!team && betType !== "total") return null;

  // ── 7. Confidence score ───────────────────────────────────────────────────
  let confidence: "high" | "medium" | "low" = "low";
  const signals = [
    dollarMatch !== null,
    betType === "total" ? true : team.length > 2,
    betType === "spread" ? spread !== null : true,
    betType === "total" ? totalLine !== null : true,
  ].filter(Boolean).length;

  if (signals >= 4) confidence = "high";
  else if (signals >= 3) confidence = "medium";

  return {
    team: team || "Unknown",
    betType,
    line: betType === "total" ? (totalLine ?? 0) : (spread ?? 0),
    odds,
    amount,
    side: betType === "total" ? (hasUnder ? "under" : "over") : undefined,
    raw,
    confidence,
  };
}

export function betConfirmationMessage(bet: ParsedBet): string {
  const amountStr = `$${bet.amount}`;
  const oddsStr = bet.odds > 0 ? `+${bet.odds}` : `${bet.odds}`;

  if (bet.betType === "spread") {
    const lineStr = bet.line > 0 ? `+${bet.line}` : `${bet.line}`;
    return `Logged: ${amountStr} on ${bet.team} ${lineStr} (${oddsStr})`;
  }
  if (bet.betType === "total") {
    const sideStr = bet.side ?? "over";
    return `Logged: ${amountStr} ${sideStr} ${bet.line} (${oddsStr})`;
  }
  return `Logged: ${amountStr} on ${bet.team} ML (${oddsStr})`;
}
