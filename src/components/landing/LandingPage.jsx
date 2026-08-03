import { useState } from "react";
import { useNavigate } from "react-router-dom";

import LandingIcon from "./LandingIcon";
import LandingModal from "./LandingModal";
import FeedbackCarousel from "./FeedbackCarousel";
import VoiceDemo from "./VoiceDemo";
import { FEATURES as FEATURE_MODALS, SECURITY, POSTS as POST_MODALS } from "./landingModalContent";
import {
  CTA,
  FEATURE_CARDS,
  HERO,
  POSTS,
  ROLES,
  SECURITY_POINTS,
} from "./landingContent";

// The landing page from the Figma Make design (BuildLandingPage/src/App.tsx).
//
// Ported rather than copied: the export was a single TSX component with every
// button inert and every link pointing at "#top". Structure, markup and class
// names are unchanged so the design's stylesheet still applies exactly; what
// changed is that the controls now do what they appear to do.

/** The design's pill button. `onClick` is new — the export had none. */
const LandingButton = ({ children, secondary = false, onClick }) => (
  <button
    type="button"
    className={`button ${secondary ? "button-secondary" : ""}`}
    onClick={onClick}
  >
    {children}
    <LandingIcon name="arrow" />
  </button>
);

export default function LandingPage() {
  const navigate = useNavigate();
  // Which modal is open, keyed by its entry. null = none.
  const [modal, setModal] = useState(null);


  return (
    <main>
      {/* ---------------- HERO ---------------- */}
      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <LandingIcon name="bolt" /> {HERO.eyebrow}
          </p>
          <h1>
            {HERO.headline[0]}
            <br />
            <em>{HERO.headline[1]}</em>
            {HERO.headline[2]}
          </h1>
          <p className="lead">{HERO.lead}</p>
          <div className="actions">
            <LandingButton onClick={() => navigate(HERO.primary.to)}>
              {HERO.primary.label}
            </LandingButton>
            <LandingButton secondary onClick={() => navigate(HERO.secondary.to)}>
              {HERO.secondary.label}
            </LandingButton>
          </div>
          <div className="trust">
            <div className="avatars">
              <i>A</i>
              <i>B</i>
              <i>C</i>
              <i>D</i>
            </div>
            <div>
              <strong>★★★★★</strong>
              <small>Trusted by 10,000+ users</small>
            </div>
          </div>
        </div>

        <div className="note-stage">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="app-window">
            <div className="window-bar">
              <b />
              <b />
              <b />
              <span>Secure Vault — private workspace</span>
            </div>
            <div className="window-content">
              <aside>
                <span className="mini-logo">✦</span>
                <span className="selected">⌂</span>
                <span>▤</span>
                <span>♙</span>
              </aside>
              <article>
                <div className="note-meta">TODAY · VOICE NOTE</div>
                <h3>
                  Ideas for the next
                  <br />
                  quiet revolution.
                </h3>
                <p>“Trust is not a feature. It is the foundation.”</p>
                <div className="recording">
                  <LandingIcon name="mic" />
                  <div className="wave">▂▄▆█▆▄▃▅█▆▄▂</div>
                  <b>00:18</b>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section id="features" className="section shell">
        <header className="section-head">
          <p className="eyebrow">Built around your privacy</p>
          <h2>
            Why choose <em>Secure Vault?</em>
          </h2>
          <p>Security-first tools for capturing the thoughts that matter.</p>
        </header>
        <div className="feature-grid">
          {FEATURE_CARDS.map(({ icon, title, text, tone }) => (
            <button
              type="button"
              className="glass feature"
              key={title}
              onClick={() => setModal(FEATURE_MODALS[title])}
              aria-haspopup="dialog"
            >
              <span className={`feature-icon ${tone}`}>
                <LandingIcon name={icon} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="feature-more">
                Read more <LandingIcon name="arrow" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ---------------- SECURITY ---------------- */}
      <section id="security" className="section security">
        <div className="shell split">
          <div>
            <p className="eyebrow">Security is not optional</p>
            <h2>
              Your private space,
              <br />
              <em>by design.</em>
            </h2>
            <p className="lead">
              Secure Vault gives you control over who sees what, while keeping
              the everyday experience delightfully simple.
            </p>
            <ul>
              {SECURITY_POINTS.map((point) => (
                <li key={point}>
                  <LandingIcon name="check" />
                  {point}
                </li>
              ))}
            </ul>
            <LandingButton onClick={() => setModal(SECURITY)}>
              Explore security
            </LandingButton>
          </div>

          <div className="security-card glass">
            <div className="shield">
              <LandingIcon name="shield" />
            </div>
            <p>Protection status</p>
            <h3>All systems secure</h3>
            <div className="secure-row">
              <span>Encryption</span>
              <b>Active</b>
            </div>
            <div className="secure-row">
              <span>Two-factor auth</span>
              <b>Enabled</b>
            </div>
            <div className="secure-row">
              <span>Workspace access</span>
              <b>Private</b>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- ROLES ---------------- */}
      <section className="section shell roles">
        <div className="role-art">
          <div className="access-ring">
            <LandingIcon name="users" />
          </div>
          <span className="role-float admin">
            Admin
            <br />
            <b>Full control</b>
          </span>
          <span className="role-float delegate">
            Delegate
            <br />
            <b>Shared access</b>
          </span>
          <span className="role-float customer">
            Customer
            <br />
            <b>Private notes</b>
          </span>
        </div>
        <div>
          <p className="eyebrow">One workspace, clear boundaries</p>
          <h2>
            Access that feels
            <br />
            <em>natural.</em>
          </h2>
          <p className="lead">
            Invite the right people with the right level of access—no
            complicated setup required.
          </p>
          <div className="role-list">
            {ROLES.map(([name, description], index) => (
              <div key={name}>
                <span>0{index + 1}</span>
                <p>
                  <b>{name}</b>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- VOICE ---------------- */}
      <section className="voice shell">
        <div className="voice-wave">〰〰〰〰〰〰〰</div>
        <div>
          <p className="eyebrow aqua-text">
            <LandingIcon name="mic" /> Voice commands
          </p>
          <h2>
            Speak your notes
            <br />
            into existence.
          </h2>
          <p>
            Simply press the mic and start talking. Advanced speech-to-text
            captures your thoughts with remarkable accuracy.
          </p>
          <VoiceDemo onReadMore={() => setModal(FEATURE_MODALS["Voice Commands"])} />
        </div>
      </section>

      {/* ---------------- COMMUNITY ---------------- */}
      <FeedbackCarousel />

      {/* ---------------- POSTS ---------------- */}
      <section id="posts" className="section shell">
        <header className="section-head">
          <p className="eyebrow">Notes on privacy</p>
          <h2>
            Latest <em>posts.</em>
          </h2>
          <p>Ideas, guides, and a clearer look at secure note-taking.</p>
        </header>
        <div className="post-grid">
          {POSTS.map((post) => (
            <button
              type="button"
              className="glass post"
              key={post.title}
              onClick={() => setModal(POST_MODALS[post.modal])}
              aria-haspopup="dialog"
            >
              <img src={post.image} alt="" loading="lazy" />
              <div>
                <small>SECURE VAULT TEAM</small>
                <h3>{post.title}</h3>
                <p>{post.text}</p>
                <span className="post-link">
                  Read article <LandingIcon name="arrow" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="cta">
        <div className="shell">
          <p className="eyebrow">{CTA.eyebrow}</p>
          <h2>
            {CTA.headline[0]}
            <br />
            <em>{CTA.headline[1]}</em>
          </h2>
          <p>{CTA.lead}</p>
          <LandingButton onClick={() => navigate(CTA.action.to)}>
            {CTA.action.label}
          </LandingButton>
        </div>
      </section>

      <LandingModal
        entry={modal}
        open={Boolean(modal)}
        onClose={() => setModal(null)}
      />
    </main>
  );
}
