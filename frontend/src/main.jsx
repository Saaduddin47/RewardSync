import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

const storedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const shouldUseDark = storedTheme ? storedTheme === "dark" : prefersDark;
document.documentElement.classList.toggle("dark", shouldUseDark);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <App />
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
