import { useNavigate } from "react-router-dom";

import { BRAND, scrollToTop } from "./landingNav";

/**
 * The glass footer from the Figma design.
 *
 * "Privacy", "Terms" and "Contact" have no pages behind them yet, so they are
 * rendered as plain text rather than as links that go nowhere — a link that
 * does nothing when clicked is worse than no link. Give them routes and they
 * become anchors again.
 */
const FOOTER_LINKS = ["Privacy", "Terms", "Contact"];

export default function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer className="footer-wrap">
      <div className="footer shell glass-footer">
        <div className="footer-top">
          <div>
            <a
              className="brand"
              href="/"
              onClick={(event) => {
                event.preventDefault();
                navigate("/");
              }}
            >
              <span className="brand-mark">✦</span> {BRAND}
            </a>
            <p>Private thoughts, beautifully protected.</p>
          </div>
          <a
            className="back-top"
            href="#top"
            onClick={(event) => {
              event.preventDefault();
              scrollToTop();
            }}
          >
            Back to top <span>↑</span>
          </a>
        </div>

        <div className="footer-bottom">
          <small>
            © {new Date().getFullYear()} {BRAND}. All rights reserved.
          </small>
          <div className="footer-links">
            {FOOTER_LINKS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <small>Made for clear minds.</small>
        </div>
      </div>
    </footer>
  );
}
