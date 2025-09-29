// Ok.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Single-file React version of the provided landing page.
 * - Pure JSX (no external CSS/JS)
 * - State-driven steps & progress
 * - Timed loading animation + final CTA
 * - Safe gtag() calls (no errors if gtag is missing)
 * - NEW: Dynamic state detection (IP-based) with ?state= override
 * - NEW: Extra age options: 45–65 and 65+
 *
 * Usage:
 *   import Ok from "./Ok.jsx";
 *   export default function App(){ return <Ok/> }
 */

export default function Ok() {
  // --------------------------
  // Step / Progress Management
  // --------------------------
  // Steps: 1,2,3,4(loading),5(sorry),6(final)
  const TOTAL_STEPS = 4; // used for the progress bar math (before sorry/final)
  const [currentStep, setCurrentStep] = useState(1);
  const [showProgress, setShowProgress] = useState(true);

  // Loader statuses
  const [status1Done, setStatus1Done] = useState(false);
  const [status2Done, setStatus2Done] = useState(false);
  const [status3Done, setStatus3Done] = useState(false);
  const [eligibilityText, setEligibilityText] = useState("");
  const [availabilityText, setAvailabilityText] = useState("");
  const [reservingText, setReservingText] = useState("");

  // Optional "urgency" UI
  const [countdown, setCountdown] = useState({ m: 5, s: 0 });
  const [agentCount, setAgentCount] = useState(4); // 2..5
  const countdownIntervalRef = useRef(null);
  const forecastIntervalRef = useRef(null);

  // "Wait time forecast" bars (optional visual). Heights in px.
  const [forecastHeights, setForecastHeights] = useState([22, 28, 34, 40]);
  const [futureTime, setFutureTime] = useState(getFutureTimeString(60)); // +1 hour

  // NEW: Dynamic state detection
  const [stateName, setStateName] = useState("your state");

  // Derived progress percentage (cap at 100 for sorry/final screens)
  const progressWidth = useMemo(() => {
    const shownStep = currentStep <= TOTAL_STEPS ? currentStep : TOTAL_STEPS; // clamp
    return Math.round((shownStep / TOTAL_STEPS) * 100);
  }, [currentStep]);

  // ------------
  // gtag helper
  // ------------
  const track = (event, params = {}) => {
    try {
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", event, params);
      }
    } catch (_) {
      // noop
    }
  };

  // ----------------
  // Step transitions
  // ----------------
