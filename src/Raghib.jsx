import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import agent from "../src/assets/pic.png";
import tick from "../src/assets/tick2.png";
import deliver from "../src/assets/delivered.svg"
import {
  CheckCheck,
  EllipsisVertical,
  Paperclip,
  Phone,
  Send,
  SendHorizontalIcon,
} from "lucide-react";
import RaghibFinal from "./RaghibFinal";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [finalMessage, setFinalMessage] = useState(false);
  const [switchNumber, setSwitchNumber] = useState(true);
  const [checkLink, setCheckLink] = useState(0);
  const [isunder65, setIsunder65] = useState(false);
  const messagesEndRef = useRef(null);

  const getFormattedTime = (timeString) => {
    return timeString.split(" ")[0].split(":").slice(0, 2).join(":");
  };

  useEffect(() => {
    const initialMessages = [
      {
        text: "Hey there! 👋",
        sender: "bot",
      },
      {
        text: "Emily this side. Let’s find out if you qualify for any unclaimed benefits — it’s quick and only takes 2 minutes!",
        sender: "bot",
        time: new Date().toTimeString(),
      },
      {
        text: "Tap 'Yes' to get started! ⬇️",
        sender: "bot",
        options: ["👉 Yes, Help me qualify!"],
        time: new Date().toTimeString(),
      },
    ];
    addMessagesWithDelay(initialMessages);
  }, []);

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

  const handleOptionClick = (option) => {
    if (option === "👉 Yes, Help me qualify!") {
      setMessages((prev) => [
        ...prev,
        { text: "Yes", sender: "user", time: new Date().toTimeString() },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { text: option, sender: "user", time: new Date().toTimeString() },
      ]);
    }
    setShowInput(false);
    setCurrentOptions([]);
    let botResponses = [];

    if (option === "👉 Yes, Help me qualify!") {
      botResponses = [
        {
          text: "Awesome! Let's get you the benefits you deserve ASAP. I just need to ask you a couple of quick questions.",
          sender: "bot",
        },
        {
          text: "Are you under the age of 65?",
          sender: "bot",
          options: ["Yes, I am under 65", "No, I am over 65"],
        },
      ];
    } else if (
      option === "Yes, I am under 65" || option === "No, I am over 65"
    ) {
      botResponses = [
        {
          text: "Do you live in the United States?",
          sender: "bot",
          options: ["Yes ", "No "],
        },
      ];
      if(option === "Yes, I am under 65"){
        setCheckLink(1);
        setIsunder65(true);
      }
    }
    // else if (
    //   option === "No, I am over 65"
    // ) {
    //   botResponses = [
    //     {
    //       text: "Unfortunately, you don’t qualify for this Spending Allowance.",
    //       sender: "bot",
    //     },
    //     {
    //       text: "BUT, based on what you’ve told me, I see you qualify for a Food Allowance Card worth thousands of dollars!",
    //       sender: "bot",
    //     },
    //     {
    //       text: "Are you interested in claiming it?",
    //       sender: "bot",
    //       options: [" Yes", " No"],
    //     },
    //   ];
    // }
    else if (option === "Yes " || option === "No ") {
      botResponses = [
        {
          text: "Are you on Medicare or Medicaid?",
          sender: "bot",
          options: ["  Yes", "No"],
        },
      ];
      if(option === "Yes " && checkLink === 1){
        setCheckLink(2);
      }
    }else if (option === "  Yes" || option === "No") {
      if (option === "  Yes" && checkLink === 2){
        botResponses = [
                {
                  text: "Redirecting you now...",
                  sender: "bot",
                },
              ];
              setTimeout(() => {
                window.location.href = "https://rewarduplevel.com/aff_c?offer_id=1421&aff_id=2065";
              }, 2000);
      }else {
          botResponses = [
            {
              text: "Great, I’ve qualified you for the Food Allowance Card, worth thousands of dollars a year.",
              sender: "bot",
            },
            {
              text: "This card can be used at all grocery & medical store across United States.",
              sender: "bot",
            },
          ];
          if(isunder65){
            setSwitchNumber(false);
          }
          setTimeout(() => {
            setFinalMessage(true);
          }, 4000);
      }
    }
    // else if (option === "  Yes"){
    // botResponses = [
    //   {
    //     text: "Unfortunately, you don’t qualify for this Spending Allowance.",
    //     sender: "bot",
    //   },
    //   {
    //     text: "BUT, based on what you’ve told me, I see you qualify for a $1250 Stimulus Check from the gov!",
    //     sender: "bot",
    //   },
    //   {
    //     text: "Are you interested in claiming it?",
    //     sender: "bot",
    //     options: ["Yes, I want to claim!", "No, I’ll skip."],
    //   },
   
    // ];
    // }

    // if (option === "Yes, I want to claim!" || option === "No, I’ll skip.") {
    //   botResponses = [
    //     {
    //       text: "Redirecting you now...",
    //       sender: "bot",
    //     },
    //   ];
    //   setTimeout(() => {
    //     window.location.href = "https://rewarduplevel.com/aff_c?offer_id=1421&aff_id=2065";
    //   }, 2000);
    // }
    // else if (option === " No"){
    //   botResponses = [
    //     {
    //       text: "Sorry you don’t qualify",
    //       sender: "bot",
    //     },
    //   ];
    // }
    // else if (option === "Yes" || option === "No") {
    //   botResponses = [
    //     {
    //       text: "🎉 Fantastic news! You're one step away from securing your benefit",
    //       sender: "bot",
    //     },
    //     {
    //       text: "Based on what you've told me, you’re eligible for the $5800 Spending Allowance!",
    //       sender: "bot",
    //     },
    //   ];
    //   setTimeout(() => {
    //     setFinalMessage(true);
    //   }, 4000);
    // }
    addMessagesWithDelay(botResponses);
  };

  const handleSendInput = () => {
    if (inputValue.trim() === "") return;
    setMessages((prev) => [...prev, { text: inputValue, sender: "user" }]);
    setInputValue("");
    setShowInput(false);
    let botResponses = [
      { text: `Nice to meet you, ${inputValue}!`, sender: "bot" },
      {
        text: "Let's begin your Soulmate Portrait.",
        sender: "bot",
        options: ["Start"],
      },
    ];
    addMessagesWithDelay(botResponses);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if(finalMessage){
        container.scrollTo({
          top: container.scrollHeight - container.clientHeight - 100,
          behavior: "smooth",
        });
      }else{
        container.scrollTo({
          top: container.scrollHeight - container.clientHeight,
          behavior: "smooth",
        });
      }
    }
  }, [messages, finalMessage, isTyping]);
  
  
  return (
    <div
      className="w-full h-screen flex flex-col bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
      }}
    >
      <div className="bg-[#005e54] text-white p-4 flex items-center gap-2 shadow-md sticky top-0 right-0 left-0 z-10 h-16">
        <img
          src={agent}
          alt="Psychic Master"
          className="w-10 h-10 rounded-full"
        />
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-3">
              <p className="font-bold text-sm">Live Benefit Helpline</p>
              <img src={tick} className="w-4 h-4"  style={{marginLeft:"-6px"}}/>
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
                >
                  {msg.text}
                </motion.span>

                <span className="flex flex-row-reverse gap-1 items-center">
                  {msg.sender === "user" && (
                    <img src={deliver} className="h-4 w-4" />
                  )}
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
        {finalMessage && <RaghibFinal finalMessage={finalMessage} switchNumber={switchNumber}/>}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
