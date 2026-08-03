// Priority 2 of the four in FRONTEND-ARCHITECTURE.md §21.4.
//
// This classification decides what the user is told to *do*. Getting 424 wrong
// sends someone to retry forever instead of adding a key; getting 429 wrong
// reports a spent budget as an outage.

import {
  describeAiError,
  describeAiStreamError,
  describeAiFetchError,
  describeSummaryFailure,
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

describe("describeSummaryFailure", () => {
  // Summarisation runs over Kafka, so its failure never reaches the browser as
  // an HTTP error — it arrives as a string the notes service recorded on the
  // note. That string is produced by a different service, so its shape is a
  // contract worth pinning: `<status> <STATUS_NAME> - <json body>`.
  const NO_KEY_424 =
    '424 FAILED_DEPENDENCY - {"detail":"No Groq API key configured for this account."}';

  test("nothing to report when there was no failure", () => {
    expect(describeSummaryFailure(null)).toBeNull();
    expect(describeSummaryFailure("")).toBeNull();
    expect(describeSummaryFailure("   ")).toBeNull();
  });

  test("a 424 is recognised as a missing key", () => {
    const result = describeSummaryFailure(NO_KEY_424);
    expect(result.needsKey).toBe(true);
  });

  test("the missing-key message is written for a person, not a log", () => {
    const result = describeSummaryFailure(NO_KEY_424);
    // No status code, no JSON envelope, no provider name the user did not choose.
    expect(result.message).not.toMatch(/424|FAILED_DEPENDENCY|\{|detail/);
    expect(result.message).toMatch(/key/i);
  });

  test("the message alone is enough, without the status", () => {
    // If the notes service ever stops prefixing the status, this must still
    // classify — hence matching on both signals rather than one.
    const result = describeSummaryFailure(
      "No Groq API key configured for this account.",
    );
    expect(result.needsKey).toBe(true);
  });

  test("the status alone is enough, without the message", () => {
    const result = describeSummaryFailure("424 FAILED_DEPENDENCY");
    expect(result.needsKey).toBe(true);
  });

  test("other failures are reported but not treated as a missing key", () => {
    const result = describeSummaryFailure(
      '502 BAD_GATEWAY - {"detail":"summarization failed"}',
    );
    expect(result.needsKey).toBe(false);
    // The sentence is extracted from the envelope rather than shown raw.
    expect(result.message).toBe("summarization failed");
    expect(result.message).not.toMatch(/502|BAD_GATEWAY/);
  });

  test("a bare string survives intact", () => {
    // Not every failure comes from ai-core — a connection refused, say.
    const result = describeSummaryFailure("Connection refused");
    expect(result.needsKey).toBe(false);
    expect(result.message).toBe("Connection refused");
  });

  test("a malformed body does not throw", () => {
    const result = describeSummaryFailure('502 BAD_GATEWAY - {not json');
    expect(result).not.toBeNull();
    expect(typeof result.message).toBe("string");
  });
});
