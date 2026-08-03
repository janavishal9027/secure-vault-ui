// Content for the landing page's modals.
//
// Every claim here was checked against the implementation before it was
// written — the Java services, the ai-core service, and the database itself.
// This is the part of a marketing page a reader is entitled to take literally,
// so nothing in it is written to sound good.
//
// Where the code does something less than the design's copy implied, the copy
// changed rather than the claim being softened. Two examples, both corrected:
// two-factor is opt-in and defaults to off (the card said "mandatory"), and
// note bodies are readable by the server (the section said "end-to-end
// encrypted"). Both are explained rather than omitted.

export const SECURITY = {
  eyebrow: "How this is built",
  title: "Security, specifically.",
  lead: "Not adjectives — the actual measures, and where they stop.",
  sections: [
    {
      icon: "lock",
      tone: "violet",
      title: "Signing in",
      points: [
        ["Passwords are hashed with BCrypt", "They are never stored, logged, or returned by any endpoint — not even to you. A database dump does not reveal them."],
        ["Two-factor authentication, if you want it", "Time-based codes from any authenticator app. The secret that generates them is withheld from every API response, so it cannot leak through the interface that created it."],
        ["Google and GitHub sign-in", "Handled by the provider; we never see your password for those accounts."],
      ],
    },
    {
      icon: "shield",
      tone: "aqua",
      title: "Your session",
      points: [
        ["Signed tokens, checked on every request", "HMAC-SHA256. A tampered or forged token fails validation before any handler runs."],
        ["Sessions end when you stop, not on a timer", "Your session renews while you are active and expires after 30 minutes of inactivity — so a long note is never interrupted, and an abandoned session does not stay open."],
        ["Expiry cannot be traded away", "An expired token cannot be exchanged for a fresh one. Once the window closes, signing in again is the only way back."],
      ],
    },
    {
      icon: "users",
      tone: "gold",
      title: "Who can reach what",
      points: [
        ["Ownership is enforced in the query, not the page", "Every note lookup is scoped to your account id in the database query itself. Hiding a note in the browser would be a suggestion; this is a condition the row has to satisfy to be returned at all."],
        ["Roles are checked server-side", "Customer, Delegate and Admin have distinct permissions, evaluated on the server for every request. The interface reflects your role; it does not decide it."],
      ],
    },
    {
      icon: "mic",
      tone: "rose",
      title: "AI provider keys",
      points: [
        ["Encrypted before they are stored", "Your provider key is encrypted at rest with Fernet — AES-128-CBC with an HMAC-SHA256 signature — so the stored value is unusable on its own."],
        ["Shown masked, always", "Once saved, a key is only ever displayed with most of it hidden. There is no endpoint that returns it in full."],
        ["Used only for your requests", "Your key pays for your usage and nobody else's, and you can replace or remove it at any time."],
      ],
    },
  ],
  limits: [
    ["Notes are not end-to-end encrypted", "They are stored as readable text, because summarising, searching and linking them requires reading them. End-to-end encryption would rule out every AI feature in the product. If that trade is wrong for what you are writing, the honest answer is that this is not the right tool for it."],
    ["Uploaded avatars are checked, not trusted", "An avatar must be an https URL or an inline image. This is enforced on the server, because that value is rendered as an image and an unchecked one is a scripting vector."],
  ],
};

