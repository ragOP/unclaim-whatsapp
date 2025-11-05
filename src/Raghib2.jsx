import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import agent from "../src/assets/pic.png";
import tick from "../src/assets/tick2.png";
import deliver from "../src/assets/delivered.svg";
import {
  EllipsisVertical,
  Paperclip,
  Phone,
  SendHorizontalIcon,
} from "lucide-react";
import RghibCall2 from "./RghibCall2";

export default function Chatbot() {
  // ---------------- UI State ----------------
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [finalMessage, setFinalMessage] = useState(false);
  const [switchNumber, setSwitchNumber] = useState(false);
  const messagesEndRef = useRef(null);

  // ---------------- Debug Panel ----------------
  const [logs, setLogs] = useState([]);
  const [showLogPanel, setShowLogPanel] = useState(false);
  const logRef = useRef(null);
  const dbg = (msg, payload) => {
    const stamp = new Date().toLocaleTimeString();
    const entry = `${stamp} | ${msg}${payload !== undefined ? " " + JSON.stringify(payload) : ""}`;
    // eslint-disable-next-line no-console
    try { console.log(`[DBG ${stamp}]`, msg, payload ?? ""); } catch {}
    setLogs((prev) => {
      const next = [...prev, entry].slice(-300);
      requestAnimationFrame(() => {
        try { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; } catch {}
      });
      return next;
    });
  };

  // ---------------- NewsBreak Pixel ----------------
  const NB_PIXEL_ID = "ID-1969942605923770369";
  const [nbReady, setNbReady] = useState(false);
  const [nbChipVisible, setNbChipVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Loader (exact clean snippet)
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
      dbg("[NB] init sent", { id: NB_PIXEL_ID });
    } catch (e) {
      dbg("[NB] init queued", { error: String(e) });
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
            window.__nb_fallback_queue.forEach((args) =>
              window.nbpix.apply(null, args)
            );
            window.__nb_fallback_queue.length = 0;
            dbg("[NB] flushed fallback queue");
          } catch {}
        }
      }
    }, 300);

    // Fire raw_call for any tel: clicks (including inside RghibCall2)
    const handleDocClick = (e) => {
      const a = e.target.closest?.("a[href^='tel:']");
      if (a) {
        fireNbRawCall();
      }
    };
    document.addEventListener("click", handleDocClick, true);

    return () => {
      clearInterval(readyCheck);
      document.removeEventListener("click", handleDocClick, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNbChip = (text = "NB: raw_call sent") => {
    setNbChipVisible(true);
    dbg("[NB] chip", { text });
    setTimeout(() => setNbChipVisible(false), 1600);
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
        window.__nb_fallback_queue = window.__nb_fallback_queue || [];
        window.__nb_fallback_queue.push(["event", "raw_call"]);
        dbg("[NB] not ready; queued raw_call");
      }
      showNbChip();
    } catch (e) {
      dbg("[NB] raw_call failed", { error: String(e) });
    }
  };

  // ---------------- Ringba Age Tagging ----------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Inject Ringba script if not present
    if (!document.getElementById("ringba-script")) {
      const s = document.createElement("script");
      s.id = "ringba-script";
      s.async = true;
      s.src = "//b-js.ringba.com/CAfdb7eb5bdaa24fb8a155f293ece397ae";
      s.onload = () => { window.__ringbaLoaded = true; dbg("[Ringba] script loaded"); };
      s.onerror = () => { window.__ringbaBlocked = true; dbg("[Ringba] script blocked/failed"); };
      document.head.appendChild(s);
    }

    // Ensure container + mirror
    if (!Array.isArray(window._rgba_tags)) {
      // If Ringba replaced it with a custom push object, keep it; else use array.
      if (!(window._rgba_tags && typeof window._rgba_tags.push === "function")) {
        window._rgba_tags = [];
      }
    }
    window.__rgba_debug = window.__rgba_debug || [];

    dbg("[Ringba] container", {
      isArray: Array.isArray(window._rgba_tags),
      hasPush: !!(window._rgba_tags && window._rgba_tags.push),
    });
  }, []);

  const rbAge = (value) => {
    try {
      if (!Array.isArray(window._rgba_tags)) {
        if (!(window._rgba_tags && typeof window._rgba_tags.push === "function")) {
          window._rgba_tags = [];
        }
      }
      const tag = {
        age: value,                      // <-- your age value
        newsbreak_cid: window.newsbreak_cid || "",
        type: "User",
      };
      window._rgba_tags.push(tag);      // Ringba collector (may be custom object)
      window.__rgba_debug.push(tag);    // Plain mirror you can inspect

      const tail = window.__rgba_debug.slice(-10);
      dbg("[Ringba] age pushed", { pushed: tag, mirrorTail: tail });
      // Quick handles in DevTools:
      //   RB.mirror()  -> last entries
      //   RB.tags()    -> Ringba container
      //   RB.age('65_plus') -> manual push test
    } catch (e) {
      dbg("[Ringba] age push failed", { error: String(e) });
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
      show: () => setShowLogPanel(true),
      hide: () => setShowLogPanel(false),
      log: (m, p) => dbg(m, p),
      clear: () => setLogs([]),
    };
    return () => {
      try { delete window.NB; delete window.RB; delete window.DBG; } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- Bot Boot ----------------
  useEffect(() => {
    const initialMessages = [
      { text: "Hey there! 👋", sender: "bot" },
      {
        text:
          "Emily this side. Let’s find out if you qualify for any unclaimed benefits — it’s quick and only takes 2 minutes!",
        sender: "bot",
        time: new Date().toTimeString(),
      },
      {
        text: "Tap 'Yes' to get started! ⬇️",
        sender: "bot",
        options: ["👉 Yes! Show me how to claim!"],
        time: new Date().toTimeString(),
      },
    ];
    addMessagesWithDelay(initialMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- Helpers ----------------
  const getFormattedTime = (timeString) => {
    return timeString.split(" ")[0].split(":").slice(0, 2).join(":");
  };

  const addMessagesWithDelay = (botResponses) => {
    let delay = 0;
    setIsTyping(true);
    botResponses.forEach((response, index) => {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            ...response,
            time: new Date().toTimeString(),
            lastInSequence: index === botResponses.length - 1,
          },
        ]);
        if (index === botResponses.length - 1) {
          setIsTyping(false);
          if (response.options) setCurrentOptions(response.options);
          if (response.input) setShowInput(true);
        }
      }, (delay += 1500));
    });
  };

  // ---------------- Option Click Flow + NB/Ringba hooks ----------------
  const handleOptionClick = (option) => {
    // echo user selection
    setMessages((prev) => [
      ...prev,
      { text: option === "👉 Yes! Show me how to claim!" ? "Yes" : option, sender: "user", time: new Date().toTimeString() },
    ]);

    setShowInput(false);
    setCurrentOptions([]);
    let botResponses = [];

    if (option === "👉 Yes! Show me how to claim!") {
      botResponses = [
        {
          text:
            "Awesome! Let's get you the benefit ASAP. I just need to ask you a couple of quick questions.",
          sender: "bot",
        },
        {
          text: "Are you under the age of 65?",
          sender: "bot",
          options: ["Yes, I am under 65", "No, I am over 65"],
        },
      ];
    } else if (option === "Yes, I am under 65") {
      // 🔴 RINGBA: Age push
      rbAge("under_65");

      botResponses = [
        {
          text: "Do you live in the United States?",
          sender: "bot",
          options: ["Yes ", "No "],
        },
      ];
    } else if (option === "No, I am over 65") {
      // 🔴 RINGBA: Age push
      rbAge("65_plus");

      botResponses = [
        {
          text:
            "Based on what you’ve told me, I see you qualify for a Food Allowance Card worth thousands of dollars!",
          sender: "bot",
        },
        {
          text: "Are you interested in claiming it?",
          sender: "bot",
          options: [" Yes", " No"],
        },
      ];
    } else if (option === "Yes " || option === "No ") {
      botResponses = [
        {
          text: "Are you on Medicare or Medicaid?",
          sender: "bot",
          options: ["  Yes", "No"],
        },
      ];
    } else if (option === " Yes") {
      botResponses = [
        {
          text:
            "Great, I’ve qualified you for the Food Allowance Card, worth thousands of dollars a year.",
          sender: "bot",
        },
        {
          text:
            "This card can be used at all grocery & medical store across United States.",
          sender: "bot",
        },
      ];
      setSwitchNumber(true);
      setTimeout(() => {
        setFinalMessage(true);
      }, 4000);
    } else if (option === "  Yes") {
      botResponses = [
        {
          text:
            "Based on what you’ve told me, I see you qualify for a $1250 Stimulus Check from the gov!",
          sender: "bot",
        },
        {
          text: "Are you interested in claiming it?",
          sender: "bot",
          options: ["Yes, I want to claim!", "No, I’ll skip."],
        },
      ];
    }

    if (option === "Yes, I want to claim!" || option === "No, I’ll skip.") {
      botResponses = [{ text: "Redirecting you now...", sender: "bot" }];
      setTimeout(() => {
        // NB raw_call is also captured by tel: click elsewhere; here it's a URL redirect
        window.location.href =
          "https://rewarduplevel.com/aff_c?offer_id=1421&aff_id=2065";
      }, 2000);
    } else if (option === " No") {
      botResponses = [{ text: "Sorry you don’t qualify", sender: "bot" }];
    } else if (option === "Yes" || option === "No") {
      botResponses = [
        { text: "🎉 Fantastic news! You're one step away from securing your benefit", sender: "bot" },
        {
          text:
            "Based on what you've told me, you’re eligible for the <strong>$5800 Spending Allowance</strong> And Lifetime Free Health Coverage!",
          sender: "bot",
        },
      ];
      setTimeout(() => {
        setFinalMessage(true);
      }, 4000);
    }

    addMessagesWithDelay(botResponses);
  };

  // ---------------- Manual Input Path ----------------
  const handleSendInput = () => {
    if (inputValue.trim() === "") return;
    setMessages((prev) => [...prev, { text: inputValue, sender: "user" }]);
    setInputValue("");
    setShowInput(false);
    const botResponses = [
      { text: `Nice to meet you, ${inputValue}!`, sender: "bot" },
      { text: "Let's begin your Soulmate Portrait.", sender: "bot", options: ["Start"] },
    ];
    addMessagesWithDelay(botResponses);
  };

  // ---------------- Auto-scroll ----------------
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (finalMessage) {
        container.scrollTo({
          top: container.scrollHeight - container.clientHeight - 100,
          behavior: "smooth",
        });
      } else {
        container.scrollTo({
          top: container.scrollHeight - container.clientHeight,
          behavior: "smooth",
        });
      }
    }
  }, [messages, finalMessage, isTyping]);

  // ---------------- Render ----------------
  return (
    <div
      className="w-full h-screen flex flex-col bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
      }}
    >
      {/* NB verify chip */}
    

    

      {showLogPanel && (
        <div
          style={{
            position: "fixed",
            left: 12,
            bottom: 56,
            width: 340,
            maxHeight: 280,
            background: "rgba(17,24,39,.96)",
            color: "#e5e7eb",
            borderRadius: 12,
            boxShadow: "0 20px 40px rgba(0,0,0,.4)",
            padding: 12,
            zIndex: 99997,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <strong style={{ fontSize: 13, letterSpacing: 0.3 }}>Logs</strong>
            <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.8 }}>
              NB ready: {String(nbReady)}
            </span>
          </div>
          <div
            ref={logRef}
            style={{
              overflowY: "auto",
              whiteSpace: "pre-wrap",
              fontSize: 12,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              lineHeight: 1.35,
              paddingRight: 6,
            }}
          >
            {logs.length === 0 ? (
              <div style={{ opacity: 0.75 }}>No logs yet…</div>
            ) : (
              logs.map((l, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  {l}
                </div>
              ))
            )}
          </div>
       
        </div>
      )}

      {/* Header */}
      <div className="bg-[#005e54] text-white p-4 flex items-center gap-2 shadow-md sticky top-0 right-0 left-0 z-10 h-16">
        <img src={agent} alt="Agent" className="w-10 h-10 rounded-full" />
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-3">
              <p className="font-bold text-sm">Live Benefit Helpline</p>
              <img src={tick} className="w-4 h-4" style={{ marginLeft: "-6px" }} />
            </div>
            <p className="text-sm ">online</p>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-white" />
            <Paperclip className="w-5 h-5 text-white" />
            <EllipsisVertical className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto flex flex-col mt-[1%] pb-52">
        {messages.map((msg, index) => {
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: msg.sender === "bot" ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`flex relative ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "bot" && msg.lastInSequence && (
                <img
                  src={agent}
                  alt="Bot"
                  className="w-8 h-8 rounded-full mr-2 absolute bottom-0"
                />
              )}
              <motion.div
                initial={{ width: 0, height: 15 }}
                animate={{ width: "auto", height: "auto" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`pt-2 px-2 pb-0 rounded-lg text-base shadow-md ${
                  msg.sender === "user"
                    ? "bg-[#dcf8c6] text-gray-800"
                    : "bg-white text-gray-800 ms-10"
                }`}
                style={{ minWidth: "70px", overflow: "hidden" }}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  dangerouslySetInnerHTML={{ __html: msg.text }}
                />
                <span className="flex flex-row-reverse gap-1 items-center">
                  {msg.sender === "user" && <img src={deliver} className="h-4 w-4" alt="" />}
                  <span className="text-[10px] text-gray-400">
                    {getFormattedTime(msg.time)}
                  </span>
                </span>
              </motion.div>
            </motion.div>
          );
        })}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-2"
          >
            <img src={agent} alt="Bot" className="w-8 h-8 rounded-full" />
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-xs p-2 rounded-lg text-sm bg-white text-gray-800 flex items-center gap-1"
            >
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
            </motion.div>
          </motion.div>
        )}

        {showInput && (
          <div className="mt-2 flex items-center gap-2 justify-end">
            <input
              type="text"
              className="border w-[60vw] p-4 rounded-2xl"
              placeholder="Type your name..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button
              className="px-5 py-4 bg-[#005e54] text-white rounded-2xl"
              onClick={handleSendInput}
            >
              <SendHorizontalIcon className="w-6 h-6" />
            </button>
          </div>
        )}

        {currentOptions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 items-center justify-start ms-10">
            {currentOptions.map((option, i) => (
              <button
                key={i}
                className="px-6 py-3 bg-[#005e54] text-white rounded-full text-lg"
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* Final message section which likely contains tel: links inside RghibCall2 */}
        {finalMessage && (
          <RghibCall2
            finalMessage={finalMessage}
            switchNumber={switchNumber}
          />
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

/* ---------- styles for debug buttons ---------- */
const btnStyle = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,.15)",
  background: "rgba(55,65,81,.8)",
  color: "#fff",
  fontSize: 12,
  cursor: "pointer",
};
