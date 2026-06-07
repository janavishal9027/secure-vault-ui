// API path prefixes. These match the ingress routes and the backend Spring
// `server.servlet.context-path` values, which are the same in every
// environment, so they default in code rather than relying on env loading.
// (Combined with a relative base URL from url.js, the final request resolves
// to e.g. https://<host>/authentication/oauth2/authorization/google.)
export const authentication =
  process.env.REACT_APP_AUTHENTICATION || "/authentication";
export const roles = process.env.REACT_APP_ROLES || "/roles";
export const notes = process.env.REACT_APP_NOTES || "/notes";
