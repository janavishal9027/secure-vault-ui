// The neighbourhood view — nodes and edges, drawn as plain SVG.
//
// No graph library. The architecture argues at length that a personal graph is
// small (hundreds of nodes) and that a second datastore is not worth its
// operational surface; the same reasoning applies to a 200KB rendering
// dependency for a view that draws at most a few dozen circles.
//
// Layout is concentric by hop distance rather than force-directed: the seed
// sits at the centre, its direct neighbours on the first ring, two-hop nodes
// on the second. That makes the one thing this view exists to show — how far
// something is from what you asked about — readable at a glance, and it is
// deterministic, so the picture does not rearrange itself between renders.
//
// This is also the best debugging tool for extraction quality. Over-extraction
// looks like a hairball, bad resolution looks like duplicate clusters near the
// centre, and a healthy graph looks like a graph.

import { useMemo, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";

import { tintFor } from "../ai/aiUi";
import {
  HEIGHT,
  NODE_RADIUS as NODE_R,
  WIDTH,
  computeLayout,
  edgeWidth,
} from "./graphLayout";

const solidTint = (type) => tintFor(type).replace(/,\s*0?\.\d+\)$/, ",0.85)");

const truncate = (text, max) =>
  !text ? "" : text.length <= max ? text : `${text.slice(0, max - 1)}…`;

