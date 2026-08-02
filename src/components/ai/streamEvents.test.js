// Priority 4 of the four in FRONTEND-ARCHITECTURE.md §21.4.
//
// The rule under test: a turn must end labelled with the model that actually
// answered. `meta` carries the chain's first choice, sent before anything has
// been tried; `model` carries the one that opened the stream. Reporting the
// first is wrong exactly when fallback happened — which is the only time the
// distinction matters, and is how the original bug stayed invisible.

import {
  applyStreamEvent,
  initialStreamState,
  parseSseFrames,
  reduceStream,
} from "./streamEvents";

describe("model attribution", () => {
  test("with no fallback, meta and model agree", () => {
    const state = reduceStream([
      { type: "meta", model: "llama-3.3-70b-versatile", conversationId: "c1" },
      { type: "model", model: "llama-3.3-70b-versatile" },
      { type: "delta", text: "hi" },
      { type: "done" },
    ]);
    expect(state.model).toBe("llama-3.3-70b-versatile");
    expect(state.modelConfirmed).toBe(true);
  });

  test("after fallback, the answering model wins", () => {
    // The bug this test exists for: the UI used to report the first choice,
    // i.e. the model that had just been rate-limited.
    const state = reduceStream([
      { type: "meta", model: "llama-3.3-70b-versatile" },
      { type: "model", model: "openai/gpt-oss-120b" },
      { type: "delta", text: "answer" },
      { type: "done" },
    ]);
    expect(state.model).toBe("openai/gpt-oss-120b");
  });

  test("meta alone leaves the model unconfirmed", () => {
    const state = reduceStream([{ type: "meta", model: "llama-3.3-70b-versatile" }]);
    expect(state.model).toBe("llama-3.3-70b-versatile");
    expect(state.modelConfirmed).toBe(false);
  });

  test("a late meta cannot overwrite a confirmed model", () => {
    // Ordering is not something a client should assume about a network.
    const state = reduceStream([
      { type: "model", model: "openai/gpt-oss-20b" },
      { type: "meta", model: "llama-3.3-70b-versatile" },
    ]);
    expect(state.model).toBe("openai/gpt-oss-20b");
  });

  test("a model event with no model is ignored", () => {
    const state = reduceStream([
      { type: "meta", model: "llama-3.1-8b-instant" },
      { type: "model" },
    ]);
    expect(state.model).toBe("llama-3.1-8b-instant");
    expect(state.modelConfirmed).toBe(false);
  });
});

describe("accumulation", () => {
  test("deltas concatenate in order", () => {
    const state = reduceStream([
      { type: "delta", text: "Hello" },
      { type: "delta", text: ", " },
      { type: "delta", text: "world" },
    ]);
    expect(state.text).toBe("Hello, world");
  });

  test("citations and contextUsed come off meta", () => {
    const state = reduceStream([
      {
        type: "meta",
        citations: [{ noteId: "N1", title: "A" }],
        contextUsed: { memory: true, memoryCount: 2 },
      },
    ]);
    expect(state.citations).toHaveLength(1);
    expect(state.contextUsed.memoryCount).toBe(2);
  });

  test("a turn with no memory reports it as absent", () => {
    // The chip must not appear when memory did not reach the model.
    const state = reduceStream([
      { type: "meta", contextUsed: { memory: false, notes: true } },
    ]);
    expect(state.contextUsed.memory).toBe(false);
  });

  test("done is recorded", () => {
    expect(reduceStream([{ type: "done" }]).done).toBe(true);
  });

  test("errors keep their code for classification", () => {
    const state = reduceStream([
      { type: "error", message: "No Groq API key configured", code: "no_provider_key" },
    ]);
    expect(state.errorCode).toBe("no_provider_key");
  });
});

describe("robustness", () => {
  test("an unknown event type changes nothing", () => {
    // A backend that adds an event must not break an older client.
    const before = initialStreamState();
    expect(applyStreamEvent(before, { type: "telemetry", n: 1 })).toBe(before);
  });

  test("a null or typeless event changes nothing", () => {
    const before = initialStreamState();
    expect(applyStreamEvent(before, null)).toBe(before);
    expect(applyStreamEvent(before, {})).toBe(before);
  });

  test("state is never mutated", () => {
    const before = initialStreamState();
    const after = applyStreamEvent(before, { type: "delta", text: "x" });
    expect(before.text).toBe("");
    expect(after).not.toBe(before);
  });
});

describe("parseSseFrames", () => {
  test("parses well-formed frames", () => {
    const chunk = 'data: {"type":"delta","text":"a"}\n\ndata: {"type":"done"}\n\n';
    expect(parseSseFrames(chunk)).toEqual([
      { type: "delta", text: "a" },
      { type: "done" },
    ]);
  });

  test("a malformed frame costs one event, not the reply", () => {
    const chunk = 'data: {"type":"delta","text":"a"}\n\ndata: {not json}\n\ndata: {"type":"done"}\n\n';
    const events = parseSseFrames(chunk);
    expect(events).toHaveLength(2);
    expect(events[1].type).toBe("done");
  });

  test("non-data lines are ignored", () => {
    expect(parseSseFrames(": keep-alive\n\n")).toEqual([]);
    expect(parseSseFrames("")).toEqual([]);
  });
});
