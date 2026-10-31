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
          duration: 6000,
          // SHOP.CO palette — black toasts, red errors, Satoshi type
          style: { background: "#000000", color: "white", fontFamily: "Satoshi, sans-serif", borderRadius: "16px" },
          success: { iconTheme: { primary: "#01ab31", secondary: "white" } },
          error: { style: { background: "#ff3333", color: "white" }, iconTheme: { primary: "white", secondary: "#ff3333" } },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
);
