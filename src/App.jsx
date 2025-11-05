import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Chatbot from './Chatbot';
import ChatbotTwo from './Chatbottwo';
import ChatbotThree from './ChatbotThree';
import ChatbotFour from './ChatbotFour';
import Chatbotdq from './Chatbotdq';
import Chatbotdq2 from './Chatbotdq2';
import Home from './Home';
import Chatbot2 from './Chatbot2';
import Raghib from './Raghib';
import Raghib2 from './Raghib2';
import Raghib3 from "./Raghib3";
import Ok from './Ok';
import Tester from './Tester'

const App = () => {
  // sds
  return (
    <Router>
      <Routes>
      {/* <Route path="/" element={<Chatbotdq2 />} /> */}
        {/* <Route path="/engsf1" element={<Chatbotdq />} />
        <Route path="/engsfdq" element={<Chatbotdq2 />} />
        <Route path="/engsf2200" element={<ChatbotTwo />} /> */}
        {/* <Route path="/thousands1" element={<Chatbotdq2 />} /> */}
        {/* <Route path="/engsf2200dup" element={<ChatbotFour />} />
        <Route path="/engsafe1" element={<Chatbot2 />} /> */}
        <Route path="/" element={<Raghib />} />
        {/* <Route path="/raghib" element={<Raghib3 />} /> */}
         <Route path="/raghib" element={<Raghib2 />} />
          <Route path="/newdes1" element={<Ok />} />
          <Route path="/tester" element={<Tester/>}/>
      
      </Routes>
    </Router>
  );
};

export default App;
