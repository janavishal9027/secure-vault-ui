import { useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import LandingIcon from "./LandingIcon";

// A real demo, not a mime.
//
// The design's button toggled a cosmetic "listening" label. Since the product's
// whole pitch is dictation, a button that says "Try voice capture" and captures
// nothing is the worst version of this section — so this runs the same browser
// speech API the note editor uses, and shows the words as they arrive.
//
// What it deliberately does NOT do is save anything. There is nowhere to save
// to without an account, and quietly discarding someone's words would be worse
// than saying up front that this is a demo.

const DEMO_LIMIT_MS = 20_000;

const isSupported = () =>
  typeof window !== "undefined" &&
  Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

export default function VoiceDemo({ onReadMore }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [notice, setNotice] = useState("");
  const recognitionRef = useRef(null);
  const stopTimerRef = useRef(null);

  const stop = useCallback(() => {
    clearTimeout(stopTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {
        // already stopped
      }
    }
    setListening(false);
  }, []);

  // Release the microphone if someone navigates away mid-capture.
  useEffect(() => () => stop(), [stop]);

  const start = () => {
    if (listening) {
      stop();
      return;
    }

    // Same two checks the editor makes, and for the same reasons: the API
    // needs a secure context, and it only exists in Chromium browsers.
    if (!window.isSecureContext) {
      setNotice("Voice capture needs a secure connection — try https, or localhost.");
      return;
    }
    if (!isSupported()) {
      setNotice("Your browser does not support voice capture. Try Chrome or Edge.");
      return;
    }

    const Impl = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Impl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    setNotice("");
    setTranscript("");

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i][0]?.transcript || "";
      }
      setTranscript(text.trim());
    };

    recognition.onerror = (event) => {
      if (event?.error === "no-speech") return; // fires on any pause
      if (event?.error === "not-allowed") {
        setNotice("Microphone permission denied. Allow it for this site and try again.");
      }
      stop();
    };

    recognition.onend = () => setListening(false);

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
      // A demo, not a session. Twenty seconds is enough to prove it works
      // without holding someone's microphone open on a marketing page.
      stopTimerRef.current = setTimeout(stop, DEMO_LIMIT_MS);
    } catch (_) {
      setNotice("Could not start voice capture.");
    }
  };

  return (
    <>
      <button
        type="button"
        className={`listen ${listening ? "listening" : ""}`}
        onClick={start}
      >
        <LandingIcon name="mic" />
        {listening ? "Listening… tap to stop" : "Try voice capture"}
      </button>

      {/* The demo's output. Present only once there is something to show, so
          the section does not carry an empty box at rest. */}
      {(transcript || notice) && (
        <div className="voice-demo-output" role="status" aria-live="polite">
          {notice ? (
            <span className="voice-demo-notice">{notice}</span>
          ) : (
            <>
              <span className="voice-demo-text">{transcript}</span>
              <span className="voice-demo-hint">
                This is a demo — nothing here is saved.{" "}
                <RouterLink to="/login">Log in</RouterLink> to dictate into a
                real note.
              </span>
            </>
          )}
        </div>
      )}

      <button type="button" className="voice-read-more" onClick={onReadMore}>
        Read more <LandingIcon name="arrow" />
      </button>
    </>
  );
}