export default function EntityGraph({ nodes = [], edges = [], onSelect, seedId }) {
  const [hovered, setHovered] = useState(null);
  const [focused, setFocused] = useState(null);

  // Layout lives in its own module so its determinism can be tested — see
  // graphLayout.js.
  const positions = useMemo(() => computeLayout(nodes, seedId), [nodes, seedId]);

  const visibleEdges = useMemo(
    () => edges.filter((e) => positions[e.source] && positions[e.target]),
    [edges, positions],
  );

  // Focus isolates exactly as hover does, so a keyboard user sees the same
  // thing a mouse user does rather than a lesser version of it.
  const active = hovered || focused;

  const connected = useMemo(() => {
    if (!active) return null;
    const set = new Set([active]);
    visibleEdges.forEach((edge) => {
      if (edge.source === active) set.add(edge.target);
      if (edge.target === active) set.add(edge.source);
    });
    return set;
  }, [active, visibleEdges]);

  // Ring order, which is also DOM order — so Tab and the arrow keys agree.
  const order = useMemo(
    () => nodes.map((node) => node.entityId).filter((id) => positions[id]),
    [nodes, positions],
  );

  const moveFocus = (fromId, delta) => {
    const index = order.indexOf(fromId);
    if (index === -1) return;
    const next = order[(index + delta + order.length) % order.length];
    const element = document.querySelector(`[data-node-id="${next}"]`);
    if (element) element.focus();
  };

  const handleKeyDown = (event, nodeId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect && onSelect(nodeId);
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(nodeId, 1);
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(nodeId, -1);
    }
  };

  if (!nodes.length) return null;

  const dim = (id) => Boolean(connected) && !connected.has(id);

  return (
    <Box>
      <Box
        sx={{
          width: "100%",
          overflowX: "auto",
          borderRadius: 2,
          border: "1px solid rgba(var(--ov),0.08)",
          background: "rgba(var(--ov),0.02)",
          // Node labels are drawn with fill="currentColor" so they follow the
          // theme without every <text> repeating a colour. Set it here, on the
          // element the SVG inherits from.
          color: "var(--text)",
        }}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          style={{ display: "block", minWidth: 520 }}
          role="img"
          aria-label={`Neighbourhood of ${nodes.length} entities`}
        >
          <defs>
            <marker
              id="graph-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--icon-muted)" />
            </marker>
          </defs>

          {visibleEdges.map((edge) => {
            const from = positions[edge.source];
            const to = positions[edge.target];
            const faded = dim(edge.source) || dim(edge.target);
            const highlighted =
              hovered && (edge.source === hovered || edge.target === hovered);
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            return (
              <g key={edge.relationId} opacity={faded ? 0.12 : 1}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={
                    highlighted ? "var(--accent-soft)" : "rgba(var(--ov),0.32)"
                  }
                  // Support is the count of distinct notes asserting the edge,
                  // so a thicker line is literally a better-evidenced claim.
                  strokeWidth={edgeWidth(edge.supportCount, highlighted)}
                  markerEnd="url(#graph-arrow)"
                />
                {highlighted && (
                  <text
                    x={midX}
                    y={midY - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fill="var(--text)"
                    style={{ pointerEvents: "none" }}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {nodes.map((node) => {
            const position = positions[node.entityId];
            if (!position) return null;
            const radius = NODE_R[position.depth] ?? NODE_R[2];
            const faded = dim(node.entityId);
            const focusedHere = focused === node.entityId;
            return (
              // Focusable and operable from the keyboard. Tab reaches every
              // node in ring order, arrow keys move between them, Enter or
              // Space opens one — so the picture is not mouse-only, and
              // focusing a node isolates its connections exactly as hovering
              // does.
              <g
                key={node.entityId}
                transform={`translate(${position.x}, ${position.y})`}
                opacity={faded ? 0.2 : 1}
                style={{ cursor: onSelect ? "pointer" : "default", outline: "none" }}
                tabIndex={0}
                role="button"
                data-node-id={node.entityId}
                aria-label={`${node.name}, ${String(node.entityType).toLowerCase()}${
                  node.entityId === seedId ? ", centre of this view" : ""
                }`}
                onMouseEnter={() => setHovered(node.entityId)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setFocused(node.entityId)}
                onBlur={() => setFocused(null)}
                onKeyDown={(event) => handleKeyDown(event, node.entityId)}
                onClick={() => onSelect && onSelect(node.entityId)}
              >
                <circle
                  r={radius}
                  fill={solidTint(node.entityType)}
                  // The seed ring was pinned white and the ordinary ring pinned
                  // near-black, so exactly one of the two was ever visible:
                  // white rings vanish on a light background, dark rings vanish
                  // on a dark one. Both are overlay-based now, which inverts.
                  stroke={
                    focusedHere
                      ? "var(--accent-soft)"
                      : node.entityId === seedId
                        ? "var(--text)"
                        : "rgba(var(--ov),0.35)"
                  }
                  strokeWidth={focusedHere ? 4 : node.entityId === seedId ? 3 : 1.5}
                />
                <title>
                  {`${node.name} — ${String(node.entityType).toLowerCase()}`}
                </title>
                <text
                  y={radius + 14}
                  textAnchor="middle"
                  fontSize={position.depth === 0 ? 13 : 11}
                  fontWeight={position.depth === 0 ? 700 : 500}
                  fill="currentColor"
                  style={{ pointerEvents: "none" }}
                >
                  {truncate(node.name, position.depth === 0 ? 26 : 18)}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>

      <Stack
        direction="row"
        spacing={0.75}
        useFlexGap
        flexWrap="wrap"
        sx={{ gap: 0.75, mt: 1.5 }}
      >
        {[...new Set(nodes.map((n) => n.entityType))].map((type) => (
          <Chip
            key={type}
            size="small"
            label={String(type).toLowerCase()}
            sx={{
              color: "var(--text)",
              backgroundColor: tintFor(type),
              textTransform: "capitalize",
            }}
          />
        ))}
      </Stack>

      <Typography
        sx={{ fontSize: "0.75rem", color: "var(--text-muted)", mt: 1 }}
      >
        Rings are hops from the entity at the centre. Thicker lines are edges
        more notes agree on. Hover or focus a node to isolate its connections
        and read the relationship; click or press Enter to open it. Tab and the
        arrow keys move between nodes.
      </Typography>
    </Box>
  );
}
