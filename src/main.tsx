import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

const applySystemTheme = (isDark: boolean) => {
  document.documentElement.classList.toggle("dark", isDark);
};

applySystemTheme(darkModeQuery.matches);

darkModeQuery.addEventListener("change", (event) => {
  applySystemTheme(event.matches);
});

createRoot(document.getElementById("root")!).render(<App />);
