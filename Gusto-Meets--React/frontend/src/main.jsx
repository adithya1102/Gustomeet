import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // Fix: Added 'r' to BrowserRouter
import App from "./App";
import './index.css';
import './App.css';

const root = document.getElementById("root");
const container = createRoot(root);
container.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
