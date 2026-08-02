// Folding the chat stream's events into the state a turn ends with.
//
// Extracted because the ordering rule here is subtle and was wrong in
// production: `meta` carries the model the backend is *about to try*, and
// `model` carries the one that actually opened the stream. A turn must end
// labelled with the second whenever it arrives, because fallback is precisely
// the case where the two differ — and reporting the first means naming a model
// that just failed.
//
// Pure and synchronous, so the rule can be asserted without a network, a
// server, or a rendered component.

/** The state a turn starts in. */
export const initialStreamState = () => ({
  conversationId: null,
  /** Optimistic until a `model` event supersedes it. */
  model: "",
  /** True once the authoritative model has been reported. */
  modelConfirmed: false,
  citations: [],
  contextUsed: null,
  text: "",
  error: null,
  errorCode: "",
  done: false,
});

/**
 * Apply one SSE event. Returns a new state; never mutates.
 *
 * Unknown event types are ignored rather than throwing — a backend that adds
 * an event must not break a client that has not been updated.
 */
export const applyStreamEvent = (state, event) => {
  if (!event || !event.type) return state;

  switch (event.type) {
    case "meta":
      return {
        ...state,
        conversationId: event.conversationId ?? state.conversationId,
        // Only as a placeholder. If `model` already arrived — which cannot
        // normally happen, but ordering is not something a client should
        // assume — the confirmed value wins.
        model: state.modelConfirmed ? state.model : event.model || state.model,
        citations: Array.isArray(event.citations) ? event.citations : state.citations,
        contextUsed: event.contextUsed ?? state.contextUsed,
      };

    case "model":
      // Authoritative. This is the model that opened the stream.
      return event.model
        ? { ...state, model: event.model, modelConfirmed: true }
        : state;

    case "delta":
      return { ...state, text: state.text + (event.text || "") };

    case "error":
      return {
        ...state,
        error: event.message || "Chat request failed.",
        errorCode: event.code || "",
      };

    case "done":
      return { ...state, done: true };

    default:
      return state;
  }
};

/** Fold a whole event sequence. Used by tests and by replay. */
export const reduceStream = (events, state = initialStreamState()) =>
  events.reduce(applyStreamEvent, state);

/**
 * Parse an SSE chunk into events.
 *
 * Frames are `data: {...}\n\n`. A frame that is not valid JSON is skipped
 * rather than aborting the stream — one malformed frame should cost one
 * event, not the whole reply.
 */
export const parseSseFrames = (chunk) => {
  if (!chunk) return [];
  return chunk
    .split("\n\n")
    .map((frame) => frame.trim())
    .filter((frame) => frame.startsWith("data:"))
    .map((frame) => {
      try {
        return JSON.parse(frame.slice(5).trim());
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};
