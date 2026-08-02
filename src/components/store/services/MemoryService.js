// Memory — what the assistant knows about *you*, as distinct from what is in
// your notes.
//
// Most of this surface is control rather than display, and deliberately so: a
// system that forms persistent beliefs about a person without their visibility
// or consent is a trust violation regardless of how well it works. The
// inspector, provenance, edit, delete, pause, wipe and export all exist before
// anything automatic does.

import apiClient from "../../utils/apiClient";
import { aiBaseUrl } from "../../utils/url";

const memory = (path = "") => `${aiBaseUrl}/memory${path}`;

/** The inspector. `status` accepts "ALL" to include superseded and archived. */
export const listMemoriesService = (params = {}) =>
  apiClient.get(memory(), { params });

export const memoryDetailService = (memoryId) =>
  apiClient.get(memory(`/${encodeURIComponent(memoryId)}`));

/** What this memory replaced — "where did I use to work?". Reads rows normal
 * retrieval deliberately excludes, which is the reason supersession keeps
 * them rather than overwriting. */
export const memoryHistoryService = (memoryId) =>
  apiClient.get(memory(`/${encodeURIComponent(memoryId)}/history`));

/** Counts by status and kind. The number worth watching is `active` over
 * time: it should plateau, not grow linearly. */
export const memoryStatsService = () => apiClient.get(memory("/stats"));

export const memorySettingsService = () => apiClient.get(memory("/settings"));

/** Pause stops NEW memories being formed while keeping the existing ones — a
 * different thing from wiping, and users want both. */
export const updateMemorySettingsService = (paused) =>
  apiClient.put(memory("/settings"), { paused });

/** Store one explicitly. Confidence 1.0, never decays, never auto-retired. */
export const createMemoryService = ({ statement, kind }) =>
  apiClient.post(memory(), { statement, kind });

/** Rewrite a statement. The user's wording wins permanently. */
export const editMemoryService = (memoryId, statement) =>
  apiClient.put(memory(`/${encodeURIComponent(memoryId)}`), { statement });

/** Delete it, and record a standing instruction never to form it again. */
export const deleteMemoryService = (memoryId) =>
  apiClient.delete(memory(`/${encodeURIComponent(memoryId)}`));

/** Contradictions the system refused to resolve on its own. An immutable fact
 * cannot legitimately change, so a conflict there means one of the two
 * extractions is wrong — and picking the newer one silently would write an
 * error into something that should never move. */
export const memoryReviewService = () => apiClient.get(memory("/review"));

export const resolveMemoryReviewService = (memoryId, keep) =>
  apiClient.post(memory(`/review/${encodeURIComponent(memoryId)}`), { keep });

/** Everything as JSON, including superseded history. */
export const exportMemoriesService = () => apiClient.get(memory("/export"));

/** Delete everything. One action, no partial state — hence confirm=true. */
export const wipeMemoriesService = () =>
  apiClient.post(memory("/wipe"), null, { params: { confirm: true } });

/** Read idle conversations now instead of on the next chat turn. */
export const extractMemoriesNowService = () => apiClient.post(memory("/extract"));

/** The six kinds with their half-lives, for labelling the inspector. */
export const memoryKindsService = () => apiClient.get(memory("/meta/kinds"));