const nextQuestion = (stepNumber, answer) => {
    // Step 1: always proceed to Step 2
    if (stepNumber === 1) {
      setCurrentStep(2);
      track("quiz_progress", {
        event_category: "quiz",
        event_label: "step_2",
        value: 2,
      });
      return;
    }

    // Step 2: always proceed to Step 3 (ignore yes/no)
    if (stepNumber === 2) {
      setCurrentStep(3);
      track("quiz_progress", {
        event_category: "quiz",
        event_label: "step_3",
        value: 3,
      });
      return;
    }

    // Step 3: always proceed to Loading -> Final
    if (stepNumber === 3) {
      setCurrentStep(4);
      setShowProgress(false);
      startLoadingSequence();
      track("quiz_progress", {
        event_category: "quiz",
        event_label: "step_4_loading",
        value: 4,
      });
    }
  };

  // ----------------------
  // Loading step sequence
  // ----------------------
  const startLoadingSequence = () => {
    resetLoader();

    // 1) Eligibility
    setTimeout(() => {
      setStatus1Done(true);
      setEligibilityText("Eligible");
    }, 800);

    // 2) Agent availability
    setTimeout(() => {
      setStatus2Done(true);
      setAvailabilityText("Low");
    }, 1800);

    // 3) Reserve a spot
    setTimeout(() => {
      setStatus3Done(true);
      setReservingText("Reserved");
    }, 2800);

    // 4) Show final CTA and start countdown
    setTimeout(() => {
      setCurrentStep(6); // final
      maybeStartCountdown();
    }, 4000);
  };

  const resetLoader = () => {
    setStatus1Done(false);
    setStatus2Done(false);
    setStatus3Done(false);
    setEligibilityText("");
    setAvailabilityText("");
    setReservingText("");
  };

  // ----------------------
  // Countdown (final CTA)
  // ----------------------
  const maybeStartCountdown = () => {
    // Avoid multiple intervals
    if (countdownIntervalRef.current) return;

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        let { m, s } = prev;
        if (m === 0 && s === 0) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          return { m: 0, s: 0 };
        }
        if (s === 0) return { m: m - 1, s: 59 };
        return { m, s: s - 1 };
      });
    }, 1000);
  };

  // ------------------------------
  // Agent count + wait time chart
  // ------------------------------
  useEffect(() => {
    // Update future time initially
    setFutureTime(getFutureTimeString(60));

    // Agent count updates every ~8–15s
    const agentTimer = setTimeout(updateAgentCount, 2000);

    // Forecast bars update every 10–20s
    const startForecastInterval = () => {
      const delay = rand(10000, 20000);
      forecastIntervalRef.current = setInterval(() => {
        updateForecastBars();
      }, delay);
    };
    startForecastInterval();

    // Dynamic state detection (runs once)
    detectStateName();

    return () => {
      clearTimeout(agentTimer);
      if (forecastIntervalRef.current) clearInterval(forecastIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateAgentCount = () => {
    setAgentCount((c) => {
      let next = c;
      // Prefer decreasing (70% chance) until min 2; else allow increase to max 5
      if (Math.random() < 0.7 && c > 2) next = c - 1;
      else if (c < 5) next = c + 1;
      return next;
    });

    // schedule next update
    const nextUpdate = rand(8000, 15000);
    setTimeout(updateAgentCount, nextUpdate);
  };

  const updateForecastBars = () => {
    // Base progression: 15, 23, 31, 39 with ±8 variance, clamped 8..48
    const base = [15, 23, 31, 39];
    const newHeights = base.map((b) => clamp(b + rand(-8, 8), 8, 48));
    setForecastHeights(newHeights);

    // Also refresh the future time label occasionally
    setFutureTime(getFutureTimeString(60));
  };

  // ---------------
  // Dynamic State
  // ---------------
  async function detectStateName() {
    try {
      // Query param override (?state=Texas)
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const override = params.get("state") || params.get("st");
        if (override && override.trim().length > 0) {
          setStateName(cleanStateString(override));
          return;
        }
      }

      // Try ipapi.co first
      const ipapi = await safeJsonFetch("https://ipapi.co/json/");
      if (ipapi && (ipapi.region || ipapi.region_code)) {
        // ipapi.region is full name (e.g., "California")
        setStateName(ipapi.region || ipapi.region_code || "your state");
        return;
      }

      // Fallback: ipinfo.io
      const ipinfo = await safeJsonFetch("https://ipinfo.io/json?token=demo");
      if (ipinfo && (ipinfo.region || ipinfo.country)) {
        setStateName(ipinfo.region || ipinfo.country || "your state");
        return;
      }

      // Last resort
      setStateName("your state");
    } catch {
      setStateName("your state");
    }
  }

  // ---------------
  // Render helpers
  // ---------------
  const isActive = (n) => currentStep === n;
  const fmtCountdown = `${countdown.m}:${String(countdown.s).padStart(2, "0")}`;

  return (
    <div>
      <style>{css}</style>

      <header
        style={{
          background: "#421900",
          padding: "0.1rem 0",
          textAlign: "center",
          marginBottom: "0",
        }}
      >
        <img
          src="/headlogo.png"
          alt="Logo"
          style={{
            height: "55px",
            width: "auto",
            display: "block",
            margin: "0 auto",
            verticalAlign: "middle",
          }}
        />
      </header>

      <img
        src="/below.png"
        alt="Logo"
        style={{
          height: "48px",
          width: "auto",
          display: "block",
          margin: "0 auto",
        }}
      />

      <section className="main-hero">
        <div className="hero-wrapper">
          <div className="main-headline" style={{ marginTop: "-1.5rem" }}>
            <h1>
              <span
                style={{
                  background: "#fff700",
                  color: "#2c3e50",
                  padding: "0.2em 0.4em",
                  borderRadius: "4px",
                  boxShadow: "0 2px 8px rgba(255, 247, 0, 0.12)",
                  display: "inline-block",
                }}
              >
                Americans Over 25
              </span>{" "}
              Can Qualify For A Spending Allowance Card Worth Thousands Annually!
            </h1>
            <p>Answer basic questions below to see if you qualify</p>
          </div>

          <div className="quiz-container">
            {showProgress && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressWidth}%` }} />
              </div>
            )}

            {/* STEP 1 */}
            {isActive(1) && (
              <div className="question-step active" id="step1">
                <h3>1. Select Your Age Range:</h3>
                <div className="answer-options">
                  <button className="answer-btn" onClick={() => nextQuestion(1, "under_25")}>
                    Under 25 <span className="arrow">→</span>
                  </button>
                  <button className="answer-btn" onClick={() => nextQuestion(1, "25_45")}>
                    25–45 <span className="arrow">→</span>
                  </button>
                  {/* NEW OPTIONS */}
                  <button className="answer-btn" onClick={() => nextQuestion(1, "45_65")}>
                    45–65 <span className="arrow">→</span>
                  </button>
                  <button className="answer-btn" onClick={() => nextQuestion(1, "65_plus")}>
                    65+ <span className="arrow">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {isActive(2) && (
              <div className="question-step active" id="step2">
                <h3>2. Are you on Medicare or Medicaid?</h3>
                <div className="answer-options">
                  <button className="answer-btn" onClick={() => nextQuestion(2, "yes")}>
                    Yes <span className="arrow">→</span>
                  </button>
                  <button className="answer-btn" onClick={() => nextQuestion(2, "no")}>
                    No <span className="arrow">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {isActive(3) && (
              <div className="question-step active" id="step3">
                <h3>3. Do you live in {stateName}?</h3>
                <div className="answer-options">
                  <button className="answer-btn" onClick={() => nextQuestion(3, "yes_in_state")}>
                    Yes <span className="arrow">→</span>
                  </button>
                  <button className="answer-btn" onClick={() => nextQuestion(3, "no_out_state")}>
                    No <span className="arrow">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* LOADING STEP */}
            {isActive(4) && (
              <div className="question-step active" id="loadingStep">
                <div className="loader-container">
                  <div className="loader-spinner">
                    <div className="spinner-ring" />
                    <div className="spinner-ring" />
                    <div className="spinner-ring" />
                  </div>
                  <h3 className="loader-title">Checking Your Eligibility...</h3>

                  <div className="status-updates">
                    <div className={`status-item ${status1Done ? "completed" : ""}`} id="status1">
                      <span className="status-icon">⏳</span>
                      <span className="status-text">
                        Eligibility:{" "}
                        <span className={`status-result ${eligibilityText ? "eligible" : ""}`} id="eligibilityResult">
                          {eligibilityText}
                        </span>
                      </span>
                    </div>

                    <div className={`status-item ${status2Done ? "completed" : ""}`} id="status2">
                      <span className="status-icon">⏳</span>
                      <span className="status-text">
                        Agent availability:{" "}
                        <span className={`status-result ${availabilityText ? "eligible" : ""}`} id="availabilityResult">
                          {availabilityText}
                        </span>
                      </span>
                    </div>

                    <div className={`status-item ${status3Done ? "completed" : ""}`} id="status3">
                      <span className="status-icon">⏳</span>
                      <span className="status-text">
                        Reserving spot:{" "}
                        <span className={`status-result ${reservingText ? "reserved" : ""}`} id="reservingResult">
                          {reservingText}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="loader-subtitle">Please wait while we secure your eligibility...</div>
                </div>
              </div>
            )}

            {/* SORRY STEP */}
            {isActive(5) && (
              <div className="question-step active" id="sorryStep">
                <div className="final-cta">
                  <div>Sorry</div>
                  <h3>You did not qualify</h3>
                  <p>
                    Based on your answers, you do not meet the current eligibility
                    requirements for this final expense benefit program.
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "1.5rem" }}>
                    Thank you for your interest. You may check back in the future as
                    eligibility requirements may change.
                  </p>
                </div>
              </div>
            )}

            {/* FINAL CTA */}
            {isActive(6) && (
              <div className="question-step active" id="finalCTA">
                <div className="final-cta">
                  <div>Congratulations, You Qualify!</div>
                  <p>
                    Based on your answers, you are eligible to claim a Spending Allowance Card worth thousands of dollars a year!
                  </p>

                  {/* Optional urgency row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      margin: "10px 0 18px",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: 12, textAlign: "left", color: "var(--text-light)" }}>
                      ⏱️ Hold expires in <strong id="countdownTimer">{fmtCountdown}</strong>
                    </div>
                    <div style={{ fontSize: 12, textAlign: "right", color: "var(--text-light)" }}>
                      👨‍💼 <strong id="agentCount">{agentCount}</strong> live agent{agentCount !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <p className="cta-instruction-text" style={{ fontSize: "1.0625rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                    Tap below to call and claim now!
                  </p>

                  <a href="tel:+18556940234" className="call-cta-btn" onClick={() => track("call_click", { event_category: "cta" })}>
                    <svg
                      className="phone-icon"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div>
                      <div className="phone-number">855-694-0234</div>
                      <div className="cta-text">Call Now To Claim</div>
                    </div>
                  </a>

                  {/* Tiny forecast strip (optional visual) */}
                  <div style={{ marginTop: 18 }}>
                    <div style={{ fontSize: 12, color: "var(--text-light)", marginBottom: 6, textAlign: "center" }}>
                     Due to high call volume, your official agent is waiting for only 3 minutes, then your spot will not be reserved. <strong id="futureTime">{futureTime}</strong>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 8,
                        alignItems: "end",
                        height: 56,
                        padding: "0 8px",
                      }}
                    >
                      {forecastHeights.map((h, i) => (
                        <div
                          key={i}
                          id={`forecastBar${i + 1}`}
                          style={{
                            height: h,
                            borderRadius: 4,
                            background: "var(--border)",
                            transition: "height .8s ease",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="privacy-notice">
            <span className="shield" role="img" aria-label="lock">🔒</span>{" "}
            Your data is completely secure &amp; protected
          </div>
        </div>
        <br /><br /><br /><br />
      </section>

      <footer className="page-footer">
        <br /><br /><br /><br />
        <div className="footer-text">
          We're here to help you find ways to reduce your insurance costs through
          our service. This page includes affiliate links, which means we may earn
          a commission if you click through to our partnered insurance marketplace.
          Deal Radar is not an insurance agent or provider. The marketplace connects
          you with licensed local agents who can help you compare quotes. Specific
          savings or results are not guaranteed, as rates and eligibility vary by
          individual.
        </div>

        <div className="footer-navigation">
          <a href="https://savingshero.org/privacy.html">Privacy</a>
          <span className="footer-divider">|</span>
          <a href="https://savingshero.org/terms.html">Terms</a>
          <span className="footer-divider">|</span>
          <a href="https://savingshero.org/contact.html">Contact</a>
        </div>

        <div className="footer-copyright">© 2025 SavingsHero.org</div>
      </footer>
    </div>
  );
}

/* ------------------------- helpers ------------------------- */
function rand(min, max) {
  // inclusive
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function getFutureTimeString(addMinutes = 60) {
  const now = new Date();
  const future = new Date(now.getTime() + addMinutes * 60 * 1000);
  const h = future.getHours();
  const m = future.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  const hh = h % 12 || 12;
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}${ampm}`;
}
function cleanStateString(s) {
  return String(s).replace(/_/g, " ").trim();
}
async function safeJsonFetch(url, options = {}) {
  try {
    const res = await fetch(url, { ...options, cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch {
    return null;
  }
}

/* -------------------------- CSS ---------------------------- */
const css = `
:root {
  --primary: #003366;
  --accent: #00a86b;
  --bg-page: #f5f7fa;
  --bg-card: #ffffff;
  --text-main: #2c3e50;
  --text-light: #546e7a;
  --border: #e0e6ed;
  --error: #d32f2f;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: "Open Sans", -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--bg-page);
  color: var(--text-main);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
h1, h3, .countdown-timer, .phone-number { font-family: "Montserrat", sans-serif; }

.promo-header, .countdown-banner, .urgency-banner { display: none !important; }

.main-hero {
  background: var(--bg-card);
  color: var(--text-main);
  padding: 3rem 1.5rem 2rem;
  text-align: center;
  position: relative;
  border-bottom: 1px solid var(--border);
}
.hero-wrapper { max-width: 800px; margin: 0 auto; }

.main-headline h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary);
  line-height: 1.2;
  letter-spacing: -0.5px;
  text-shadow: none;
}
.main-headline p {
  font-size: 1.25rem;
  color: var(--text-light);
  margin-top: 1rem;
  font-weight: 400;
}

.quiz-container {
  background: var(--bg-card);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  border: 1px solid var(--border);
  padding: 2.5rem;
  margin: 3rem auto;
  max-width: 600px;
  position: relative;
}
.progress-bar {
  width: 100%;
  height: 10px;
  background: var(--border);
  border-radius: 3px;
  margin-bottom: 2.5rem;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.question-step { display: none; animation: fadeIn .4s ease; }
.question-step.active { display: block; }
.question-step h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: var(--primary);
  text-align: center;
  line-height: 1.4;
   margin-top: -22px;
}

.answer-options { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; }
.answer-btn {
  background: #a2e0ba;
  color: #000000;
  font-family: "Montserrat", sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  border: 2px solid #a2e0ba;
  border-radius: 6px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all .2s ease;
  outline: none;
  text-align: center;
  text-decoration: none;
  display: flex; align-items: center; justify-content: center;
}
.answer-btn:hover {
  border-color: #000000;
  background: var(--bg-card);
  transform: translateY(-2px);
  box-shadow: 0 5px 12px rgba(0,0,0,.05);
}
.answer-btn .arrow { display: none; }

.final-cta { text-align: center; padding: 1rem 0; }
.final-cta > div:first-child {
  font-family: "Montserrat", sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-size: 1rem !important;
}
#finalCTA .final-cta > div:first-child { color: var(--accent) !important; }
#sorryStep .final-cta > div:first-child { color: var(--error) !important; }

.final-cta h3 { font-size: 2rem; margin-bottom: 1rem; color: var(--primary) !important; }
.final-cta p { font-size: 1.1rem; color: var(--text-light); margin-bottom: 2rem; line-height: 1.6; }
.cta-instruction-text { color: var(--text-main); }

/* --- SHIMMER EFFECT FOR .call-cta-btn --- */
.call-cta-btn {
  background: var(--accent);
  color: #ffffff;
  font-family: "Montserrat", sans-serif;
  border: none;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,168,107,.3);
  padding: 1.25rem 2rem;
  cursor: pointer;
  transition: all .3s ease;
  outline: none;
  text-decoration: none;
  display: flex; align-items: center; justify-content: center; gap: 1rem;
  width: 100%;
  position: relative;
  overflow: hidden;
}
.call-cta-btn::before {
  content: "";
  position: absolute;
  top: 0; left: -150%;
  width: 200%;
  height: 100%;
  background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%);
  animation: shimmer 2.2s infinite;
  z-index: 1;
  pointer-events: none;
}
@keyframes shimmer {
  0% { left: -150%; }
  100% { left: 100%; }
}
.call-cta-btn > * { position: relative; z-index: 2; }

.call-cta-btn:hover {
  background: #008a57;
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0,168,107,.4);
}
.call-cta-btn .phone-icon { animation: none; }
.call-cta-btn .phone-number { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.5px; }
.call-cta-btn .cta-text { font-size: 1rem; font-weight: 600; opacity: .9; }

.privacy-notice { text-align: center; color: var(--text-light); font-size: .85rem; margin-top: 1rem; }

.loader-container { text-align: center; padding: 2rem 0; }
.loader-spinner { position: relative; width: 60px; height: 60px; margin: 0 auto 2rem auto; }
.spinner-ring {
  position: absolute; width: 100%; height: 100%;
  border: 4px solid var(--border); border-top: 4px solid var(--accent);
  border-radius: 50%; animation: spin 1s linear infinite;
}
.spinner-ring:nth-child(2), .spinner-ring:nth-child(3) { display: none; }

.loader-title { font-size: 1.5rem; color: var(--primary); margin-bottom: 2rem; }
.status-updates { max-width: 400px; margin: 0 auto 2rem auto; text-align: left; }
.status-item {
  display: flex; align-items: center; gap: 1rem;
  margin-bottom: .75rem; padding: .75rem 1rem;
  background: transparent; border-radius: 0; border-left: none;
  border-bottom: 1px solid var(--border); transition: all .3s ease; opacity: .5;
}
.status-item.completed { opacity: 1; border-bottom-color: var(--accent); }
.status-result.eligible, .status-result.reserved { color: var(--accent); font-weight: 700; }
.loader-subtitle { font-size: .875rem; color: var(--text-light); font-style: normal; }

.page-footer {
  background: var(--border);
  color: var(--text-light);
  font-size: .8rem;
  padding: 3rem 1rem;
  text-align: center;
  border-top: none;
}
.footer-text { margin: 0 auto 1.5rem auto; max-width: 700px; line-height: 1.5; }
.footer-navigation a { color: var(--primary); text-decoration: none; margin: 0 .5em; font-weight: 600; }
.footer-divider { color: var(--text-light); opacity: .4; }

@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }

@media (max-width: 768px) {
  .main-headline h1 { font-size: 2rem; }
  .quiz-container { margin: 1rem; padding: 1.5rem; }
  .question-step h3 { font-size: 1.25rem; }
  .call-cta-btn { flex-direction: column; padding: 1rem; gap: .5rem; }
  .call-cta-btn .phone-number { font-size: 1.5rem; }
}
`;
