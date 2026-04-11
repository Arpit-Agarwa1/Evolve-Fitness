import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Programs from "./pages/Programs";
import Trainers from "./pages/Trainers";
import Membership from "./pages/Membership";
import Contact from "./pages/Contact";
import Register from "./pages/Register";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/programs" element={<Programs />} />
      <Route path="/trainers" element={<Trainers />} />
      <Route path="/membership" element={<Membership />} />
      <Route path="/register" element={<Register />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  );
}

export default App;