/** Keyed by the feature card's title, so a card opens its own explanation. */
export const FEATURES = {
  "2FA Protection": {
    eyebrow: "Two-factor authentication",
    title: "A second factor, when you choose it.",
    lead: "Standard time-based codes, off by default and yours to turn on.",
    sections: [
      {
        icon: "shield",
        tone: "violet",
        title: "How it works",
        points: [
          ["Any authenticator app", "Scan a QR code with Google Authenticator, Authy, 1Password or anything else that speaks TOTP. There is nothing proprietary to install."],
          ["Six digits, rotating every 30 seconds", "The code is derived from a shared secret and the current time, so an old code is worthless the moment it lapses."],
          ["Enforced at sign-in, on the server", "With it enabled, a correct password alone does not get you in — the session stays in a pending state until the code is verified."],
        ],
      },
      {
        icon: "lock",
        tone: "aqua",
        title: "How the secret is handled",
        points: [
          ["It never comes back out", "The seed is written once when you enrol and is excluded from every API response. The screen that set it up cannot read it back."],
          ["Turning it off is an authenticated action", "Disabling two-factor requires a live session, so someone who merely knows your password cannot quietly remove it."],
        ],
      },
    ],
    limits: [
      ["It is optional, not mandatory", "New accounts start with it switched off, including accounts created through Google or GitHub. Nothing forces it on — which also means nothing is protecting an account whose owner has not enabled it. You turn it on in Settings."],
      ["There are no recovery codes yet", "If you lose the device holding your authenticator, there is no self-service way back in — an administrator has to disable two-factor on the account. Worth knowing before you enrol on a phone you are about to replace."],
    ],
  },

  "Voice Commands": {
    eyebrow: "Voice capture",
    title: "Talk it types.",
    lead: "Dictation that lands in the note you are already writing.",
    sections: [
      {
        icon: "mic",
        tone: "aqua",
        title: "How it behaves",
        points: [
          ["One kind of note, however you make it", "Dictated text goes into the same note, in the same editor, as anything you type. There is no separate 'voice note' to manage, and nothing downstream treats it differently."],
          ["It waits for you to think", "Twenty seconds to begin speaking, then eight between phrases. Long enough to gather a thought without the session closing on you mid-sentence."],
          ["It stops when you do", "Silence past that window ends the session cleanly and keeps everything transcribed so far."],
        ],
      },
      {
        icon: "check",
        tone: "violet",
        title: "What you need",
        points: [
          ["A Chromium browser", "Chrome or Edge. This uses the browser's own speech recognition, and support for it is still uneven elsewhere."],
          ["A secure connection", "https, or localhost while developing. Browsers refuse microphone access otherwise, and correctly so."],
        ],
      },
    ],
    limits: [
      ["Transcription is not done on your device", "The browser's speech API streams audio to its vendor's servers to convert it to text — for Chrome, that means Google. Your note is stored here, but the audio that produced it passed through them. If a thought is sensitive enough that this matters, type it."],
      ["Accuracy varies with conditions", "Accents, background noise and technical vocabulary all affect it. Treat dictation as a fast first draft, not a transcript of record."],
    ],
  },

  "Role-Based Access": {
    eyebrow: "Roles and permissions",
    title: "Three roles, checked on the server.",
    lead: "What you can do is decided where it cannot be edited — not in the browser.",
    sections: [
      {
        icon: "users",
        tone: "gold",
        title: "The roles",
        points: [
          ["Customer", "The default for every new account. Full control of your own notes and nobody else's."],
          ["Delegate", "For collaboration, with boundaries — additional access without handing over the whole workspace."],
          ["Admin", "Manages accounts and role assignments. An administrative role over the workspace, not a key to everyone's notes."],
        ],
      },
      {
        icon: "shield",
        tone: "violet",
        title: "How they are enforced",
        points: [
          ["Resolved by a dedicated service", "Roles live in their own service and are looked up per user, so permissions are not something the notes service can be talked into by a request."],
          ["Carried in the signed token, verified per request", "Your roles ride in the session token, which is signature-checked before any handler runs. Editing them client-side invalidates the token rather than granting access."],
          ["The interface reflects your role; it does not grant it", "Hidden buttons are a convenience. The check that matters happens on the server, on every call."],
        ],
      },
    ],
    limits: [
      ["Roles are assigned, not requested", "There is no self-service escalation. Becoming a Delegate or Admin requires an existing administrator to grant it."],
    ],
  },

  "Private & Secure": {
    eyebrow: "Your notes",
    title: "Yours, and structurally so.",
    lead: "Isolation enforced in the database query, not in what the page chooses to render.",
    sections: [
      {
        icon: "lock",
        tone: "rose",
        title: "How isolation works",
        points: [
          ["Your account id is part of every lookup", "A note is fetched by its id *and* your owner id together. A note belonging to someone else does not fail a permission check — it simply is not among the rows that can be returned."],
          ["Asking for someone else's note looks like asking for nothing", "The answer is 'not found', not 'not allowed'. The difference matters: the second confirms the note exists."],
          ["It applies to every operation", "Reading, updating, archiving, deleting and summarising are all scoped the same way. There is no path that skips it."],
        ],
      },
      {
        icon: "shield",
        tone: "aqua",
        title: "What is never exposed",
        points: [
          ["Your password hash", "Excluded from serialisation, so no endpoint can return it by accident — including ones written later."],
          ["Your two-factor secret", "Same treatment. Anyone holding it could generate valid codes, so it never leaves the database."],
        ],
      },
    ],
    limits: [
      ["The server can read your notes", "Note bodies are stored as readable text, because summarising, searching and linking them requires reading them. 'Private' here means other users cannot reach your notes — not that the system is unable to."],
    ],
  },
};

