import LandingHeader from "../landing/LandingHeader";
import LandingPage from "../landing/LandingPage";
import LandingFooter from "../landing/LandingFooter";
import "../landing/landing.css";
// After landing.css on purpose: landing.css is generated from the Figma export
// and gets overwritten by a re-port, so our own adjustments live separately and
// load last.
import "../landing/landing.overrides.css";

// The marketing surface.
//
// This is the Figma Make design (landingpage/BuildLandingPage), ported in place
// of the previous MUI sections. It is deliberately always dark and styles
// itself entirely through `landing.css` rather than the app's MUI theme — so
// unlike before, there is no nested ThemeProvider here. Nothing inside draws
// from `theme.palette`, so there is no light-mode palette to guard against.
//
// `.landing-root` is what keeps the two worlds apart: every rule in
// landing.css is scoped under it, so the design's global-looking styles
// (`h1`, `p`, `button`, `a`, `blockquote`) stop at this wrapper and never
// reach the dashboard.
const Homepage = () => (
  <div className="landing-root">
    <LandingHeader />
    <LandingPage />
    <LandingFooter />
  </div>
);

export default Homepage;
