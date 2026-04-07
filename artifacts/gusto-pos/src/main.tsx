import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initSentry } from "./lib/sentry";

initSentry();

if (navigator.userAgent.includes("Electron")) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
    caches.keys().then((names) => {
      for (const name of names) caches.delete(name);
    });
  }
} else if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
