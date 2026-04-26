import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "@/lib/sentry";

// Inicializa Sentry antes de qualquer render — captura erros desde o boot
initSentry();

createRoot(document.getElementById("root")!).render(<App />);