/**
 * The posts.
 *
 * These open in place rather than linking to articles that do not exist. The
 * design shipped three cards whose "Read article" link went nowhere — a link
 * that does nothing is worse than no link, and inventing three blog posts to
 * satisfy it would have been worse still.
 *
 * Keyed by `modal` in landingContent.js POSTS.
 */
export const POSTS = {
  "Getting Started": {
    eyebrow: "First steps",
    title: "Getting started with Secure Vault.",
    lead: "From an empty account to a working, private workspace.",
    sections: [
      {
        icon: "check",
        tone: "aqua",
        title: "The short version",
        points: [
          ["Create an account", "Email and password, or sign in with Google or GitHub. Nothing else is asked for."],
          ["Write your first note", "A full rich-text editor — headings, lists, code blocks, links. Or press the microphone and talk instead."],
          ["Let it index", "Saving a note embeds it and extracts the people, projects and concepts inside it. That is what makes search and the knowledge graph work later."],
          ["Ask it something", "Once you have a few notes, ask a question across all of them. Every answer cites the notes it drew from."],
        ],
      },
      {
        icon: "shield",
        tone: "violet",
        title: "Worth doing early",
        points: [
          ["Turn on two-factor authentication", "It is off by default. Settings, then Security. Takes about a minute and closes the largest gap in any account."],
          ["Add an AI provider key", "The AI features run on your own key, so your usage is yours. Settings, then AI provider keys."],
        ],
      },
    ],
    limits: [
      ["The AI features need a key before they do anything", "Summaries, chat and semantic search all call a model. Without a provider key configured, those parts of the app will tell you so rather than failing quietly."],
    ],
  },

  "How Your Notes Are Protected": {
    eyebrow: "Notes on privacy",
    title: "What we encrypt, and what we do not.",
    lead: "The distinction matters more than the word 'secure' does.",
    sections: [
      {
        icon: "lock",
        tone: "rose",
        title: "What is encrypted",
        points: [
          ["Your password", "Hashed with BCrypt — not encrypted, hashed, which means there is no key that turns it back. A database dump does not reveal it."],
          ["Your two-factor secret and AI provider keys", "Held so they cannot be read straight out of the database, and excluded from every API response. The provider key uses Fernet: AES-128-CBC with an HMAC-SHA256 signature."],
        ],
      },
      {
        icon: "users",
        tone: "gold",
        title: "What isolates your notes instead",
        points: [
          ["Ownership, enforced in the query", "Your account id is part of every note lookup, in the SQL itself. Another person's note is not refused — it is not among the rows that can come back."],
          ["Asking for someone else's note looks like asking for nothing", "The answer is 'not found', not 'not allowed'. The second would confirm the note exists."],
        ],
      },
    ],
    limits: [
      ["Note bodies are stored as readable text", "Summarising, searching and linking your notes all require reading them, so the server can. 'Private' here means no other user can reach your notes — not that the system is unable to. If you need the stronger guarantee, you need a tool without AI features, and that is a real trade rather than a marketing one."],
    ],
  },
};
