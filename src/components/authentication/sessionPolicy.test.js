import {
  ACTIVITY_EVENTS,
  IDLE_LIMIT_MS,
  LAST_ACTIVITY_KEY,
  REFRESH_INTERVAL_MS,
  isIdleExpired,
  markActivity,
  readLastActivity,
} from "./sessionPolicy";

describe("isIdleExpired", () => {
  const now = 1_700_000_000_000;

  test("a session used just now is not expired", () => {
    expect(isIdleExpired(now, now)).toBe(false);
  });

  test("a session used one millisecond inside the limit survives", () => {
    expect(isIdleExpired(now - IDLE_LIMIT_MS + 1, now)).toBe(false);
  });

  test("a session idle for exactly the limit has expired", () => {
    expect(isIdleExpired(now - IDLE_LIMIT_MS, now)).toBe(true);
  });

  test("a session idle well past the limit has expired", () => {
    expect(isIdleExpired(now - IDLE_LIMIT_MS * 4, now)).toBe(true);
  });

  // The failure mode this guards against is logging out every user whose
  // storage was cleared, or who has just signed in and not yet moved.
  test.each([0, null, undefined, NaN])(
    "a missing timestamp (%p) counts as active, not idle",
    (value) => {
      expect(isIdleExpired(value, now)).toBe(false);
    },
  );
});

describe("activity timestamps", () => {
  beforeEach(() => localStorage.clear());

  test("round-trips through storage", () => {
    markActivity(1234);
    expect(readLastActivity()).toBe(1234);
  });

  test("reads as absent when nothing was written", () => {
    expect(readLastActivity()).toBe(0);
  });

  test("treats a corrupted value as absent rather than as an old timestamp", () => {
    // A garbage value must not read as 0-from-epoch, which would be
    // indistinguishable from "idle since 1970" and log the user straight out.
    localStorage.setItem(LAST_ACTIVITY_KEY, "not-a-number");
    expect(readLastActivity()).toBe(0);
    expect(isIdleExpired(readLastActivity())).toBe(false);
  });
});

describe("policy constants", () => {
  // The renewal has to happen well inside the idle window, or a session could
  // lapse in the gap between two refreshes while the user was still active.
  test("renewal runs several times within the idle window", () => {
    expect(REFRESH_INTERVAL_MS).toBeLessThan(IDLE_LIMIT_MS / 2);
  });

  test("scroll counts as activity, so reading is not treated as absence", () => {
    expect(ACTIVITY_EVENTS).toContain("scroll");
  });
});
