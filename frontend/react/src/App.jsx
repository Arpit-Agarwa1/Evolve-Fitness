import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Programs from "./pages/Programs";
import Trainers from "./pages/Trainers";
import Membership from "./pages/Membership";
import Contact from "./pages/Contact";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/programs" element={<Programs />} />
      <Route path="/trainers" element={<Trainers />} />
      <Route path="/membership" element={<Membership />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  );
}

export default App;
