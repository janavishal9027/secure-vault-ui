import { useCallback, useEffect, useRef } from "react";

import { refreshTokenService } from "../store/services/AuthService";
import { clearCachedProfile } from "../store/useMyProfile";
import {
  ACTIVITY_EVENTS,
  IDLE_CHECK_INTERVAL_MS,
  LAST_ACTIVITY_KEY,
  REFRESH_INTERVAL_MS,
  isIdleExpired,
  markActivity,
  readLastActivity,
} from "./sessionPolicy";

/**
 * Keeps an active session alive and ends an idle one.
 *
 * Renders nothing. Mounted once, beside SessionExpiredHandler, so the policy
 * lives in one place rather than being re-implemented per page. See
 * `sessionPolicy.js` for why the rule is idle-based.
 */
const SessionManager = () => {
  const refreshTimer = useRef(null);
  const idleTimer = useRef(null);
  const throttleUntil = useRef(0);

  const hasToken = () => Boolean(localStorage.getItem("JWT_TOKEN"));

  const endSession = useCallback((reason) => {
    if (!hasToken()) return;
    localStorage.removeItem("JWT_TOKEN");
    localStorage.removeItem("ROLES");
    try {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch (_) {
      // nothing to clean up
    }
    clearCachedProfile();
    console.info(`session ended: ${reason}`);
    window.dispatchEvent(new Event("session-expired"));
  }, []);

  const refresh = useCallback(async () => {
    if (!hasToken()) return;

    // Do not renew a session that has already gone idle — that would be the
    // timer keeping someone logged in who stopped using the app ten minutes
    // ago. Renewal is a consequence of activity, never a substitute for it.
    if (isIdleExpired(readLastActivity())) return;

    try {
      const res = await refreshTokenService();
      const token = res?.data?.jwtToken;
      if (token) localStorage.setItem("JWT_TOKEN", token);
    } catch (err) {
      // A 401 here means the window already lapsed, and apiClient's response
      // interceptor has raised session-expired. Any other failure is
      // transient — the next tick tries again, and the token we still hold is
      // valid until the server says otherwise.
      if (err?.response?.status && err.response.status !== 401) {
        console.warn("session refresh failed, will retry", err.response.status);
      }
    }
  }, []);

  useEffect(() => {
    // Signing in counts as activity. Without this the first idle check would
    // read a stale timestamp from a previous session.
    if (hasToken() && !readLastActivity()) markActivity();

    const onActivity = () => {
      if (!hasToken()) return;
      // These events fire continuously during a scroll or a burst of typing.
      // Writing to localStorage on each one is pointless work; one write per
      // few seconds is all the resolution a 30-minute limit needs.
      const now = Date.now();
      if (now < throttleUntil.current) return;
      throttleUntil.current = now + 5000;
      markActivity(now);
    };

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, onActivity, { passive: true }),
    );

    // Returning to a backgrounded tab is activity in its own right, and is
    // also the moment a laptop that was closed for an hour needs checking.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!hasToken()) return;
      if (isIdleExpired(readLastActivity())) {
        endSession("idle limit reached while the tab was hidden");
      } else {
        markActivity();
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    idleTimer.current = setInterval(() => {
      if (!hasToken()) return;
      if (isIdleExpired(readLastActivity())) {
        endSession("idle limit reached");
      }
    }, IDLE_CHECK_INTERVAL_MS);

    refreshTimer.current = setInterval(refresh, REFRESH_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, onActivity),
      );
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(idleTimer.current);
      clearInterval(refreshTimer.current);
    };
  }, [endSession, refresh]);

  return null;
};

export default SessionManager;
