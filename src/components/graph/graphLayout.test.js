// Priority 3 of the four in FRONTEND-ARCHITECTURE.md §21.4.
//
// The property that matters: the same graph draws identically every time. It
// is the entire reason this layout is concentric-by-depth rather than
// force-directed — a picture that shifts between renders gives the user
// nothing to remember, and makes "did the graph change, or just the drawing?"
// unanswerable.

import { CENTRE, computeLayout, edgeWidth } from "./graphLayout";

const node = (entityId, name, depth) => ({ entityId, name, depth, entityType: "PERSON" });

const sample = [
  node("seed", "Project Atlas", 0),
  node("b", "Bravo", 1),
  node("a", "Alpha", 1),
  node("c", "Charlie", 1),
  node("d", "Delta", 2),
];

describe("determinism", () => {
  test("the same input gives the same positions", () => {
    expect(computeLayout(sample, "seed")).toEqual(computeLayout(sample, "seed"));
  });

  test("input order does not move anything", () => {
    // Nodes are sorted by name within a ring, so the order the API happened to
    // return them in cannot change the picture.
    const shuffled = [sample[3], sample[0], sample[4], sample[2], sample[1]];
    expect(computeLayout(shuffled, "seed")).toEqual(computeLayout(sample, "seed"));
  });

  test("repeated layout of a large graph is stable", () => {
    const many = Array.from({ length: 40 }, (_, i) =>
      node(`n${i}`, `Node ${String(i).padStart(2, "0")}`, (i % 2) + 1),
    );
    expect(computeLayout(many, "n0")).toEqual(computeLayout(many, "n0"));
  });
});

describe("structure", () => {
  test("the seed sits at the centre", () => {
    const positions = computeLayout(sample, "seed");
    expect(positions.seed.x).toBe(CENTRE.x);
    expect(positions.seed.y).toBe(CENTRE.y);
    expect(positions.seed.depth).toBe(0);
  });

  test("a node named as the seed is centred even if its depth says otherwise", () => {
    // A neighbourhood without a centre has nothing to be concentric around.
    const positions = computeLayout([node("x", "X", 2)], "x");
    expect(positions.x.depth).toBe(0);
    expect(positions.x.x).toBe(CENTRE.x);
  });

  test("one-hop nodes are closer to the centre than two-hop nodes", () => {
    const positions = computeLayout(sample, "seed");
    const distance = (p) => Math.hypot(p.x - CENTRE.x, p.y - CENTRE.y);
    expect(distance(positions.a)).toBeLessThan(distance(positions.d));
  });

  test("nodes on a ring are spread apart, not stacked", () => {
    const positions = computeLayout(sample, "seed");
    const ring = [positions.a, positions.b, positions.c];
    const unique = new Set(ring.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`));
    expect(unique.size).toBe(3);
  });

  test("depth beyond two is clamped to the outer ring", () => {
    const positions = computeLayout([node("seed", "S", 0), node("far", "Far", 9)], "seed");
    expect(positions.far.depth).toBe(2);
  });

  test("every node gets a position", () => {
    const positions = computeLayout(sample, "seed");
    expect(Object.keys(positions).sort()).toEqual(["a", "b", "c", "d", "seed"]);
  });

  test("an empty graph lays out to nothing", () => {
    expect(computeLayout([], "seed")).toEqual({});
    expect(computeLayout()).toEqual({});
  });

  test("a missing depth defaults to one hop", () => {
    const positions = computeLayout([{ entityId: "u", name: "U" }], "seed");
    expect(positions.u.depth).toBe(1);
  });
});

describe("edgeWidth", () => {
  test("better-evidenced edges are drawn thicker", () => {
    expect(edgeWidth(5)).toBeGreaterThan(edgeWidth(1));
  });

  test("thickness is capped so one edge cannot dominate", () => {
    expect(edgeWidth(1000)).toBe(edgeWidth(5));
  });

  test("a highlighted edge has a fixed width", () => {
    expect(edgeWidth(1, true)).toBe(edgeWidth(50, true));
  });

  test("a missing support count still draws a line", () => {
    expect(edgeWidth(undefined)).toBeGreaterThan(0);
  });
});
