// Priority 1 of the four in FRONTEND-ARCHITECTURE.md §21.4.
//
// A citation that resolves to the wrong source is the worst failure this UI
// can produce: it presents a claim as checkable and points at something the
// claim did not come from. Everything here is about that.

import {
  markerLabel,
  noteIdFor,
  resolveMarker,
  splitCitations,
} from "./citations";

const citations = [
  { n: 1, noteId: "NOTE_A", title: "Atlas kickoff" },
  { n: 2, noteId: "NOTE_B", title: "Migration plan" },
];

const facts = [
  { n: 1, statement: "Sarah works on Atlas", supportCount: 3, noteIds: ["NOTE_C"] },
  { n: 2, statement: "Atlas uses Postgres", supportCount: 1, noteIds: [] },
];

describe("splitCitations", () => {
  test("plain text with no markers is one run", () => {
    expect(splitCitations("just an answer")).toEqual([{ text: "just an answer" }]);
  });

  test("a note marker is separated from the surrounding text", () => {
    expect(splitCitations("before [1] after")).toEqual([
      { text: "before " },
      { markers: [{ graph: false, ordinal: 1 }] },
      { text: " after" },
    ]);
  });

  test("a graph marker is flagged as graph", () => {
    expect(splitCitations("[G2]")).toEqual([
      { markers: [{ graph: true, ordinal: 2 }] },
    ]);
  });

  test("the two namespaces do not collide", () => {
    // The whole reason the backend keeps them separate: [1] and [G1] index
    // different lists, and confusing them cites the wrong thing.
    const parts = splitCitations("note [1] and fact [G1]");
    const markers = parts.filter((p) => p.markers).flatMap((p) => p.markers);
    expect(markers).toEqual([
      { graph: false, ordinal: 1 },
      { graph: true, ordinal: 1 },
    ]);
  });

  test("a comma group becomes several markers", () => {
    expect(splitCitations("[1, 2]")[0].markers).toEqual([
      { graph: false, ordinal: 1 },
      { graph: false, ordinal: 2 },
    ]);
  });

  test("a mixed comma group keeps each namespace", () => {
    expect(splitCitations("[G1, 2]")[0].markers).toEqual([
      { graph: true, ordinal: 1 },
      { graph: false, ordinal: 2 },
    ]);
  });

  test("adjacent markers stay separate", () => {
    const parts = splitCitations("[1][2]");
    expect(parts).toHaveLength(2);
    expect(parts[0].markers[0].ordinal).toBe(1);
    expect(parts[1].markers[0].ordinal).toBe(2);
  });

  test("lowercase g is accepted", () => {
    expect(splitCitations("[g3]")[0].markers[0]).toEqual({ graph: true, ordinal: 3 });
  });

  test("bracketed text that is not a citation is left as text", () => {
    // Markdown links and asides must survive untouched.
    expect(splitCitations("see [the docs] for more")).toEqual([
      { text: "see [the docs] for more" },
    ]);
  });

  test("empty and null answers produce nothing", () => {
    expect(splitCitations("")).toEqual([]);
    expect(splitCitations(null)).toEqual([]);
    expect(splitCitations(undefined)).toEqual([]);
  });

  test("repeated calls give the same result", () => {
    // The regex is module-level and stateful with /g; without resetting
    // lastIndex the second call would start mid-string and drop markers.
    const answer = "a [1] b [G2] c";
    expect(splitCitations(answer)).toEqual(splitCitations(answer));
  });

  test("a long answer with many markers keeps document order", () => {
    const parts = splitCitations("x [1] y [G1] z [2]");
    const flat = parts.map((p) => (p.text !== undefined ? "T" : "M"));
    expect(flat).toEqual(["T", "M", "T", "M", "T", "M"]);
  });
});

describe("resolveMarker", () => {
  test("a note marker resolves against citations", () => {
    const source = resolveMarker({ graph: false, ordinal: 2 }, citations, facts);
    expect(source.noteId).toBe("NOTE_B");
  });

  test("a graph marker resolves against facts", () => {
    const source = resolveMarker({ graph: true, ordinal: 1 }, citations, facts);
    expect(source.statement).toBe("Sarah works on Atlas");
  });

  test("the same ordinal in each namespace resolves differently", () => {
    // This is the failure the separate namespaces exist to prevent.
    const note = resolveMarker({ graph: false, ordinal: 1 }, citations, facts);
    const fact = resolveMarker({ graph: true, ordinal: 1 }, citations, facts);
    expect(note.title).toBe("Atlas kickoff");
    expect(fact.statement).toBe("Sarah works on Atlas");
  });

  test("an ordinal outside the block resolves to null", () => {
    // The renderer must draw nothing: a dead [7] looks checkable and is not.
    expect(resolveMarker({ graph: false, ordinal: 7 }, citations, facts)).toBeNull();
    expect(resolveMarker({ graph: true, ordinal: 9 }, citations, facts)).toBeNull();
  });

  test("empty source lists resolve to null rather than throwing", () => {
    expect(resolveMarker({ graph: false, ordinal: 1 })).toBeNull();
    expect(resolveMarker(null, citations, facts)).toBeNull();
  });
});

describe("noteIdFor", () => {
  test("a note marker links to its note", () => {
    expect(noteIdFor({ graph: false, ordinal: 1 }, citations[0])).toBe("NOTE_A");
  });

  test("a graph marker links to its first evidencing note", () => {
    expect(noteIdFor({ graph: true, ordinal: 1 }, facts[0])).toBe("NOTE_C");
  });

  test("a fact with no evidence links nowhere", () => {
    // Rather than producing a link to undefined.
    expect(noteIdFor({ graph: true, ordinal: 2 }, facts[1])).toBeNull();
  });
});

describe("markerLabel", () => {
  test("notes are bare numbers, relationships carry the G", () => {
    expect(markerLabel({ graph: false, ordinal: 4 })).toBe("4");
    expect(markerLabel({ graph: true, ordinal: 4 })).toBe("G4");
  });
});
