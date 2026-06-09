// CRA inlines REACT_APP_* env vars at build time.
//
// Resolution order for each base URL:
//   1. An explicit REACT_APP_*_BASE_URL (set via Docker build-arg / pipeline) wins.
//   2. Otherwise, in a PRODUCTION build → "" (same-origin / relative). The cluster
//      serves the UI and the backends behind one domain, path-routed by the ingress
//      (/authentication, /roles, /notes). A relative URL like
//      "/authentication/oauth2/authorization/google" resolves against whatever host
//      the app is served from, so the same image works on any environment.
//   3. Otherwise (local `npm start`, NODE_ENV=development) → localhost ports, since
//      the services run on separate ports locally (different origins).
const isDev = process.env.NODE_ENV === "development";
const base = (value, devUrl) => value || (isDev ? devUrl : "");

export const authBaseUrl = base(
  process.env.REACT_APP_AUTH_BASE_URL,
  "http://localhost:3211",
);
export const roleBaseUrl = base(
  process.env.REACT_APP_ROLE_BASE_URL,
  "http://localhost:3212",
);
export const noteBaseUrl = base(
  process.env.REACT_APP_NOTE_BASE_URL,
  "http://localhost:3213",
);
// ai-core is the one backend served at the ROOT of its pod (/chat, /search,
// /rag, /tags, /recommendations). Unlike the Spring services it has no
// context-path of its own, so in production the ingress exposes it under the
// "/ai-core" prefix and strips that prefix before forwarding to the pod.
// That prefix therefore exists ONLY in production — locally we hit the uvicorn
// port directly with no prefix. So its production fallback is "/ai-core"
// (relative, ingress-routed), not "" like the others.
export const aiBaseUrl =
  process.env.REACT_APP_AI_BASE_URL || (isDev ? "http://localhost:8001" : "/ai-core");
