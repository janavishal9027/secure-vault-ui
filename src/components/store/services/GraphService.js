// Knowledge graph — what is *in* the notes: people, projects, technologies and
// the relationships between them.
//
// These answer the shape of question semantic search cannot. "Who works on
// Atlas?" is a set assembled from a dozen notes, none of which is individually
// the closest match to the query, so no amount of tuning topK produces it.
//
// Every route is scoped server-side to the caller's own token. Entity ids
// travel in these responses (unlike in a model's context block) because the
// caller already had the right to see them.

import apiClient from "../../utils/apiClient";
import { aiBaseUrl } from "../../utils/url";

const graph = (path) => `${aiBaseUrl}/graph${path}`;

/** Entities, optionally filtered by name fragment or type. */
export const listEntitiesService = (params = {}) =>
  apiClient.get(graph("/entities"), { params });

/** One entity with every relation, alias and mention — the "everything about
 * Sarah" view. Relations come back in both directions, incoming ones already
 * labelled with their inverse ("has contributor" rather than "works on"). */
export const entityDetailService = (entityId) =>
  apiClient.get(graph(`/entities/${encodeURIComponent(entityId)}`));

/** What one note contributed to the graph — the entity page read from the
 * other end. This is where extraction quality is most legible: open a note and
 * see what the system understood it to be about. */
export const entitiesInNoteService = (noteId) =>
  apiClient.get(graph(`/notes/${encodeURIComponent(noteId)}/entities`));

/** Nodes and edges for the graph view. `truncated` says when the row cap bit,
 * so a partial neighbourhood is not mistaken for a small one. */
export const entityNeighborhoodService = (entityId, depth = 2) =>
  apiClient.get(graph(`/entities/${encodeURIComponent(entityId)}/neighborhood`), {
    params: { depth },
  });

/** The connection finder: how two entities relate, if they do. */
export const graphPathService = (fromId, toId) =>
  apiClient.get(graph("/path"), { params: { from: fromId, to: toId } });

/** Hubs, stale projects, notes with no entities, and the related_to ratio. */
export const graphInsightsService = () => apiClient.get(graph("/insights"));

/** Extraction progress for this user. */
export const graphStatusService = () => apiClient.get(graph("/status"));

/** Pairs resolution was not confident enough to merge on its own.
 *
 * Failing to merge is recoverable — a fragmented graph is fixed by one click.
 * Merging two real people is not, which is why these wait for a human. */
export const mergeCandidatesService = () =>
  apiClient.get(graph("/merge-candidates"));

export const acceptMergeCandidateService = (candidateId) =>
  apiClient.post(graph(`/merge-candidates/${candidateId}/accept`));

export const rejectMergeCandidateService = (candidateId) =>
  apiClient.post(graph(`/merge-candidates/${candidateId}/reject`));

/** Fold one entity into another. Reversible — the source keeps its row. */
export const mergeEntitiesService = (entityId, targetEntityId) =>
  apiClient.post(graph(`/entities/${encodeURIComponent(entityId)}/merge`), {
    targetEntityId,
  });

export const unmergeEntityService = (entityId) =>
  apiClient.post(graph(`/entities/${encodeURIComponent(entityId)}/unmerge`));

/** Re-resolve this user's entities against each other. Idempotent. */
export const resolveEntitiesService = () => apiClient.post(graph("/resolve"));
