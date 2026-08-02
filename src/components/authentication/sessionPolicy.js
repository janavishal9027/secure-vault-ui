// Session policy: idle-based, not clock-based.
//
// The old behaviour was a flat 30-minute token. It expired 30 minutes after
// login regardless of what the user was doing, so a long note could be
// interrupted by a login screen — the session ended on a schedule rather than
// on a reason.
//
// The rule now: a session lasts as long as the person is using it, and ends
// when they stop. Two mechanisms, deliberately kept separate:
//
//   1. Renewal, while active. The token is short-lived on purpose (that limit
//      is what makes a stolen token decay). An active session trades it for a
//      fresh one before it lapses, so activity extends the session without
//      lengthening any individual token.
//
//   2. Expiry, when idle. Renewal simply stops. Nothing has to succeed for the
//      session to end, which is the property that matters — a failure to reach
//      the server cannot accidentally keep someone logged in.
//
// The client-side cutoff below is a courtesy on top of (2): it clears the token
// at the idle limit rather than leaving it in localStorage until the next
// request happens to fail. On a shared machine that difference is the whole
// point. It is not a security boundary by itself — the server's expiry is —
// but there is no reason to leave a usable token sitting around either.

/** How long a user may be idle before the session ends. */
export const IDLE_LIMIT_MS = 30 * 60 * 1000;

/**
 * How often to renew while active.
 *
 * Comfortably inside the server's token lifetime so a renewal has room to be
 * retried before anything lapses, and long enough that an active session is
 * not chattering at the auth service.
 */
export const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/** How often the timer wakes to compare idle time against the limit. */
export const IDLE_CHECK_INTERVAL_MS = 30 * 1000;

/**
 * Events that count as "still here".
 *
 * Pointer, keyboard and touch are intent. `scroll` is included because reading
 * a long note is use, even though nothing is being edited — without it, a user
 * reading for half an hour would be treated as absent.
 */
export const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
  "scroll",
];

/** Shared across tabs, so activity in one keeps the others alive. */
export const LAST_ACTIVITY_KEY = "LAST_ACTIVITY_AT";

export const markActivity = (now = Date.now()) => {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  } catch (_) {
    // localStorage unavailable — the in-memory timer still applies
  }
};

export const readLastActivity = () => {
  try {
    const raw = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  } catch (_) {
    return 0;
  }
};

/**
 * Whether the session has been idle past the limit.
 *
 * A missing timestamp is treated as *active*, not idle. The alternative would
 * log out every user whose storage was cleared or who has just signed in
 * before the first activity event lands.
 */
export const isIdleExpired = (lastActivityAt, now = Date.now()) => {
  if (!lastActivityAt) return false;
  return now - lastActivityAt >= IDLE_LIMIT_MS;
};
