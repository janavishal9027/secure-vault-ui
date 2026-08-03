import { Dialog, IconButton } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import LandingIcon from "./LandingIcon";

/**
 * The shared modal shell for the landing page.
 *
 * MUI's Dialog supplies the parts that are tedious and easy to get wrong —
 * focus trap, Escape, scroll lock, aria wiring, restoring focus to whatever
 * opened it. The look comes from the landing tokens, so it belongs to this
 * page rather than to the dashboard's theme.
 *
 * Content lives in `landingModalContent.js`; this file only knows how to lay
 * it out. That split is what keeps five modals from becoming five copies of
 * the same Dialog boilerplate that drift apart.
 */
export default function LandingModal({ entry, open, onClose }) {
  if (!entry) return null;

  const { eyebrow, title, lead, sections = [], limits = [] } = entry;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="landing-modal-title"
      slotProps={{
        paper: {
          className: "landing-root",
          sx: {
            background: "var(--l-bg-2)",
            backgroundImage: "none",
            border: "1px solid rgba(var(--l-ov),0.14)",
            borderRadius: "20px",
            color: "var(--l-text)",
            boxShadow: "0 30px 80px rgba(var(--l-shadow),0.45)",
            // Same rule as the note panel: `border-radius` does not clip a
            // scrollbar, so a rounded dialog that scrolls itself shows the
            // bar's ends past the curve. The dialog clips here and the body
            // below scrolls, which is why `scroll="paper"` is not used.
            overflow: "hidden",
          },
        },
        backdrop: {
          sx: {
            backgroundColor: "rgba(var(--l-shadow),0.6)",
            backdropFilter: "blur(3px)",
          },
        },
      }}
    >
      <div className="security-modal">
        <header className="security-modal-head">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 id="landing-modal-title">{title}</h2>
            {lead && <p className="security-modal-lead">{lead}</p>}
          </div>
          <IconButton
            onClick={onClose}
            aria-label="Close"
            sx={{
              color: "var(--l-text-2)",
              border: "1px solid rgba(var(--l-ov),0.16)",
              "&:hover": {
                color: "var(--l-text)",
                background: "rgba(var(--l-ov),0.08)",
              },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </header>

        <div className="security-modal-body">
          {sections.map((section) => (
            <section key={section.title} className="security-block">
              <div className="security-block-head">
                <span className={`feature-icon ${section.tone || ""}`}>
                  <LandingIcon name={section.icon} />
                </span>
                <h3>{section.title}</h3>
              </div>
              <dl>
                {section.points.map(([term, detail]) => (
                  <div key={term}>
                    <dt>
                      <LandingIcon name="check" />
                      {term}
                    </dt>
                    <dd>{detail}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          {/* Present on every modal that has one. Naming the limits is what
              makes the claims above worth reading, so it is laid out as a peer
              of the other blocks rather than as small print at the bottom. */}
          {limits.length > 0 && (
            <section className="security-block security-limits">
              <div className="security-block-head">
                <span className="feature-icon">
                  <LandingIcon name="quote" />
                </span>
                <h3>What this does not do</h3>
              </div>
              <dl>
                {limits.map(([term, detail]) => (
                  <div key={term}>
                    <dt>{term}</dt>
                    <dd>{detail}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>
    </Dialog>
  );
}
