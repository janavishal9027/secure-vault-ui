import { useCallback, useEffect, useRef, useState } from "react";

import LandingIcon from "./LandingIcon";
import { getPublicFeedbackService } from "../store/services/FeedbackService";

// Real feedback, from the database.
//
// This replaces three invented testimonials attributed to three invented
// people. The difference that matters is not the styling — it is that nothing
// here is displayed unless somebody actually wrote it.
//
// Which is also why the empty state says so plainly rather than falling back to
// placeholder quotes. A carousel with nothing in it is honest; a carousel with
// fabricated quotes in it is the thing we removed.

const VISIBLE = 3; // cards per slide on desktop
const AUTOPLAY_MS = 6000;

const initials = (name) =>
  (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export default function FeedbackCarousel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getPublicFeedbackService()
      .then((res) => {
        if (cancelled) return;
        // The API already returns newest-first, capped at ten — so the most
        // recent person to write something leads the carousel, and the
        // eleventh displaces the oldest rather than never appearing.
        setItems(res.data?.data || []);
      })
      .catch(() => {
        // A landing page must render if this service is down. No error state:
        // the section simply does not appear.
        if (!cancelled) setItems([]);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const pageCount = Math.max(1, Math.ceil(items.length / VISIBLE));

  const next = useCallback(
    () => setPage((p) => (p + 1) % pageCount),
    [pageCount],
  );

  useEffect(() => {
    if (paused || pageCount <= 1) return undefined;
    timerRef.current = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [paused, pageCount, next]);

  // Nothing to show yet, and nothing invented to fill it with.
  if (loading || items.length === 0) return null;

  const start = page * VISIBLE;
  const slide = items.slice(start, start + VISIBLE);

  return (
    <section id="community" className="section shell">
      <header className="section-head">
        <p className="eyebrow">From the community</p>
        <h2>
          Trusted with their
          <br />
          <em>best thinking.</em>
        </h2>
      </header>

      <div
        className="feedback-viewport"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        // Autoplay must stop when someone tabs in, or focus moves under them.
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        aria-roledescription="carousel"
        aria-label="What people say"
      >
        <div className="testimonial-grid" key={page}>
          {slide.map((item) => (
            <blockquote className="glass" key={item.id}>
              <LandingIcon name="quote" />
              <p>“{item.comment}”</p>
              <footer>
                <i>{initials(item.displayName)}</i>
                <span>
                  <b>{item.displayName}</b>
                  {item.roleTitle && <small>{item.roleTitle}</small>}
                </span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>

      {pageCount > 1 && (
        <div className="feedback-controls">
          <button
            type="button"
            className="feedback-dot-nav"
            onClick={() => setPage((p) => (p - 1 + pageCount) % pageCount)}
            aria-label="Previous"
          >
            ‹
          </button>
          <div className="feedback-dots" role="tablist">
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === page}
                aria-label={`Slide ${i + 1} of ${pageCount}`}
                className={`feedback-dot ${i === page ? "active" : ""}`}
                onClick={() => setPage(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="feedback-dot-nav"
            onClick={next}
            aria-label="Next"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}
