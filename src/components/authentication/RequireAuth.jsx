// Route guard for everything under /dashboard.
//
// Without this, navigating directly to a dashboard route rendered the page,
// fired a request, got a 401, and *then* showed the session-expired modal —
// so an unauthenticated user saw a page skeleton and a dialog instead of the
// login form. It also meant every new protected page inherited the behaviour
// silently: nobody had to remember to guard a route, so nobody noticed none of
// them were.
//
// This is a UX fix, not a security control. Authorization is enforced
// server-side on every request and the JWT is validated against the shared
// secret; a user who edits their way past this guard reaches pages that return
// 401 for everything. What it fixes is being shown a door that opens onto a
// wall.

import { Navigate, useLocation } from "react-router-dom";

/** True when a token is present. Deliberately not a validity check.
 *
 *  Decoding and checking `exp` in the browser would be a second, weaker copy
 *  of a decision the backend already makes properly — and a clock-skewed
 *  client would then log people out of a session that is still valid. Presence
 *  is what the client can honestly know; expiry is the server's answer, and
 *  `apiClient` already turns that answer into the session-expired flow. */
const hasToken = () => {
  try {
    return Boolean(localStorage.getItem("JWT_TOKEN"));
  } catch {
    // Storage disabled (private mode, hardened settings). Treat as signed out
    // rather than throwing during render.
    return false;
  }
};

export default function RequireAuth({ children }) {
  const location = useLocation();

  if (!hasToken()) {
    // `replace` so the guarded URL does not sit in history — otherwise Back
    // from the login page bounces the user straight into another redirect.
    // `state.from` lets a future login redirect return them where they meant
    // to go.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
