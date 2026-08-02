// Transforms — the work ledger behind embedding, tagging, summarization,
// entity extraction and memory extraction.
//
// Almost everything here is admin-gated, because it either reveals what the
// deployment is spending or changes what it will spend. The exception is
// `myBudgetService`: that is the caller's own number, and a product that
// silently defers their work should be able to say why.

import apiClient from "../../utils/apiClient";
import { aiBaseUrl } from "../../utils/url";

const tx = (path) => `${aiBaseUrl}/transforms${path}`;

/** This caller's own spend and what is left of their daily allowance. */
export const myBudgetService = () => apiClient.get(tx("/me"));

/** Every registered transform in dependency order, with cost class. */
export const transformCatalogueService = () => apiClient.get(tx("/catalogue"));

/** Queue depth, cost and mean duration per transform. `PENDING` growing
 * monotonically is the alert no single failure would ever raise. */
export const transformStatusService = () => apiClient.get(tx("/status"));

/** What is missing, stale or blocked — across every transform at once. */
export const transformReconcileService = () => apiClient.get(tx("/reconcile"));

/** Poison notes. Three failing the same way is a prompt bug worth fixing. */
export const transformFailuresService = (params = {}) =>
  apiClient.get(tx("/failures"), { params });

export const retryTransformFailuresService = (name) =>
  apiClient.post(tx("/failures/retry"), null, { params: name ? { name } : {} });

/** Spend by day and by user — the answer to "what does one note cost?". */
export const transformUsageService = (params = {}) =>
  apiClient.get(tx("/usage"), { params });

/** Which ordered schema steps have been applied to this database. */
export const migrationStatusService = () => apiClient.get(tx("/migrations"));

/** Drain one batch synchronously, for a deployment with pollers disabled. */
export const runTransformBatchService = (costClass, limit = 5) =>
  apiClient.post(tx("/run"), null, { params: { cost_class: costClass, limit } });

// --- Backfill campaigns ---------------------------------------------------
//
// The only operation here that can spend four figures in an hour, which is why
// opening one demands a stated reason and why it starts in CANARY: a bounded
// slice to evaluate before committing to the corpus.

export const listBackfillsService = () => apiClient.get(tx("/backfills"));

export const createBackfillService = (payload) =>
  apiClient.post(tx("/backfills"), payload);

export const advanceBackfillService = (backfillId, batch = 0) =>
  apiClient.post(tx(`/backfills/${backfillId}/advance`), null, {
    params: batch ? { batch } : {},
  });

export const setBackfillStatusService = (backfillId, value, note) =>
  apiClient.post(tx(`/backfills/${backfillId}/status`), null, {
    params: { value, ...(note ? { note } : {}) },
  });

export const setBackfillRateService = (backfillId, perMinute) =>
  apiClient.post(tx(`/backfills/${backfillId}/rate-limit`), null, {
    params: { per_minute: perMinute },
  });
