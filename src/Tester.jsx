// Ok.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Same UI + logic as your version, with VERIFICATION helpers:
 * - Console logs for ALL NewsBreak nbpix() calls (event + payload)
 * - Console logs when Ringba age tags are pushed to _rgba_tags
 * - Optional on-screen debug overlay enabled by ?debug=1
 *
 * How to verify:
 * 1) Open DevTools → Console
 * 2) Click an age → you'll see: [NB] event age_select ...  and  [Ringba] _rgba_tags.push ...
 * 3) Click the CALL button → you'll see: [NB] event raw_call ...
 * 4) Page load → you'll see: [NB] event pageload ...
 */

// ───── Config ────────────────────────────────────────────────────────────────
const NB_PIXEL_ID = "ID-1969942605923770369"; // your NB pixel
const TEL_NUMBER = "+18337704402";            // your tel: target

// ───── Utilities: URL params ────────────────────────────────────────────────
function getParam(name) {
  if (typeof window === "undefined") return null;
  try {
    const p = new URLSearchParams(window.location.search);
    return p.get(name);
  } catch { return null; }
}
const DEBUG_ENABLED = getParam("debug") === "1";

// ───── NB + Ringba Debug Attachments ────────────────────────────────────────
/**
 * Wrap any future or current nbpix() so every call logs to console + window.__nb_log.
 * Works even if the library loads later.
 */
function attachNbDebug() {
  if (typeof window === "undefined") return;

  // create a buffer for logs
  window.__nb_log = window.__nb_log || [];

  // if nbpix already wrapped, skip
  if (window.__nb_wrapped) return;

  const wrap = () => {
    if (typeof window.nbpix !== "function") return false;

    const original = window.nbpix;
    window.nbpix = function (...args) {
      try {
        const [kind, name, payloadOrCb] = args;
        if (kind === "event") {
          // payload can be object or a callback returning object
          let data = payloadOrCb;
          if (typeof payloadOrCb === "function") {
            try { data = payloadOrCb(); } catch { data = {}; }
          }
          const entry = { ts: new Date().toISOString(), event: name, data };
          window.__nb_log.push(entry);
          /* eslint-disable no-console */
          console.log("%c[NB] event", "color:#0b7; font-weight:bold;", name, data);
        } else if (kind === "init") {
          console.log("%c[NB] init", "color:#0b7; font-weight:bold;", name);
        } else {
          console.log("%c[NB]", "color:#0b7; font-weight:bold;", ...args);
        }
      } catch {}
      return original.apply(this, args);
    };

    window.__nb_wrapped = true;
    return true;
  };

  // Try immediately, then poll briefly in case the script loads later
  if (!wrap()) {
    let tries = 0;
    const iv = setInterval(() => {
      tries++;
      if (wrap() || tries > 40) clearInterval(iv); // try ~4s
    }, 100);
  }
}

/**
 * Intercept pushes to window._rgba_tags to log Ringba tags clearly.
 */
function attachRingbaDebug() {
  if (typeof window === "undefined") return;

  // initialize the array if absent
  const arr = (window._rgba_tags = window._rgba_tags || []);
  if (arr.__patchedPush) return; // avoid double-patch

  const nativePush = arr.push;
  arr.push = function (...items) {
    try {
      items.forEach((it) => {
        console.log("%c[Ringba] _rgba_tags.push", "color:#b50; font-weight:bold;", it);
      });
    } catch {}
    return nativePush.apply(this, items);
  };
  arr.__patchedPush = true;
}

/**
 * Load NB pixel like your HTML snippet (queue loader).
 */
function ensureNBPixelLoaded() {
  if (typeof window === "undefined") return;
  (function (e, n, t, i, p, a, s) {
    if (e[i]) return;
    p = e[i] = function () {
      p.process ? p.process.apply(p, arguments) : p.queue.push(arguments);
    };
    p.queue = [];
    p.t = +new Date();
    a = n.createElement(t);
    a.async = 1;
    a.src =
      "https://static.newsbreak.com/business/tracking/nbpixel.js?t=" +
      864e5 * Math.ceil(new Date().valueOf() / 864e5);
    s = n.getElementsByTagName(t)[0];
    s.parentNode.insertBefore(a, s);
  })(window, document, "script", "nbpix");
}

