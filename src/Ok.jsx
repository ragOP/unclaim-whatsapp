// Ok.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * React landing page with:
 * - NewsBreak Pixel already integrated (from your previous build)
 * - Ringba script autoload + robust rbAge() that mirrors pushes to __rgba_debug
 * - Clean console verification so you can SEE the pushed tags
 * - Age clicks fire rbAge(age)
 */

export default function Ok() {
  // --------------------------
  // Step / Progress Management
  // --------------------------
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

  // Answers
  const [ageGroup, setAgeGroup] = useState(null);
  const [isMedicare, setIsMedicare] = useState(null);
  const [stateName, setStateName] = useState("US");

  // Urgency bits
  const [countdown, setCountdown] = useState({ m: 5, s: 0 });
  const [agentCount] = useState(4);
  const countdownIntervalRef = useRef(null);
  const forecastIntervalRef = useRef(null);
  const [forecastHeights, setForecastHeights] = useState([22, 28, 34, 40]);

  // Derived progress
  const progressWidth = useMemo(() => {
    const shownStep = currentStep <= TOTAL_STEPS ? currentStep : TOTAL_STEPS;
    return Math.round((shownStep / TOTAL_STEPS) * 100);
  }, [currentStep]);

  // --------------------------
  // Debug logger
  // --------------------------
  const [logs, setLogs] = useState([]);
  const [showLogPanel, setShowLogPanel] = useState(false);
  const logRef = useRef(null);
  const dbg = (msg, ...rest) => {
    const stamp = new Date().toLocaleTimeString();
    try { console.log(`[DBG ${stamp}]`, msg, ...rest); } catch {}
    setLogs((prev) => {
      const entry = `${stamp} | ${msg} ${rest.length ? JSON.stringify(rest) : ""}`;
      const next = [...prev, entry].slice(-300);
      requestAnimationFrame(() => {
        try { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; } catch {}
      });
      return next;
    });
  };

  // ----------------
  // gtag helper
  // ----------------
  const track = (event, params = {}) => {
    try {
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", event, params);
      }
    } catch {}
  };

  // ---------------------------
  // NewsBreak Pixel (kept)
  // ---------------------------
  const NB_PIXEL_ID = "ID-1969942605923770369";
  const [nbReady, setNbReady] = useState(false);
  const [nbChipVisible, setNbChipVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // NB loader
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
        864e5 * Math.ceil(new Date() / 864e5);
      s = n.getElementsByTagName(t)[0];
      s.parentNode.insertBefore(a, s);
    })(window, document, "script", "nbpix");

    try {
      window.nbpix && window.nbpix("init", NB_PIXEL_ID);
      dbg("[NB] init sent", NB_PIXEL_ID);
    } catch (e) {
      dbg("[NB] init queued", String(e));
    }

    const readyCheck = setInterval(() => {
      const ok =
        typeof window.nbpix === "function" &&
        typeof window.nbpix.process === "function";
      if (ok) {
        clearInterval(readyCheck);
        setNbReady(true);
        dbg("[NB] ready");
        if (Array.isArray(window.__nb_fallback_queue)) {
          try {
            window.__nb_fallback_queue.forEach((args) => window.nbpix.apply(null, args));
            window.__nb_fallback_queue.length = 0;
            dbg("[NB] flushed fallback queue");
          } catch {}
        }
      }
    }, 300);

    return () => clearInterval(readyCheck);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNbChip = (text = "NB: raw_call sent") => {
    setNbChipVisible(true);
    dbg("[NB] chip:", text);
    setTimeout(() => setNbChipVisible(false), 1800);
  };

  const fireNbRawCall = () => {
    try {
      const payload = { event: "raw_call", at: new Date().toISOString() };
      window.__nb_events = window.__nb_events || [];
      window.__nb_events.push(payload);
      dbg("[NB] firing raw_call", payload);

      if (nbReady && typeof window.nbpix === "function") {
        window.nbpix("event", "raw_call");
        dbg("[NB] ✅ raw_call dispatched");
      } else {
        dbg("[NB] not ready; queue raw_call");
        window.__nb_fallback_queue = window.__nb_fallback_queue || [];
        window.__nb_fallback_queue.push(["event", "raw_call"]);
      }
      showNbChip();
    } catch (e) {
      dbg("[NB] raw_call failed", String(e));
    }
  };

  // -------------
  // Ringba setup
  // -------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load Ringba script if not present
    if (!document.getElementById("ringba-script")) {
      const s = document.createElement("script");
      s.id = "ringba-script";
      s.async = true;
      s.src = "//b-js.ringba.com/CAeddfbc9ba87f426193635676d44b329a";
      s.onload = () => { window.__ringbaLoaded = true; dbg("[Ringba] script loaded"); };
      s.onerror = () => { window.__ringbaBlocked = true; dbg("[Ringba] script blocked/failed"); };
      document.head.appendChild(s);
    }

    // Ensure push container + debug mirror
    if (!Array.isArray(window._rgba_tags)) {
      window._rgba_tags = window._rgba_tags && typeof window._rgba_tags.push === "function"
        ? window._rgba_tags
        : [];
    }
    window.__rgba_debug = window.__rgba_debug || [];

    dbg("[Ringba] ready container:", {
      isArray: Array.isArray(window._rgba_tags),
      hasPush: !!(window._rgba_tags && window._rgba_tags.push),
    });
  }, []);

  // Safe age push to Ringba + mirror + clean console snapshot
  const rbAge = (value) => {
    try {
      // Make sure container exists
      if (!Array.isArray(window._rgba_tags)) {
        // if Ringba replaced it with a custom object that has push, keep using it
        if (!(window._rgba_tags && typeof window._rgba_tags.push === "function")) {
          window._rgba_tags = [];
        }
      }

      const tag = {
        age: value,
        newsbreak_cid: window.newsbreak_cid || "",
        type: "User",
      };

      // Push to Ringba container
      window._rgba_tags.push(tag);

      // Mirror to a plain array you can inspect any time
      window.__rgba_debug = window.__rgba_debug || [];
      window.__rgba_debug.push(tag);

      // Print a **deterministic snapshot** you can see
      const snapshot = Array.isArray(window.__rgba_debug)
        ? window.__rgba_debug.slice(-10) // last 10 tags
        : "mirror not array";

      dbg("[Ringba] age pushed", { pushed: tag, mirrorTail: snapshot });
      console.log("[Ringba] mirror now =", snapshot);
      // If you want to inspect later:
      //   -> in console:  __rgba_debug
      //   -> full container (may be custom):  _rgba_tags
    } catch (e) {
      dbg("[Ringba] age push failed", String(e));
    }
  };

  // Expose helpers in console
  useEffect(() => {
    window.NB = {
      ready: () =>
        typeof window.nbpix === "function" &&
        typeof window.nbpix.process === "function",
      events: () => window.__nb_events || [],
      queue: () => window.__nb_fallback_queue || [],
      fire: () => fireNbRawCall(),
    };
    window.RB = {
      mirror: () => window.__rgba_debug || [],
      tags: () => window._rgba_tags,
      age: (v) => rbAge(v),
    };
    window.DBG = {
      log: (m, ...r) => dbg(m, ...r),
      show: () => setShowLogPanel(true),
      hide: () => setShowLogPanel(false),
    };
    return () => {
      try { delete window.NB; delete window.RB; delete window.DBG; } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------
  // Step transitions
  // ----------------
  const nextQuestion = (stepNumber, answer) => {
    dbg("[STEP] nextQuestion", { stepNumber, answer });

    if (stepNumber === 1) {
      setAgeGroup(answer);
      // 🔴 Push age to Ringba here
      rbAge(answer);

      setCurrentStep(2);
      dbg("[STEP] ageGroup =", answer, "→ Step 2");
      track("quiz_progress", { event_category: "quiz", event_label: "step_2", value: 2 });
      return;
    }
    if (stepNumber === 2) {
      const val = answer === "yes";
      setIsMedicare(val);
      setCurrentStep(3);
      dbg("[STEP] isMedicare =", val, "→ Step 3");
      track("quiz_progress", { event_category: "quiz", event_label: "step_3", value: 3 });
      return;
    }
    if (stepNumber === 3) {
      setCurrentStep(4);
      setShowProgress(false);
      dbg("[STEP] → Loading (4)");
      startLoadingSequence();
      track("quiz_progress", { event_category: "quiz", event_label: "step_4_loading", value: 4 });
    }
  };

  // ----------------------
  // Loading step sequence
  // ----------------------
  const startLoadingSequence = () => {
    resetLoader();
    dbg("[LOAD] start");

    setTimeout(() => { setStatus1Done(true); setEligibilityText("Eligible"); dbg("[LOAD] eligibility = Eligible"); }, 800);
    setTimeout(() => { setStatus2Done(true); setAvailabilityText("Low"); dbg("[LOAD] availability = Low"); }, 1800);
    setTimeout(() => { setStatus3Done(true); setReservingText("Reserved"); dbg("[LOAD] reserving = Reserved"); }, 2800);
    setTimeout(() => {
      setCurrentStep(6);
      maybeStartCountdown();
      dbg("[LOAD] done → Step 6");
    }, 4000);
  };

  const resetLoader = () => {
    setStatus1Done(false);
    setStatus2Done(false);
    setStatus3Done(false);
    setEligibilityText("");
    setAvailabilityText("");
    setReservingText("");
    dbg("[LOAD] reset");
  };

  // ----------------------
  // Countdown (final CTA)
  // ----------------------
  const maybeStartCountdown = () => {
    if (countdownIntervalRef.current) return;
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        let { m, s } = prev;
        if (m === 0 && s === 0) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          dbg("[TIMER] ended");
          return { m: 0, s: 0 };
        }
        if (s === 0) return { m: m - 1, s: 59 };
        return { m, s: s - 1 };
      });
    }, 1000);
    dbg("[TIMER] started");
  };

  // ------------------------------
  // Forecast bars + state detect
  // ------------------------------
  useEffect(() => {
    const startForecastInterval = () => {
      const delay = rand(10000, 20000);
      forecastIntervalRef.current = setInterval(() => {
        const base = [15, 23, 31, 39];
        const newHeights = base.map((b) => clamp(b + rand(-8, 8), 8, 48));
        setForecastHeights(newHeights);
      }, delay);
    };
    startForecastInterval();

    (async () => {
      try {
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const override = params.get("state") || params.get("st");
          if (override && override.trim().length > 0) {
            setStateName(cleanStateString(override));
            dbg("[STATE] override:", override);
            return;
          }
        }
        const ipapi = await safeJsonFetch("https://ipapi.co/json/");
        if (ipapi && (ipapi.region || ipapi.region_code)) {
          setStateName(ipapi.region || ipapi.region_code || "US");
          dbg("[STATE] ipapi:", ipapi.region || ipapi.region_code);
          return;
        }
        const ipinfo = await safeJsonFetch("https://ipinfo.io/json?token=demo");
        if (ipinfo && (ipinfo.region || ipinfo.country)) {
          setStateName(ipinfo.region || ipinfo.country || "US");
          dbg("[STATE] ipinfo:", ipinfo.region || ipinfo.country);
          return;
        }
        setStateName("US");
        dbg("[STATE] fallback: US");
      } catch {
        setStateName("US");
        dbg("[STATE] error → US");
      }
    })();

    return () => {
      if (forecastIntervalRef.current) clearInterval(forecastIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------
  // Render helpers
  // ----------------
  const isActive = (n) => currentStep === n;
  const fmtCountdown = `${countdown.m}:${String(countdown.s).padStart(2, "0")}`;

  return (
    <div>
      <style>{css}</style>

      {/* NB chip */}
      <div
        id="nb-chip"
        style={{
          position: "fixed",
          right: 12,
          bottom: 12,
          zIndex: 99999,
          padding: "8px 12px",
          fontSize: 12,
          fontWeight: 700,
          borderRadius: 999,
          background: "rgba(20, 180, 90, 0.95)",
          color: "#fff",
          boxShadow: "0 6px 20px rgba(0,0,0,.2)",
          display: nbChipVisible ? "inline-block" : "none",
          pointerEvents: "none",
        }}
      >
        NB: raw_call sent
      </div>

      {/* Debug Toggle */}
      <button
        onClick={() => setShowLogPanel((v) => !v)}
        style={{
          position: "fixed", left: 12, bottom: 12, zIndex: 99999,
          padding: "8px 12px", borderRadius: 999, border: "none",
          fontSize: 12, fontWeight: 800, background: "#111827", color: "#fff",
          boxShadow: "0 6px 20px rgba(0,0,0,.25)", cursor: "pointer"
        }}
        aria-label="Toggle debug"
      >
        🐞 Debug
      </button>

      {/* Debug Panel */}
      {showLogPanel && (
        <div
          style={{
            position: "fixed", left: 12, bottom: 56, width: 320, maxHeight: 260,
            background: "rgba(17,24,39,.96)", color: "#e5e7eb", borderRadius: 12,
            boxShadow: "0 20px 40px rgba(0,0,0,.4)", padding: 12, zIndex: 99998,
            display: "flex", flexDirection: "column"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <strong style={{ fontSize: 13, letterSpacing: .3 }}>Logs</strong>
            <span style={{ marginLeft: "auto", fontSize: 11, opacity: .8 }}>
              NB ready: {String(nbReady)}
            </span>
          </div>
          <div
            ref={logRef}
            style={{
              overflowY: "auto", whiteSpace: "pre-wrap", fontSize: 12,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              lineHeight: 1.35, paddingRight: 6
            }}
          >
            {logs.length === 0 ? <div style={{ opacity: .75 }}>No logs yet…</div> :
              logs.map((l, i) => <div key={i} style={{ marginBottom: 4 }}>{l}</div>)}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => setLogs([])} style={btnStyle}>Clear</button>
            <button onClick={() => fireNbRawCall()} style={btnStyle}>NB raw_call</button>
            <button onClick={() => setShowLogPanel(false)} style={btnStyle}>Close</button>
          </div>
        </div>
      )}

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
        style={{ height: "52px", width: "auto", display: "block", margin: "0 auto" }}
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
                  <div className="loader-spinner">
                    <div className="spinner-ring" />
                  </div>
                  <h3 className="loader-title">Checking Your Eligibility...</h3>

                  <div className="status-updates">
                    <div className={`status-item ${status1Done ? "completed" : ""}`} id="status1">
                      <span className="status-text">
                        Eligibility:{" "}
                        <span className={`status-result ${eligibilityText ? "eligible" : ""}`} id="eligibilityResult">
                          {eligibilityText}
                        </span>
                      </span>
                    </div>

                    <div className={`status-item ${status2Done ? "completed" : ""}`} id="status2">
                      <span className="status-text">
                        Agent availability:{" "}
                        <span className={`status-result ${availabilityText ? "eligible" : ""}`} id="availabilityResult">
                          {availabilityText}
                        </span>
                      </span>
                    </div>

                    <div className={`status-item ${status3Done ? "completed" : ""}`} id="status3">
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

            {/* FINAL STEP */}
            {isActive(6) && (
              <div className="question-step active" id="finalCTA">
                {((ageGroup === "25_45" || ageGroup === "45_65") && isMedicare === true) ? (
                  <div className="final-cta">
                    <div style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>
                      Congratulations, You Qualify!
                    </div>
                    <p>
                      Based on your answers, you are eligible to claim a{" "}
                      <b style={{ color: "#00a86b" }}>$1250 Stimulus Check From Gov.</b>
                    </p>
                    <p>Tap below and claim now!</p>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, margin: "18px 0", width: "100%" }}>
                      <a
                        href="https://uplevelrewarded.com/aff_c?offer_id=1421&aff_id=2065"
                        className="call-cta-btn"
                        onClick={() => {
                          fireNbRawCall();
                          track("alt_cta_click", { event_category: "cta_alt" });
                          dbg("[CTA] alt click → NB raw_call");
                        }}
                        style={{ margin: "0 auto", padding: 20, fontSize: "1.25rem" }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Click Here To Proceed
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="final-cta">
                    <div style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>
                      Congratulations, You Qualify!
                    </div>
                    <p>
                      Based on your answers, you are eligible to claim a{" "}
                      <b style={{ color: "#00a86b" }}>Spending Allowance Card</b> worth thousands of dollars a year!
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, margin: "18px 0", width: "100%" }}>
                      <div style={{ fontSize: 14, color: "var(--text-light)", textAlign: "center" }}>
                        👨‍💼 <strong id="agentCount">Spots Remaining {agentCount}</strong>
                      </div>

                      <p className="cta-instruction-text" style={{ fontSize: "1.0625rem", fontWeight: 700, marginBottom: "0.75rem", textAlign: "center" }}>
                        Tap below to call and claim now!
                      </p>

                      <a
                        href="tel:+18337704402"
                        className="call-cta-btn"
                        onClick={() => {
                          fireNbRawCall();
                          track("call_click", { event_category: "cta" });
                          dbg("[CTA] CALL click → NB raw_call");
                        }}
                        style={{ margin: "0 auto" }}
                      >
                        CALL (833)-770-4402
                        <div />
                      </a>
                    </div>

                    <div style={{ marginTop: 18 }}>
                      <div style={{ fontSize: 12, color: "var(--text-light)", marginBottom: 6, textAlign: "center" }}>
                        Due to high call volume, your official agent is waiting for only 3 minutes, then your spot will not be reserved.
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, alignItems: "end", height: 56, padding: "0 8px" }}>
                        {forecastHeights.map((h, i) => (
                          <div key={i} style={{ height: h, borderRadius: 4, background: "var(--border)", transition: "height .8s ease" }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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
          We're here to help you find ways to reduce your insurance costs through our service. This page includes affiliate links, which means we may earn
          a commission if you click through to our partnered insurance marketplace. Deal Radar is not an insurance agent or provider. The marketplace connects
          you with licensed local agents who can help you compare quotes. Specific savings or results are not guaranteed, as rates and eligibility vary by
          individual.
        </div>
      </footer>
    </div>
  );
}

/* ------------------------- helpers ------------------------- */
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function cleanStateString(s) { return String(s).replace(/_/g, " ").trim(); }
async function safeJsonFetch(url, options = {}) {
  try {
    const res = await fetch(url, { ...options, cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

/* -------------------------- styles ---------------------------- */
const btnStyle = {
  padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,.15)",
  background: "rgba(55,65,81,.8)", color: "#fff", fontSize: 12, cursor: "pointer"
};

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
html, body { width: 100%; max-width: 100%; overflow-x: hidden; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: "Open Sans", -apple-system, BlinkMacSystemFont, sans-serif; background: var(--bg-page); color: var(--text-main); line-height: 1.6; -webkit-font-smoothing: antialiased; }
h1, h3, .countdown-timer, .phone-number { font-family: "Montserrat", sans-serif; }

.main-hero { background: var(--bg-card); color: var(--text-main); padding: 3rem 1.5rem 2rem; text-align: center; position: relative; border-bottom: 1px solid var(--border); }
.hero-wrapper { max-width: 800px; margin: 0 auto; }

.main-headline h1 { font-size: 2.2rem; font-weight: 800; color: var(--primary); line-height: 1.2; letter-spacing: -0.5px; }
.main-headline p { font-size: 1.1rem; color: var(--text-light); margin-top: 0.6rem; }

.quiz-container { background: var(--bg-card); border-radius: 15px; box-shadow: 0 4px 20px #a2e0ba; border: 1px solid var(--border); padding: 2rem; margin: 2rem auto; max-width: 600px; position: relative; }
.progress-bar { width: 100%; height: 10px; background: var(--border); border-radius: 3px; margin-bottom: 2rem; overflow: hidden; }
.progress-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.4s ease; }

.question-step { display: none; animation: fadeIn .25s ease; }
.question-step.active { display: block; }
.question-step h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 1.25rem; color: var(--primary); text-align: center; line-height: 1.4; }

.answer-options { display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 0.8rem; }
.answer-btn {
  background: #a2e0ba; color: #000; font-family: "Montserrat", sans-serif; font-size: 1.05rem; font-weight: 600;
  border: 2px solid #a2e0ba; border-radius: 8px; padding: 1rem; cursor: pointer; transition: all .2s ease; text-align: center; display: flex; align-items: center; justify-content: center;
}
.answer-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 12px rgba(0,0,0,.06); }

.final-cta { text-align: center; }
.final-cta > div:first-child { font-family: "Montserrat", sans-serif; letter-spacing: 1px; text-transform: uppercase; font-size: 1rem !important; }
.final-cta h3 { font-size: 2rem; margin-bottom: 1rem; color: var(--primary) !important; }
.final-cta p { font-size: 1.05rem; color: var(--text-light); margin-bottom: 1.2rem; line-height: 1.6; }
.cta-instruction-text { color: var(--text-main); }

.call-cta-btn {
  background-color: #00b050; color: white; padding: 18px; font-size: 1.4rem; border-radius: 12px; margin-bottom: 10px; text-align: center;
  box-shadow: 0 0 12px 4px rgba(0,176,80,0.6); transition: box-shadow 0.3s ease; font-family: 'Montserrat', sans-serif; font-weight: 700; position: relative; overflow: hidden;
}
.call-cta-btn::before {
  content: ""; position: absolute; top: 0; left: -150%; width: 200%; height: 100%;
  background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%); animation: shimmer 2.2s infinite; z-index: 1; pointer-events: none;
}
@keyframes shimmer { 0% { left: -150%; } 100% { left: 100%; } }
.call-cta-btn > * { position: relative; z-index: 2; }
.call-cta-btn:hover { background: #008a57; transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,168,107,.4); }

.privacy-notice { text-align: center; color: var(--text-light); font-size: .85rem; margin-top: 1rem; }

.loader-container { text-align: center; padding: 2rem 0; }
.loader-spinner { position: relative; width: 60px; height: 60px; margin: 0 auto 1.2rem auto; }
.spinner-ring { position: absolute; width: 100%; height: 100%; border: 4px solid var(--border); border-top: 4px solid var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }

.loader-title { font-size: 1.3rem; color: var(--primary); margin-bottom: 1.4rem; }
.status-updates { max-width: 400px; margin: 0 auto 1.2rem auto; text-align: left; }
.status-item { display: flex; align-items: center; gap: 1rem; margin-bottom: .6rem; padding: .6rem 1rem; border-bottom: 1px solid var(--border); opacity: .6; transition: .2s; }
.status-item.completed { opacity: 1; border-bottom-color: var(--accent); }
.status-result.eligible, .status-result.reserved { color: var(--accent); font-weight: 700; }
.loader-subtitle { font-size: .92rem; color: var(--text-light); }

.page-footer { background: var(--border); color: var(--text-light); font-size: .8rem; padding: 2.5rem 1rem; text-align: center; border-top: none; }
.footer-text { margin: 0 auto 1rem auto; max-width: 700px; line-height: 1.5; }

@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }

@media (max-width: 768px) {
  .main-headline h1 { font-size: 1.65rem; }
  .quiz-container { margin-top: 0; padding: 1.25rem; }
  .question-step h3 { font-size: 1.05rem; }
  .call-cta-btn { font-size: 1.25rem; padding: 16px; }
}
`;
