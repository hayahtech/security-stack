import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Desabilita console em produção para evitar vazamento de informações
if (import.meta.env.PROD) {
  const noop = () => undefined;
  console.log = noop;
  console.warn = noop;
  console.debug = noop;
  console.info = noop;
  // console.error mantido para monitoramento de erros reais (ex: Sentry)
}

createRoot(document.getElementById("root")!).render(<App />);
