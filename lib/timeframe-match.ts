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

// Which uploaded file belongs in which timeframe slot.
//
// The slot a file belongs to is a property of the file (its bar cadence), not
// of when the user happened to drop it. Pairing requiredTimeframes with
// uploadedFiles by array index mislabels every slot as soon as the upload order
// differs from the required order — the backend then rejects the run with
// "cadence ... is not a clean divisor of <slot>".
//
// Resolution per slot, strongest evidence first:
//   1. cadence detected from the file's own timestamps (what the backend checks)
//   2. timeframe tokens in the filename (what the upload UI shows the user)
//   3. upload order, for whatever is still unclaimed
// Files matching no slot are still sent, keyed by filename stem, preserving the
// previous fallback behavior. `guessed` lists the slots that only step 3 could
// fill, so callers can warn before a mislabelled run reaches the backend.
export function resolveTimeframeFiles<T>(
  requiredTimeframes: string[],
  uploadedFiles: string[],
  fileObjects: Record<string, T>,
  detectedMinutes: Record<string, number> = {},
): { files: Record<string, T>; guessed: string[] } {
  const files: Record<string, T> = {}
  const claimed = new Set<string>()
  const guessed: string[] = []

  const isFree = (filename: string) => !claimed.has(filename) && !!fileObjects[filename]
  const claim = (timeframe: string, filename: string) => {
    files[timeframe] = fileObjects[filename]
    claimed.add(filename)
  }

  // Pass 1: cadence measured from file contents.
  const needName: string[] = []
  for (const tf of requiredTimeframes) {
    const target = timeframeToMinutes(tf)
    const hit =
      target == null
        ? undefined
        : uploadedFiles.find((f) => isFree(f) && detectedMinutes[f] === target)
    if (hit) claim(tf, hit)
    else needName.push(tf)
  }

  // Pass 2: timeframe tokens in the filename.
  const needOrder: string[] = []
  for (const tf of needName) {
    const hit = uploadedFiles.find((f) => isFree(f) && matchesTimeframe(f, tf))
    if (hit) claim(tf, hit)
    else needOrder.push(tf)
  }

  // Pass 3: upload order, for what is left.
  const leftovers = uploadedFiles.filter(isFree)
  needOrder.forEach((tf, i) => {
    const filename = leftovers[i]
    if (filename) {
      claim(tf, filename)
      guessed.push(tf)
    }
  })

  // Anything unmatched still goes up under its filename stem.
  for (const filename of uploadedFiles) {
    if (isFree(filename)) files[filename.split(".")[0]] = fileObjects[filename]
  }

  return { files, guessed }
}
