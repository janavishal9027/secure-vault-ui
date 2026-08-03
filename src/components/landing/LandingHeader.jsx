import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import LandingIcon from "./LandingIcon";
import { BRAND, scrollToSection } from "./landingNav";
import { NAV } from "./landingContent";
import { useThemeMode } from "../theme/ThemeModeContext";

/** Fallback threshold, used only if the hero's buttons cannot be found. */
const FALLBACK_SCROLL_PX = 320;

/**
 * The glass nav from the Figma design.
 *
 * The export had every link as `href="#top"` and no click handlers — fine for
 * a design preview, not for the page this replaces, whose header did navigate.
 * The section links scroll to anchors that exist below; the auth links route.
 *
 * The landing page always sends people through log in / sign up, never
 * straight to the dashboard. It is the public face of the product, so it reads
 * the same for everyone — and going via /login costs a signed-in user nothing,
 * since RequireAuth lets a valid session through to where it was headed.
 */
export default function LandingHeader() {
  const navigate = useNavigate();
  const { mode, toggleMode } = useThemeMode();
  const [navOpen, setNavOpen] = useState(false);
  // Whether the header should show its own Log in / Get started pair.
  const [showAuth, setShowAuth] = useState(false);

  // Reveal the header's auth buttons only once the hero's own pair has
  // scrolled away.
  //
  // Tied to the actual element rather than a pixel threshold: the hero's height
  // moves with viewport width, font size and copy length, so any fixed number
  // is right at one window size and wrong at the rest — showing two identical
  // calls to action at once, or leaving a gap with none.
  useEffect(() => {
    const heroActions = document.querySelector(".landing-root .hero .actions");

    if (!heroActions || typeof IntersectionObserver === "undefined") {
      const onScroll = () => setShowAuth(window.scrollY > FALLBACK_SCROLL_PX);
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }

    // `rootMargin` accounts for the fixed header's own height, so the swap
    // happens as the hero buttons pass behind it rather than at the very top
    // of the viewport.
    const observer = new IntersectionObserver(
      ([entry]) => setShowAuth(!entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(heroActions);
    return () => observer.disconnect();
  }, []);

  const go = (path) => (event) => {
    event.preventDefault();
    setNavOpen(false);
    navigate(path);
  };

  const jump = (id) => (event) => {
    event.preventDefault();
    setNavOpen(false);
    scrollToSection(id);
  };

  return (
    <header className={`site-header ${showAuth ? "auth-visible" : ""}`}>
      <nav className="nav glass-nav" aria-label="Main navigation">
        <a className="brand" href="/" onClick={go("/")}>
          <span className="brand-mark">✦</span> {BRAND}
        </a>

        {/* Rendered from the same list the page renders its sections from,
            so a renamed or reordered section cannot leave the nav pointing at
            an anchor that no longer exists. */}
        <div className="nav-center">
          {NAV.map((section) => (
            <a key={section.id} href={`#${section.id}`} onClick={jump(section.id)}>
              {section.label}
            </a>
          ))}
        </div>

        {/* Always visible, unlike the auth pair: the mode toggle is the only
            way to reach light mode from the public page, so hiding it until
            scroll would strand anyone who wanted it on arrival. */}
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleMode}
          aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={mode === "dark" ? "Light mode" : "Dark mode"}
        >
          <LandingIcon name={mode === "dark" ? "sun" : "moon"} />
        </button>

        {/* Hidden until the hero's buttons scroll past — see the observer
            above. `aria-hidden` and `inert` keep them out of the tab order
            while invisible, so keyboard focus cannot land on a control nobody
            can see. */}
        <div className="nav-actions" aria-hidden={!showAuth} inert={!showAuth}>
          <a className="login-link" href="/login" onClick={go("/login")}>
            Log in
          </a>
          <a className="nav-cta" href="/signUp" onClick={go("/signUp")}>
            Get started <LandingIcon name="arrow" />
          </a>
        </div>

        <button
          className="nav-toggle"
          onClick={() => setNavOpen((open) => !open)}
          aria-label="Toggle navigation"
          aria-expanded={navOpen}
        >
          ☰
        </button>

        <div className={`nav-links ${navOpen ? "open" : ""}`}>
          {NAV.map((section) => (
            <a key={section.id} href={`#${section.id}`} onClick={jump(section.id)}>
              {section.label}
            </a>
          ))}
          <a href="/login" onClick={go("/login")}>
            Log in
          </a>
          <a className="nav-cta" href="/signUp" onClick={go("/signUp")}>
            Get started <LandingIcon name="arrow" />
          </a>
        </div>
      </nav>
    </header>
  );
}
