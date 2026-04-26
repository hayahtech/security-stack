import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Valida variáveis de ambiente obrigatórias antes de montar o app
const REQUIRED_ENV = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;

const missing = REQUIRED_ENV.filter(
  (key) => !import.meta.env[key]
);

if (missing.length > 0) {
  document.body.innerHTML = `
    <div style="font-family:sans-serif;padding:2rem;color:#b91c1c;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;margin:2rem;max-width:500px">
      <strong>Configuração incompleta</strong><br/><br/>
      As seguintes variáveis de ambiente estão ausentes:<br/>
      <code>${missing.join(", ")}</code><br/><br/>
      Crie um arquivo <code>.env</code> a partir do <code>.env.example</code> e reinicie o servidor.
    </div>`;
  throw new Error(`Env vars ausentes: ${missing.join(", ")}`);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
