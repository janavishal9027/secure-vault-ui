// Generation in ai-core runs on the caller's own Groq key, so its failures fall
// into three buckets that need different things from the user:
//
//   424  no key on the account — actionable, retrying never helps
//   503  every model in the fallback chain failed (rate limits, rejected key,
//        no credit). The detail is already user-safe and says what to do next.
//   502  something else broke server-side — generic message, worth a retry
//
// Embedding-backed features (semantic search, related notes) run on the
// server's Gemini key and never return 424.

export const KEYS_ROUTE = "/dashboard/keys";

const detailOf = (data) => {
  if (!data) return "";
  if (typeof data === "string") return data;
  return data.detail || data.message || "";
};

const classify = (status, detail, fallback) => {
  if (status === 424) {
    return {
      status,
      needsKey: true,
      message:
        detail ||
        "No Groq API key is configured for this account. Add one on the Keys page.",
    };
  }
  if (status === 503) {
    return {
      status,
      needsKey: false,
      retryable: true,
      message:
        detail ||
        "Every available model is rate-limited right now. Wait a moment and retry.",
    };
  }
  return { status, needsKey: false, message: detail || fallback };
};

/** Normalize an axios error into { status, needsKey, message }. */
export const describeAiError = (err, fallback = "The AI request failed.") =>
  classify(
    err?.response?.status,
    detailOf(err?.response?.data),
    err?.message || fallback,
  );

// A stream that already returned 200 cannot change its status, so ai-core
// reports mid-stream failures as an SSE `error` event instead. Those carry no
// status code, and the missing-key case has to be recognised from the message
// ai-core's NoProviderKeyError raises. `code` is preferred whenever the event
// carries one, so this match stops mattering as soon as the backend sends it.
const NO_KEY_SIGNATURE = /no groq api key configured/i;

/**
 * Classify an SSE `error` event from the streaming chat endpoint.
 * `code` is optional — when absent the message is matched instead.
 */
export const describeAiStreamError = (
  message,
  code,
  fallback = "Chat request failed.",
) => {
  const text = message || fallback;
  return {
    status: null,
    needsKey: code ? code === "no_provider_key" : NO_KEY_SIGNATURE.test(text),
    message: text,
  };
};

/**
 * Same, for the streaming chat path — it uses fetch (axios buffers), so the
 * error body has to be read off the Response before it can be classified.
 * This covers failures *before* the stream opens, which do carry a status.
 */
export const describeAiFetchError = async (
  response,
  fallback = "The AI request failed.",
) => {
  let detail = "";
  try {
    detail = detailOf(await response.json());
  } catch {
    // Non-JSON body (a proxy error page, an empty 502) — fall through.
  }
  return classify(response.status, detail, `${fallback} (${response.status})`);
};
