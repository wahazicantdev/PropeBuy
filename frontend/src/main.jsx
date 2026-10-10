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
      {/* Toast — primary color styling, top center */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: { fontFamily: "Lato, sans-serif" },
          success: { iconTheme: { primary: "#05829a", secondary: "white" } },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
);
