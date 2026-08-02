// Where each node goes in the neighbourhood view.
//
// Extracted from the renderer so the property that matters can actually be
// asserted: **the same graph must draw identically every time**. That is the
// whole reason this is concentric-by-depth rather than force-directed — a
// layout that shifts between renders gives the user nothing to remember, and
// makes "did the graph change or did the picture?" unanswerable.
//
// Determinism comes from two places: rings are assigned by hop distance, and
// within a ring nodes are sorted by name. Neither depends on input order,
// timing, or randomness.

export const WIDTH = 760;
export const HEIGHT = 460;
export const CENTRE = { x: WIDTH / 2, y: HEIGHT / 2 };

const RING = [0, 130, 205];
// Deterministic angular offset per ring, so the rings do not line their nodes
// up radially and hide each other behind the same spokes.
const RING_PHASE = [0, -Math.PI / 2, -Math.PI / 2 + 0.35];
// The viewport is wider than it is tall, so a true circle wastes horizontal
// space.
const VERTICAL_SQUASH = 0.72;

export const NODE_RADIUS = { 0: 30, 1: 22, 2: 17 };

/**
 * Positions keyed by entity id: `{ [id]: { x, y, depth } }`.
 *
 * The seed is depth 0 even when the API did not say so — a neighbourhood
 * without a centre has nothing to be concentric around.
 */
export const computeLayout = (nodes = [], seedId = null) => {
  if (!nodes.length) return {};

  const byDepth = new Map();
  nodes.forEach((node) => {
    const depth = node.entityId === seedId ? 0 : Math.min(2, node.depth ?? 1);
    if (!byDepth.has(depth)) byDepth.set(depth, []);
    byDepth.get(depth).push(node);
  });

  const positions = {};
  [...byDepth.entries()]
    .sort((a, b) => a[0] - b[0])
    .forEach(([depth, group]) => {
      // Sorted by name, so input order cannot change the picture.
      const sorted = [...group].sort((a, b) =>
        (a.name || "").localeCompare(b.name || ""),
      );

      if (depth === 0) {
        sorted.forEach((node) => {
          positions[node.entityId] = { ...CENTRE, depth };
        });
        return;
      }

      const radius = RING[depth] ?? RING[2];
      const step = (Math.PI * 2) / sorted.length;
      sorted.forEach((node, index) => {
        const angle = RING_PHASE[depth] + index * step;
        positions[node.entityId] = {
          x: CENTRE.x + radius * Math.cos(angle),
          y: CENTRE.y + radius * VERTICAL_SQUASH * Math.sin(angle),
          depth,
        };
      });
    });

  return positions;
};

/** Line width from support count — a thicker edge is a better-evidenced claim. */
export const edgeWidth = (supportCount, highlighted) =>
  highlighted ? 2.4 : 1 + Math.min(2, (supportCount || 1) * 0.4);
