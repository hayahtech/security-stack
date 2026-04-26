/**
 * useSecurityGuard — Proteção contra inspeção indevida (DevTools, F12, clique direito)
 *
 * Ativo apenas em produção. Em dev, não faz nada para não atrapalhar o desenvolvimento.
 *
 * Proteções aplicadas:
 * - Bloqueia F12, Ctrl+Shift+I/J/C/U, Ctrl+U (View Source)
 * - Desativa clique direito ("Inspecionar Elemento")
 * - Detecta abertura do DevTools por tamanho de janela e redireciona
 * - Limpa o console e exibe mensagem de aviso (honeypot visual)
 * - Em produção, sobrescreve console.log/warn/error para silenciar vazamentos
 */

import { useEffect } from 'react';

const IS_PROD = import.meta.env.PROD;

// Mensagem exibida no console para dissuadir curiosos
const CONSOLE_WARNING = `
%c⛔  ATENÇÃO — SISTEMA PROTEGIDO
%cEste sistema é de uso exclusivo de usuários autorizados.
Qualquer tentativa de acesso indevido, manipulação de dados
ou engenharia reversa é passível de responsabilização civil e criminal.
Lei Geral de Proteção de Dados (LGPD) — Lei nº 13.709/2018
Lei de Crimes Informáticos — Lei nº 12.737/2012
`;

const BLOCKED_KEYS = new Set([
  'F12',
  'I', // Ctrl+Shift+I
  'J', // Ctrl+Shift+J
  'C', // Ctrl+Shift+C
  'U', // Ctrl+U (View Source)
]);

function disableConsoleInProd() {
  if (!IS_PROD) return;
  const noop = () => undefined;
  (window as Window & typeof globalThis & { _consoleDisabled?: boolean })._consoleDisabled = true;
  console.log = noop;
  console.warn = noop;
  console.error = noop;
  console.info = noop;
  console.debug = noop;
  console.table = noop;
  console.dir = noop;
  console.group = noop;
  console.groupEnd = noop;
}

function showHoneypot() {
  // Exibe mensagem de aviso visível — não silencia em produção para este log específico
  const originalLog = Function.prototype.bind.call(console.log, console);
  originalLog(CONSOLE_WARNING,
    'font-size:16px;font-weight:bold;color:#ff4444;',
    'font-size:12px;color:#ff8800;'
  );
}

function blockDevToolsKeys(e: KeyboardEvent) {
  const key = e.key?.toUpperCase();

  // F12
  if (key === 'F12') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // Ctrl+Shift+I / J / C
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && BLOCKED_KEYS.has(key)) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // Ctrl+U (View Source)
  if ((e.ctrlKey || e.metaKey) && key === 'U') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // Ctrl+S (Save Page As)
  if ((e.ctrlKey || e.metaKey) && key === 'S') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

function blockRightClick(e: MouseEvent) {
  e.preventDefault();
  return false;
}

/**
 * Detecta abertura do DevTools medindo diferença de tamanho de janela.
 * Quando o painel lateral ou inferior abre, innerWidth/innerHeight enccolhe.
 */
function detectDevToolsBySize() {
  const threshold = 160;
  const widthDiff = window.outerWidth - window.innerWidth;
  const heightDiff = window.outerHeight - window.innerHeight;
  return widthDiff > threshold || heightDiff > threshold;
}

export function useSecurityGuard() {
  useEffect(() => {
    if (!IS_PROD) return; // Não ativa em desenvolvimento

    // 1. Silencia console (exceto o honeypot)
    showHoneypot();
    disableConsoleInProd();

    // 2. Bloqueia teclas de atalho para DevTools
    document.addEventListener('keydown', blockDevToolsKeys, true);

    // 3. Desativa clique direito
    document.addEventListener('contextmenu', blockRightClick);

    // 4. Detecta DevTools aberto por tamanho e redireciona para página vazia de aviso
    let devToolsCheckInterval: ReturnType<typeof setInterval>;
    let devToolsOpen = false;

    devToolsCheckInterval = setInterval(() => {
      if (detectDevToolsBySize()) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          // Redireciona o documento para uma página de aviso
          document.body.innerHTML = `
            <div style="
              display:flex;flex-direction:column;align-items:center;justify-content:center;
              min-height:100vh;background:#0f1a0f;color:#e8f5e9;font-family:sans-serif;
              text-align:center;padding:2rem;
            ">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e53935" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <h1 style="margin-top:1.5rem;font-size:1.5rem;color:#e53935;">Acesso Bloqueado</h1>
              <p style="margin-top:.75rem;max-width:400px;color:#a5d6a7;font-size:.95rem;">
                Ferramentas de desenvolvedor detectadas.<br/>
                Esta sessão foi encerrada por segurança.<br/>
                <strong>Feche as ferramentas de desenvolvedor</strong> e recarregue a página.
              </p>
              <button onclick="window.location.reload()" style="
                margin-top:2rem;padding:.75rem 2rem;background:#1a6b3c;color:#fff;
                border:none;border-radius:.5rem;cursor:pointer;font-size:1rem;
              ">
                Recarregar Página
              </button>
            </div>
          `;
        }
      } else {
        devToolsOpen = false;
      }
    }, 1000);

    // 5. Desabilita seleção de texto via teclado (Ctrl+A) apenas nas áreas de dados sensíveis
    // (não desabilitamos globalmente pois quebraria inputs)

    return () => {
      document.removeEventListener('keydown', blockDevToolsKeys, true);
      document.removeEventListener('contextmenu', blockRightClick);
      clearInterval(devToolsCheckInterval);
    };
  }, []);
}
