import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // Make sure this matches file name exactly
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
