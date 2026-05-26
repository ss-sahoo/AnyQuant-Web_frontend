// Shared timeframe ↔ filename matching logic.
//
// Background: the Strategy Tester upload section asks the user for one CSV per
// required timeframe (e.g. 1h, 36min, plus an execution_timeframe like 6min
// when tick-level timing is enabled). The original matcher only handled a
// hardcoded set of timeframes and did a substring check, which missed common
// broker filenames like "EURUSD_M6.csv" or "EURUSD_6m.csv".
//
// This module replaces that with a canonical "minutes" comparison: parse both
// the target timeframe and any timeframe-shaped tokens in the filename to a
// numeric minute value, then compare. Falls back to substring for anything
// the parser can't decode.

const UNIT_TO_MIN: Record<string, number> = {
  s: 1 / 60, sec: 1 / 60, secs: 1 / 60, second: 1 / 60, seconds: 1 / 60,
  m: 1, min: 1, mins: 1, minute: 1, minutes: 1,
  h: 60, hr: 60, hrs: 60, hour: 60, hours: 60,
  d: 1440, day: 1440, days: 1440,
  w: 10080, wk: 10080, week: 10080, weeks: 10080,
}

// "6min" / "30 s" / "1 h" → 6 / 0.5 / 60. Returns null if unparseable.
export function timeframeToMinutes(tf: string): number | null {
  if (!tf) return null
  const t = tf.toLowerCase().trim().replace(/\s+/g, "")
  const m = t.match(/^(\d+)([a-z]+)$/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  const unit = m[2]
  const mult = UNIT_TO_MIN[unit]
  return mult !== undefined ? n * mult : null
}

// Extract every timeframe-shaped token from a filename and return the set of
// minute values they correspond to. Recognises:
//   - "6min", "30s", "1h", "1d", "1w", "2hr"   (number-then-unit)
//   - "M6", "M15", "H1", "H4", "D1", "W1"      (MT4/MT5 prefix-then-number)
//   - bare minute counts ("6", "180") as a fallback when no labelled tokens are
//     present — the upload UI documents this convention ("180" for 3h)
export function filenameTimeframeMinutes(filename: string): Set<number> {
  const f = filename.toLowerCase()
  const out = new Set<number>()

  // Pattern 1: digits followed by unit, with a word/end boundary after the unit.
  const re1 = /(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|wk|[smhdw])(?=$|[^a-z])/g
  let m: RegExpExecArray | null
  while ((m = re1.exec(f)) !== null) {
    const n = parseInt(m[1], 10)
    const unit = m[2]
    const mult = UNIT_TO_MIN[unit]
    if (mult !== undefined) out.add(n * mult)
  }

  // Pattern 2: broker prefix-then-number ("M6", "H1") with non-word/start before.
  const re2 = /(?:^|[^a-z0-9])([mhdw])(\d+)(?=$|[^a-z0-9])/g
  while ((m = re2.exec(f)) !== null) {
    const unit = m[1]
    const n = parseInt(m[2], 10)
    const mult = UNIT_TO_MIN[unit]
    if (mult !== undefined) out.add(n * mult)
  }

  // Pattern 3: bare numbers as minute counts. Only fires when no labelled token
  // was found, to avoid misreading years/version numbers in well-named files.
  if (out.size === 0) {
    const stem = f.replace(/\.[a-z0-9]+$/i, "")
    const re3 = /(?:^|[^a-z0-9])(\d+)(?=$|[^a-z0-9])/g
    while ((m = re3.exec(stem)) !== null) {
      const n = parseInt(m[1], 10)
      if (n > 0) out.add(n)
    }
  }

  return out
}

// True iff `filename` is plausibly the dataset for `timeframe`.
// Strategy:
//   1) substring (case-insensitive) — preserves legacy behavior
//   2) canonical-minute equality between target and tokens parsed from filename
export function matchesTimeframe(filename: string, timeframe: string): boolean {
  if (!filename || !timeframe) return false
  const lf = filename.toLowerCase()
  const lt = timeframe.toLowerCase().trim()
  if (lt && lf.includes(lt)) return true

  const target = timeframeToMinutes(timeframe)
  if (target == null) return false

  const found = filenameTimeframeMinutes(filename)
  return found.has(target)
}
