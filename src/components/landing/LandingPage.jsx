import { useState } from "react";
import { useNavigate } from "react-router-dom";

import LandingIcon from "./LandingIcon";
import { scrollToSection } from "./landingNav";

// The landing page from the Figma Make design (BuildLandingPage/src/App.tsx).
//
// Ported rather than copied: the export was a single TSX component with every
// button inert and every link pointing at "#top". Structure, markup and class
// names are unchanged so the design's stylesheet still applies exactly; what
// changed is that the controls now do what they appear to do.

const FEATURES = [
  ["shield", "2FA Protection", "Mandatory two-factor authentication keeps your notes safe", "violet"],
  ["mic", "Voice Commands", "Create notes hands-free with speech-to-text technology", "aqua"],
  ["users", "Role-Based Access", "Customer, Admin, and Delegate roles with distinct permissions", "gold"],
  ["lock", "Private & Secure", "Each user can only see and manage their own notes", "rose"],
];

const SECURITY_POINTS = [
  "End-to-end encrypted notes",
  "Mandatory two-factor authentication",
  "Granular permission controls",
  "Your data stays yours",
];

const ROLES = [
  ["Customer", "Your personal sanctuary for private thought."],
  ["Delegate", "Collaborate without losing your boundaries."],
  ["Admin", "Guide the workspace with full visibility."],
];

const TESTIMONIALS = [
  ["SecureNotes is the rare tool that makes me feel more focused and more protected at the same time.", "Maya Torres", "Product designer"],
  ["The voice capture changes everything. My best ideas no longer disappear between meetings.", "Elliot Park", "Founder, Plantroom"],
  ["Our team finally has an intuitive way to share context without compromising privacy.", "Naomi Okafor", "Operations lead"],
];

const POSTS = [
  ["https://images.unsplash.com/photo-1633412802994-5c058f151b66?auto=format&fit=crop&w=900&q=80", "Role-Based Access: Why It Matters", "Understanding how role-based access control keeps every thought private."],
  ["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80", "Voice Commands: The Future of Note-Taking", "Discover a calmer way to capture ideas the moment they arrive."],
  ["https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80", "Getting Started with SecureNotes", "A simple guide to creating your first protected workspace."],
];

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
  const [voiceActive, setVoiceActive] = useState(false);

  // Every call to action goes through sign up or log in — never straight to
  // the dashboard. This is the public page; it reads the same for everyone,
  // and a signed-in visitor loses nothing by passing through /login.
  const handleVoice = () => setVoiceActive((active) => !active);

  return (
    <main>
      {/* ---------------- HERO ---------------- */}
      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <LandingIcon name="bolt" /> Voice-powered security
          </p>
          <h1>
            Your thoughts.
            <br />
            <em>Secured</em> by voice.
          </h1>
          <p className="lead">
            Create, manage, and protect your digital notes with voice commands,
            two-factor authentication, and role-based access control.
          </p>
          <div className="actions">
            <LandingButton onClick={() => navigate("/signUp")}>
              Get started free
            </LandingButton>
            <LandingButton secondary onClick={() => navigate("/login")}>
              Log in
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
          {FEATURES.map(([icon, title, text, tone]) => (
            <article className="glass feature" key={title}>
              <span className={`feature-icon ${tone}`}>
                <LandingIcon name={icon} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
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
            <LandingButton onClick={() => scrollToSection("features")}>
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
          <button
            type="button"
            className={`listen ${voiceActive ? "listening" : ""}`}
            onClick={handleVoice}
          >
            <LandingIcon name="mic" />
            {voiceActive ? "Listening… tap to stop" : "Try voice capture"}
          </button>
        </div>
        <small>VOICE-TO-TEXT: {voiceActive ? "LISTENING" : "READY"}</small>
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section id="stories" className="section shell">
        <header className="section-head">
          <p className="eyebrow">From the community</p>
          <h2>
            Trusted with their
            <br />
            <em>best thinking.</em>
          </h2>
        </header>
        <div className="testimonial-grid">
          {TESTIMONIALS.map(([quote, name, role]) => (
            <blockquote className="glass" key={name}>
              <LandingIcon name="quote" />
              <p>“{quote}”</p>
              <footer>
                <i>{name.charAt(0)}</i>
                <span>
                  <b>{name}</b>
                  <small>{role}</small>
                </span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* ---------------- POSTS ---------------- */}
      <section className="section shell">
        <header className="section-head">
          <p className="eyebrow">Notes on privacy</p>
          <h2>
            Latest <em>posts.</em>
          </h2>
          <p>Ideas, guides, and a clearer look at secure note-taking.</p>
        </header>
        <div className="post-grid">
          {POSTS.map(([img, title, text]) => (
            <article className="glass post" key={title}>
              <img src={img} alt="" loading="lazy" />
              <div>
                <small>SECURE VAULT TEAM · 12 MAR 2026</small>
                <h3>{title}</h3>
                <p>{text}</p>
                <a href="#top" onClick={(e) => e.preventDefault()}>
                  Read article <LandingIcon name="arrow" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="cta">
        <div className="shell">
          <p className="eyebrow">A calmer place to think</p>
          <h2>
            Ready to secure your
            <br />
            <em>notes?</em>
          </h2>
          <p>
            Join thousands of people who trust Secure Vault with what matters
            most.
          </p>
          <LandingButton onClick={() => navigate("/signUp")}>
            Start securing your notes
          </LandingButton>
        </div>
      </section>
    </main>
  );
}
