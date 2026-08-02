// Priority 2 of the four in FRONTEND-ARCHITECTURE.md §21.4.
//
// This classification decides what the user is told to *do*. Getting 424 wrong
// sends someone to retry forever instead of adding a key; getting 429 wrong
// reports a spent budget as an outage.

import {
  describeAiError,
  describeAiStreamError,
  describeAiFetchError,
} from "./aiErrors";

const axiosError = (status, data) => ({ response: { status, data } });

describe("describeAiError", () => {
  test("424 is actionable and asks for a key", () => {
    const described = describeAiError(axiosError(424, { detail: "No Groq API key" }));
    expect(described.needsKey).toBe(true);
    expect(described.message).toBe("No Groq API key");
  });

  test("424 with no detail still explains what to do", () => {
    const described = describeAiError(axiosError(424, {}));
    expect(described.needsKey).toBe(true);
    expect(described.message).toMatch(/keys page/i);
  });

  test("503 is retryable and not a key problem", () => {
    const described = describeAiError(axiosError(503, { detail: "All models rate-limited" }));
    expect(described.needsKey).toBe(false);
    expect(described.retryable).toBe(true);
  });

  test("a generic failure falls back to the caller's message", () => {
    const described = describeAiError(axiosError(500, {}), "Tagging failed.");
    expect(described.needsKey).toBe(false);
    expect(described.message).toBe("Tagging failed.");
  });

  test("a string body is used directly", () => {
    expect(describeAiError(axiosError(500, "upstream exploded")).message).toBe(
      "upstream exploded",
    );
  });

  test("a network error with no response does not throw", () => {
    const described = describeAiError({ message: "Network Error" }, "fallback");
    expect(described.message).toBe("Network Error");
    expect(described.needsKey).toBe(false);
  });

  test("`message` is accepted as well as `detail`", () => {
    // Spring services answer with `message`; ai-core answers with `detail`.
    expect(describeAiError(axiosError(500, { message: "boom" })).message).toBe("boom");
  });
});

describe("describeAiStreamError", () => {
  test("an explicit code is trusted", () => {
    const described = describeAiStreamError("anything at all", "no_provider_key");
    expect(described.needsKey).toBe(true);
  });

  test("a non-key code is not treated as a key problem", () => {
    expect(describeAiStreamError("No Groq API key configured", "rate_limited").needsKey).toBe(
      false,
    );
  });

  test("without a code the message is matched", () => {
    // A stream that already returned 200 cannot carry a status, so the
    // missing-key case has to be recognised from the text until the backend
    // sends a code.
    expect(describeAiStreamError("No Groq API key configured for this account").needsKey).toBe(
      true,
    );
    expect(describeAiStreamError("Every model is rate-limited").needsKey).toBe(false);
  });
});

describe("describeAiFetchError", () => {
  test("classifies a JSON body from a fetch Response", async () => {
    const response = {
      status: 424,
      json: async () => ({ detail: "No Groq API key" }),
    };
    const described = await describeAiFetchError(response);
    expect(described.needsKey).toBe(true);
  });

  test("a non-JSON body still yields a usable message", async () => {
    const response = {
      status: 502,
      json: async () => {
        throw new Error("not json");
      },
    };
    const described = await describeAiFetchError(response, "Chat failed.");
    expect(described.message).toContain("502");
  });
});