/**
 * Capture NB CID once from query (?newsbreak_cid / ?nb_cid / ?cid)
 */
function captureNewsbreakCidOnce() {
  if (typeof window === "undefined") return;
  if (typeof window.newsbreak_cid !== "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    window.newsbreak_cid =
      params.get("newsbreak_cid") || params.get("nb_cid") || params.get("cid") || "";
  } catch {
    window.newsbreak_cid = "";
  }
}

/**
 * Send NB event safely, always adding CID. Logs are handled by attachNbDebug().
 */
function nbEvent(name, payload = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.nbpix === "function") {
      window.nbpix("event", name, { ...payload, newsbreak_cid: window.newsbreak_cid || "" });
    }
  } catch {}
}

/**
 * Push a Ringba age tag and log via our patched push().
 */
function rbAgePush(ageLabel) {
  try {
    window._rgba_tags = window._rgba_tags || [];
    window._rgba_tags.push({ age: ageLabel, newsbreak_cid: window.newsbreak_cid || "" });
  } catch {}
}

// ───── Page Component ────────────────────────────────────────────────────────
export default function Ok() {
  // Steps: 1,2,3,4(loading),5(sorry),6(final)
  const TOTAL_STEPS = 4;
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

  // track answers
  const [ageGroup, setAgeGroup] = useState(null);      // "25_45" | "45_65" | "65_plus" | "under_25"
  const [isMedicare, setIsMedicare] = useState(null);  // true | false | null

  // "Wait time forecast" bars
  const [forecastHeights, setForecastHeights] = useState([22, 28, 34, 40]);
  const [futureTime, setFutureTime] = useState(getFutureTimeString(60)); // +1 hour

  // Dynamic state detection
  const [stateName, setStateName] = useState("US");

  // Progress width
  const progressWidth = useMemo(() => {
    const shownStep = currentStep <= TOTAL_STEPS ? currentStep : TOTAL_STEPS;
    return Math.round((shownStep / TOTAL_STEPS) * 100);
  }, [currentStep]);

  // Smooth scroll
  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    const start = window.scrollY || window.pageYOffset;
    const duration = 800;
    const startTime = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeOutCubic(progress);
      window.scrollTo(0, start * (1 - ease));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (currentStep === 6) document.body.classList.add("baarish-bg");
      else document.body.classList.remove("baarish-bg");
    }
  }, [currentStep]);

  // gtag helper (safe)
  const track = (event, params = {}) => {
    try {
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", event, params);
      }
    } catch {}
  };

  // INIT NB + DEBUG + pageview
  useEffect(() => {
    // Attach debuggers FIRST so we catch init + events
    attachNbDebug();
    attachRingbaDebug();

    // Load pixel + capture CID
    captureNewsbreakCidOnce();
    ensureNBPixelLoaded();

    // Init once
    if (!window.__nbpix_inited) {
      try {
        window.nbpix && window.nbpix("init", NB_PIXEL_ID);
        window.__nbpix_inited = true;
      } catch {}
    }

    // Fire pageload
    nbEvent("pageload", { path: typeof location !== "undefined" ? location.pathname : "/" });
  }, []);

  // Timers + forecast + state detect
  useEffect(() => {
    setFutureTime(getFutureTimeString(60));
    const agentTimer = setTimeout(updateAgentCount, 2000);

    const startForecastInterval = () => {
      const delay = rand(10000, 20000);
      forecastIntervalRef.current = setInterval(() => {
        updateForecastBars();
      }, delay);
    };
    startForecastInterval();

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
      if (Math.random() < 0.7 && c > 2) next = c - 1;
      else if (c < 5) next = c + 1;
      return next;
    });
    const nextUpdate = rand(8000, 15000);
    setTimeout(updateAgentCount, nextUpdate);
  };

  const updateForecastBars = () => {
    const base = [15, 23, 31, 39];
    const newHeights = base.map((b) => clamp(b + rand(-8, 8), 8, 48));
    setForecastHeights(newHeights);
    setFutureTime(getFutureTimeString(60));
  };

  // State detection
  async function detectStateName() {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const override = params.get("state") || params.get("st");
        if (override && override.trim().length > 0) {
          setStateName(cleanStateString(override));
          return;
        }
      }
      const ipapi = await safeJsonFetch("https://ipapi.co/json/");
      if (ipapi && (ipapi.region || ipapi.region_code)) {
        setStateName(ipapi.region || ipapi.region_code || "US");
        return;
      }
      const ipinfo = await safeJsonFetch("https://ipinfo.io/json?token=demo");
      if (ipinfo && (ipinfo.region || ipinfo.country)) {
        setStateName(ipinfo.region || ipinfo.country || "US");
        return;
      }
      setStateName("US");
    } catch {
      setStateName("US");
    }
  }

  // NB + Ringba: fire on age selection
  function fireAgeSelect(ageKey) {
    const label = (
      ageKey === "25_45" ? "25-45" :
      ageKey === "45_65" ? "45-65" :
      ageKey === "65_plus" ? "65+" :
      ageKey === "under_25" ? "Under 25" : String(ageKey)
    );

    // NB event
    nbEvent("age_select", {
      age_group_key: ageKey,
      age_group_label: label,
    });

    // Ringba tag
    rbAgePush(label);
  }

  // Step transitions
  const nextQuestion = (stepNumber, answer) => {
    if (stepNumber === 1) {
      setAgeGroup(answer);
      fireAgeSelect(answer); // ← VERIFY in console
      setCurrentStep(2);
      track("quiz_progress", { event_category: "quiz", event_label: "step_2", value: 2 });
      return;
    }
    if (stepNumber === 2) {
      setIsMedicare(answer === "yes");
      setCurrentStep(3);
      track("quiz_progress", { event_category: "quiz", event_label: "step_3", value: 3 });
      return;
    }
    if (stepNumber === 3) {
      setCurrentStep(4);
      setShowProgress(false);
      startLoadingSequence();
      track("quiz_progress", { event_category: "quiz", event_label: "step_4_loading", value: 4 });
    }
  };

  const congoRef = useRef(null);
  useEffect(() => {
    if (congoRef.current) {
      congoRef.current.style.setProperty("color", "rgb(66, 25, 0)", "important");
    }
  }, [currentStep]);

  // Loading sequence
  const startLoadingSequence = () => {
    resetLoader();
    setTimeout(() => { setStatus1Done(true); setEligibilityText("Eligible"); }, 800);
    setTimeout(() => { setStatus2Done(true); setAvailabilityText("Low"); }, 1800);
    setTimeout(() => { setStatus3Done(true); setReservingText("Reserved"); }, 2800);
    setTimeout(() => { setCurrentStep(6); maybeStartCountdown(); }, 4000);
  };

  const resetLoader = () => {
    setStatus1Done(false);
    setStatus2Done(false);
    setStatus3Done(false);
    setEligibilityText("");
    setAvailabilityText("");
    setReservingText("");
  };

  // Countdown
  const maybeStartCountdown = () => {
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

  const isActive = (n) => currentStep === n;
  const fmtCountdown = `${countdown.m}:${String(countdown.s).padStart(2, "0")}`;

  return (
    <div>
      <style>{css}</style>
      {DEBUG_ENABLED && <DebugOverlay />}
      {currentStep === 6 && <div id="baarishOverlay"></div>}

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
          height: "52px",
          width: "auto",
          display: "block",
          margin: "0 auto",
        }}
      />

      <section className="main-hero">
        <div className="hero-wrapper">
          {!isActive(6) && (
            <div className="main-headline" style={{ marginTop: "-1.5rem" }}>
              <h1>Americans Over 25 Can Qualify For A Spending Allowance Card Worth Thousands Annually!</h1>
              <p>Answer basic questions below to see if you qualify</p>
            </div>
          )}

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
                  <button className="answer-btn" onClick={() => nextQuestion(1, "25_45")}>25–45</button>
                  <button className="answer-btn" onClick={() => nextQuestion(1, "45_65")}>45–65</button>
                  <button className="answer-btn" onClick={() => nextQuestion(1, "65_plus")}>65+</button>
                  <button className="answer-btn" onClick={() => nextQuestion(1, "under_25")}>Under 25</button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {isActive(2) && (
              <div className="question-step active" id="step2">
                <h3>2. Are you on Medicare or Medicaid?</h3>
                <div className="answer-options">
                  <button className="answer-btn" onClick={() => nextQuestion(2, "yes")}>Yes</button>
                  <button className="answer-btn" onClick={() => nextQuestion(2, "no")}>No</button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {isActive(3) && (
              <div className="question-step active" id="step3">
                <h3>3. Do you live in {stateName}?</h3>
                <div className="answer-options">
                  <button className="answer-btn" onClick={() => nextQuestion(3, "yes_in_state")}>Yes</button>
                  <button className="answer-btn" onClick={() => nextQuestion(3, "no_out_state")}>No</button>
                </div>
              </div>
            )}

            {/* LOADING STEP */}
            {isActive(4) && (
              <div className="question-step active" id="loadingStep">
                <div className="loader-container">
                  <div className="loader-spinner"><div className="spinner-ring" /></div>
                  <h3 className="loader-title">Checking Your Eligibility...</h3>

                  <div className="status-updates">
                    <div className={`status-item ${status1Done ? "completed" : ""}`} id="status1">
                      <span className="status-icon">⏳</span>
                      <span className="status-text">Eligibility: <span className={`status-result ${eligibilityText ? "eligible" : ""}`} id="eligibilityResult">{eligibilityText}</span></span>
                    </div>

                    <div className={`status-item ${status2Done ? "completed" : ""}`} id="status2">
                      <span className="status-icon">⏳</span>
                      <span className="status-text">Agent availability: <span className={`status-result ${availabilityText ? "eligible" : ""}`} id="availabilityResult">{availabilityText}</span></span>
                    </div>

                    <div className={`status-item ${status3Done ? "completed" : ""}`} id="status3">
                      <span className="status-icon">⏳</span>
                      <span className="status-text">Reserving spot: <span className={`status-result ${reservingText ? "reserved" : ""}`} id="reservingResult">{reservingText}</span></span>
                    </div>
                  </div>

                  <div className="loader-subtitle">Please wait while we secure your eligibility...</div>
                </div>
              </div>
            )}

            {/* FINAL (6) */}
            {isActive(6) && (
              <div className="question-step active" id="finalCTA">
                {scrollToTop()}
                <div className="final-cta">
                  <div ref={congoRef} style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>
                    Congratulations, You Qualify!
                  </div>

                  {((ageGroup === "25_45" || ageGroup === "45_65") && isMedicare === true) ? (
                    <>
                      <p>Based on your answers, you are eligible to claim a <b style={{ color: "#00a86b" }}>$1250 Stimulus Check From Gov.</b></p>
                      <p>Tap below and claim now!</p>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, margin: "18px 0", width: "100%" }}>
                        <a
                          href="https://usetrk.com/aff_c?offer_id=1421&aff_id=21988"
                          className="call-cta-btn"
                          onClick={() => track("alt_cta_click", { event_category: "cta_alt" })}
                          style={{ margin: "0 auto", padding: "20px", fontSize: "1.25rem" }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Click Here To Proceed
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>Based on your answers, you are eligible to claim a <b style={{ color: "#00a86b" }}>Spending Allowance Card</b> worth thousands of dollars a year!</p>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, margin: "18px 0", width: "100%" }}>
                        <div style={{ fontSize: 14, color: "var(--text-light)", textAlign: "center" }}>
                          👨‍💼 <strong id="agentCount">Spots Remaining {agentCount}</strong>
                        </div>
                        <p className="cta-instruction-text" style={{ fontSize: "1.0625rem", fontWeight: 700, marginBottom: "0.75rem", textAlign: "center" }}>
                          Tap below to call and claim now!
                        </p>
                        <a
                          href={`:${TEL_NUMBER}`}
                          className="call-cta-btn"
                          onPointerDown={() => nbEvent("raw_call")} // ← VERIFY in console
                          onClick={() => track("call_click", { event_category: "cta" })}
                          style={{ margin: "0 auto" }}
                        >
                          CALL {TEL_NUMBER}
                          <div />
                        </a>
                      </div>

                      <div style={{ marginTop: 18 }}>
                        <div style={{ fontSize: 12, color: "var(--text-light)", marginBottom: 6, textAlign: "center" }}>
                          Due to high call volume, your official agent is waiting for only 3 minutes, then your spot will not be reserved.
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, alignItems: "end", height: 56, padding: "0 8px" }}>
                          {forecastHeights.map((h, i) => (
                            <div key={i} id={`forecastBar${i + 1}`} style={{ height: h, borderRadius: 4, background: "var(--border)", transition: "height .8s ease" }} />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
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
      </footer>
    </div>
  );
}

// ───── Debug Overlay (optional, toggle with ?debug=1) ────────────────────────
function DebugOverlay() {
  if (typeof window === "undefined") return null;
  const entries = (window.__nb_log || []).slice(-8); // last 8
  return (
    <div style={{
      position: "fixed", right: 10, bottom: 10, zIndex: 99999,
      width: 320, maxHeight: 240, overflow: "auto",
      background: "rgba(0,0,0,0.8)", color: "#fff",
      fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12,
      borderRadius: 8, padding: 10, boxShadow: "0 10px 30px rgba(0,0,0,.35)"
    }}>
      <div style={{fontWeight: 800, marginBottom: 6}}>NB Debug (last {entries.length})</div>
      {entries.length === 0 && <div>— no events yet —</div>}
      {entries.map((e, i) => (
        <div key={i} style={{marginBottom:6, borderBottom:"1px solid rgba(255,255,255,.1)", paddingBottom:6}}>
          <div>{e.ts}</div>
          <div><b>event:</b> {String(e.event)}</div>
          <pre style={{whiteSpace:"pre-wrap", margin:0}}>{JSON.stringify(e.data || {}, null, 2)}</pre>
        </div>
      ))}
      <div style={{opacity:.6, marginTop:6}}>Tip: open DevTools → Console to see full logs.</div>
    </div>
  );
}

/* ------------------------- helpers ------------------------- */
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
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
function cleanStateString(s) { return String(s).replace(/_/g, " ").trim(); }
async function safeJsonFetch(url, options = {}) {
  try {
    const res = await fetch(url, { ...options, cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}
/* -------------------------- CSS ---------------------------- */
const css = `
:root {
  --primary: #003366;
  --accent: #00a86b;
  --bg-page: #ffffffff;
  --bg-card: #ffffff;
  --text-main: #2c3e50;
  --text-light: #546e7a;
  --border: #e0e6ed;
  --error: #d32f2f;
}
/* Baarish full-screen overlay */
#baarishOverlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url("/baarish.GIF") center center / cover no-repeat;
  z-index: 9999; /* sits above everything */
  pointer-events: none; /* so user can still click buttons underneath */
}

html, body {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
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
  border-radius: 15px;
  box-shadow: 0 4px 20px #a2e0ba;
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
  border-color: #a2e0ba;
  background: #a2e0ba;
  transform: translateY(-2px);
  box-shadow: 0 5px 12px rgba(0,0,0,.05);
}
.answer-btn .arrow { display: none; }

.final-cta { text-align: center; font-style: bold; }
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
    background-color: #00b050;
        color: white;
        padding: 20px;
        font-size: 1.5rem;
        border-radius: 12px;
        margin-bottom: 10px;
        text-align: center;
        box-shadow: 0 0 12px 4px rgba(0, 176, 80, 0.6); /* green glow */
  transition: box-shadow 0.3s ease;
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
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
  .quiz-container { margin-top: -1.5rem; padding: 1.5rem; }
  .question-step h3 { font-size: 1.25rem; }
  
  .call-cta-btn .phone-number { font-size: 1.5rem; }
}
`;
