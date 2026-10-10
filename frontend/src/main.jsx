import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";

// Root — router + toast provider in one place
createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Router for all pages */}
    <BrowserRouter>
      <App />
      {/* Toast — primary popups, bottom right */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: "#05829a", color: "white", fontFamily: "Lato, sans-serif" },
          success: { iconTheme: { primary: "white", secondary: "#05829a" } },
          error: { style: { background: "#e05252", color: "white" }, iconTheme: { primary: "white", secondary: "#e05252" } },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
);
