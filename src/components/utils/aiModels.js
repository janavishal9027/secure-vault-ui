// Every model in the fallback chain is served by Groq using the user's own key.
// The "openai/" prefix on the GPT-OSS entries is part of the model id Groq
// publishes for those open-weights models — nothing is routed to OpenAI, and no
// second provider is involved. Labels exist so the UI does not imply otherwise.
export const MODEL_LABELS = {
  "llama-3.3-70b-versatile": "Llama 3.3 70B",
  "llama-3.1-8b-instant": "Llama 3.1 8B",
  "openai/gpt-oss-120b": "GPT-OSS 120B",
  "openai/gpt-oss-20b": "GPT-OSS 20B",
  "groq/compound": "Groq Compound",
};

// e.g. "openai/gpt-oss-120b" -> "GPT-OSS 120B", "llama-3.3-70b-versatile" -> "Llama 3.3 70B"
export const prettyModel = (id) => {
  if (!id) return "";
  if (MODEL_LABELS[id]) return MODEL_LABELS[id];
  const name = id.includes("/") ? id.split("/").pop() : id;
  return name
    .split(/[-_]/)
    .map((part) =>
      /\d/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
};
