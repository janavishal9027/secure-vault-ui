// Inline SVG icon set from the Figma Make design.
//
// Kept as raw paths rather than swapped for @mui/icons-material: the design's
// stroke weight (1.8) and rounded caps are part of its look, and the MUI
// equivalents are filled glyphs with a different optical weight. Nine icons is
// not worth losing that over.

const PATHS = {
  shield: <path d="M12 3 4.7 6v5.5c0 4.5 3.1 7.8 7.3 9.5 4.2-1.7 7.3-5 7.3-9.5V6L12 3Zm-2.8 9 1.8 1.8 4-4" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20v-1.5A4.5 4.5 0 0 1 8 14h2a4.5 4.5 0 0 1 4.5 4.5V20M16 5.5a3 3 0 0 1 0 5.8M18 14a4.5 4.5 0 0 1 2.5 4v2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3" />
    </>
  ),
  arrow: <path d="M5 12h13M13 6l6 6-6 6" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  check: <path d="m5 12 4 4L19 6" />,
  quote: <path d="M7 10h4v7H5v-5c0-3 1.5-5 4.5-6L10 8c-1.8.6-3 1.2-3 2Zm9 0h4v7h-6v-5c0-3 1.5-5 4.5-6L19 8c-1.8.6-3 1.2-3 2Z" />,
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7l0-7Z" />,
};

const LandingIcon = ({ name, className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {PATHS[name]}
  </svg>
);

export default LandingIcon;
