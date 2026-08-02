// Parsing the citation markers a model writes into its answer.
//
// Extracted from the renderer because this is *logic*, not presentation, and
// it is the single highest-risk piece of client code in the app: a marker
// resolved to the wrong source produces an answer that looks checkable and
// cites something it did not come from. That is worse than no citation at all,
// so it gets its own module and its own tests.
//
// Two namespaces share one syntax. `[1]` indexes a note passage; `[G1]`
// indexes a relationship from the knowledge graph. The backend keeps them
// separate precisely so this parser never has to guess — a single numbering
// would make `[3]` ambiguous.

const MARKER = /\[(G?\d+(?:\s*,\s*G?\d+)*)\]/gi;
const ORDINAL = /^(G?)(\d+)$/i;

/**
 * Split an answer into plain-text runs and marker groups.
 *
 * Returns `[{ text }]` and `[{ markers: [{ graph, ordinal }] }]` in document
 * order, so the renderer walks the array once and never has to re-scan.
 */
export const splitCitations = (answer) => {
  const parts = [];
  if (!answer) return parts;

  let cursor = 0;
  let match;
  // `lastIndex` is reset because the regex is module-level and stateful with
  // the /g flag — a second call on a shorter string would otherwise start
  // mid-way and silently miss markers.
  MARKER.lastIndex = 0;

  while ((match = MARKER.exec(answer)) !== null) {
    if (match.index > cursor) {
      parts.push({ text: answer.slice(cursor, match.index) });
    }
    const markers = match[1]
      .split(",")
      .map((raw) => {
        const found = ORDINAL.exec(raw.trim());
        if (!found) return null;
        return { graph: found[1].toUpperCase() === "G", ordinal: Number(found[2]) };
      })
      .filter(Boolean);

    // A marker group whose contents are all unparseable is dropped entirely
    // rather than rendered as an empty chip.
    parts.push(markers.length ? { markers } : { text: match[0] });
    cursor = match.index + match[0].length;
  }

  if (cursor < answer.length) parts.push({ text: answer.slice(cursor) });
  return parts;
};

/**
 * Resolve one marker to its source, or null.
 *
 * Null means the model cited an ordinal that is not in the block it was given.
 * The caller must render nothing — a dead `[7]` looks checkable and is not.
 */
export const resolveMarker = (marker, citations = [], facts = []) => {
  if (!marker) return null;
  const pool = marker.graph ? facts : citations;
  return pool.find((item) => item.n === marker.ordinal) || null;
};

/** The note a marker links to, whichever namespace it came from. */
export const noteIdFor = (marker, source) => {
  if (!source) return null;
  return marker.graph ? source.noteIds?.[0] || null : source.noteId || null;
};

/** Label shown on the chip: `1` for a note, `G1` for a relationship. */
export const markerLabel = (marker) =>
  marker.graph ? `G${marker.ordinal}` : String(marker.ordinal);
