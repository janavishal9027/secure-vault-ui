import { useEffect, useState } from "react";

import { getMyProfileService } from "./services/AuthService";

// One fetch, many consumers.
//
// The avatar is needed by the top bar, the note page header and Settings —
// three components that mount independently and would otherwise each request
// the same profile. The cache is module-level rather than Redux because this is
// a single read-mostly record with no reducers worth writing for it; the
// subscriber set is what keeps every mounted consumer in step after an edit.

let cached = null;
let inFlight = null;
const subscribers = new Set();

const publish = (profile) => {
  cached = profile;
  subscribers.forEach((fn) => fn(profile));
};

const hasToken = () => Boolean(localStorage.getItem("JWT_TOKEN"));

const load = () => {
  if (inFlight) return inFlight;
  inFlight = getMyProfileService()
    .then((res) => {
      publish(res.data);
      return res.data;
    })
    .catch(() => {
      // A profile is decoration in most of these places — a failed load should
      // leave initials showing, not break the header it sits in.
      publish(null);
      return null;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
};

/** Call after a successful profile save so every consumer updates at once. */
export const setCachedProfile = (profile) => publish(profile);

/** Drop the cache on sign-out so the next user does not inherit it. */
export const clearCachedProfile = () => {
  cached = null;
  publish(null);
};

/**
 * The signed-in user's profile, or null while loading / when unauthenticated.
 * Never throws and never suspends.
 */
export const useMyProfile = () => {
  const [profile, setProfile] = useState(cached);

  useEffect(() => {
    subscribers.add(setProfile);
    if (!cached && hasToken()) load();
    return () => subscribers.delete(setProfile);
  }, []);

  return profile;
};

/** Best-effort initials for an avatar fallback. */
export const initialsFor = (profile) => {
  const source =
    profile?.displayName || profile?.username || profile?.email || "";
  const parts = source.trim().split(/[\s._-]+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};
