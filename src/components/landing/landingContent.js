// Everything the landing page says, in one place.
//
// The page used to hold these arrays inline, which meant the header's nav and
// the sections it linked to were maintained separately — rename a section and
// the nav quietly pointed at nothing. NAV is now derived from the same list the
// page renders, so the two cannot disagree.
//
// Editing this file changes the page. No component needs touching to add a
// feature card, reorder the posts, or rename a section.

/**
 * The scrollable sections, in page order.
 *
 * `nav: true` puts a section in the header. The header renders these in order,
 * so reordering here reorders the nav — and every anchor is guaranteed to
 * exist, because the page and the nav read the same list.
 */
export const SECTIONS = [
  { id: "features", label: "Features", nav: true },
  { id: "security", label: "Security", nav: true },
  { id: "community", label: "Community", nav: true },
  { id: "posts", label: "Posts", nav: true },
];

export const NAV = SECTIONS.filter((s) => s.nav);

export const HERO = {
  eyebrow: "Voice-powered security",
  headline: ["Your thoughts.", "Secured", " by voice."],
  lead: "Create, manage, and protect your digital notes with voice commands, two-factor authentication, and role-based access control.",
  primary: { label: "Get started free", to: "/signUp" },
  secondary: { label: "Log in", to: "/login" },
};

export const FEATURE_CARDS = [
  {
    icon: "shield",
    title: "2FA Protection",
    // Was "Mandatory two-factor authentication". It defaults to off on both
    // signup paths, so it is opt-in — see landingModalContent.js.
    text: "Turn on time-based codes from any authenticator app",
    tone: "violet",
  },
  {
    icon: "mic",
    title: "Voice Commands",
    text: "Create notes hands-free with speech-to-text technology",
    tone: "aqua",
  },
  {
    icon: "users",
    title: "Role-Based Access",
    text: "Customer, Admin, and Delegate roles with distinct permissions",
    tone: "gold",
  },
  {
    icon: "lock",
    title: "Private & Secure",
    text: "Each user can only see and manage their own notes",
    tone: "rose",
  },
];

export const SECURITY_POINTS = [
  "Passwords hashed, never stored in the clear",
  "Two-factor authentication, whenever you want it",
  "Ownership enforced in the database, not the browser",
  "Your AI provider keys encrypted at rest",
];

export const ROLES = [
  ["Customer", "Your personal sanctuary for private thought."],
  ["Delegate", "Collaborate without losing your boundaries."],
  ["Admin", "Guide the workspace with full visibility."],
];

/**
 * Posts.
 *
 * Ordered as they appear. "Getting Started" leads because it is what a first
 * visitor actually needs; the role-based access piece was dropped in favour of
 * a security explainer, which is the question this product gets asked most.
 *
 * `modal` names an entry in landingModalContent.js — these open in place
 * rather than linking to articles that do not exist yet.
 */
export const POSTS = [
  {
    image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80",
    title: "Getting Started with Secure Vault",
    text: "A simple guide to creating your first protected workspace.",
    modal: "Getting Started",
  },
  {
    image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=900&q=80",
    title: "How Your Notes Are Protected",
    text: "What we encrypt, what we do not, and why the difference matters.",
    modal: "How Your Notes Are Protected",
  },
  {
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    title: "Voice Commands: The Future of Note-Taking",
    text: "Discover a calmer way to capture ideas the moment they arrive.",
    modal: "Voice Commands",
  },
];

export const CTA = {
  eyebrow: "A calmer place to think",
  headline: ["Ready to secure your", "notes?"],
  lead: "Join the people who trust Secure Vault with what matters most.",
  action: { label: "Start securing your notes", to: "/signUp" },
};
