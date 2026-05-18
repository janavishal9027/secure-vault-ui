// CRA inlines REACT_APP_* env vars at build time. Setting them in the
// Docker build args / pipeline lets each environment (dev / stage / prod)
// point at its own backends without code changes. Falls back to localhost
// so `npm start` keeps working with no env config.
export const authBaseUrl =
  process.env.REACT_APP_AUTH_BASE_URL || "http://localhost:3211";
export const roleBaseUrl =
  process.env.REACT_APP_ROLE_BASE_URL || "http://localhost:3212";
export const noteBaseUrl =
  process.env.REACT_APP_NOTE_BASE_URL || "http://localhost:3213";
export const aiBaseUrl =
  process.env.REACT_APP_AI_BASE_URL || "http://localhost:8001";
