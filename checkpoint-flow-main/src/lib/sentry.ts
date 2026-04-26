/**
 * Sentry — monitoramento de erros em produção
 *
 * Captura exceções não tratadas e as envia para o Sentry com contexto mínimo,
 * sem expor dados pessoais de usuários (conformidade LGPD).
 *
 * Setup:
 *  1. npm install @sentry/react
 *  2. Crie um projeto no sentry.io e copie o DSN
 *  3. Adicione VITE_SENTRY_DSN no .env e no painel do Vercel
 */

import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const IS_PROD = import.meta.env.PROD;

export function initSentry() {
  // Só inicializa em produção e quando o DSN está configurado
  if (!IS_PROD || !DSN) return;

  Sentry.init({
    dsn: DSN,
    environment: 'production',

    // Taxa de amostragem: 10% das sessões para evitar quota excessiva
    // Aumente para 1.0 enquanto estabiliza em produção
    tracesSampleRate: 0.1,

    // Nunca enviar dados pessoais: desabilita coleta de IP e user-agent detalhado
    sendDefaultPii: false,

    // Filtra erros de extensões de browser e frames de terceiros
    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    // Ignora erros comuns de extensões e redes que não são bugs da aplicação
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      /^Network Error$/,
      /^Request failed with status code/,
      /chrome-extension:/,
      /moz-extension:/,
    ],

    beforeSend(event) {
      // Redacta campos sensíveis que possam ter vazado no payload ou stack trace.
      // Padrões cobrem: senha, tokens, chaves de API, e-mail (PII / LGPD Art.5).
      const SENSITIVE_PATTERNS: [RegExp, string][] = [
        [/"password"\s*:\s*"[^"]*"/gi,        '"password":"[REDACTED]"'],
        [/"confirmPassword"\s*:\s*"[^"]*"/gi,  '"confirmPassword":"[REDACTED]"'],
        [/"token"\s*:\s*"[^"]*"/gi,            '"token":"[REDACTED]"'],
        [/"accessToken"\s*:\s*"[^"]*"/gi,      '"accessToken":"[REDACTED]"'],
        [/"refreshToken"\s*:\s*"[^"]*"/gi,     '"refreshToken":"[REDACTED]"'],
        [/"key"\s*:\s*"[^"]*"/gi,              '"key":"[REDACTED]"'],
        [/"apiKey"\s*:\s*"[^"]*"/gi,           '"apiKey":"[REDACTED]"'],
        [/"email"\s*:\s*"[^"@]*@[^"]*"/gi,     '"email":"[REDACTED]"'],
        [/"phone"\s*:\s*"[^"]*"/gi,            '"phone":"[REDACTED]"'],
      ];

      if (event.request?.data && typeof event.request.data === 'string') {
        let redacted = event.request.data;
        for (const [pattern, replacement] of SENSITIVE_PATTERNS) {
          redacted = redacted.replace(pattern, replacement);
        }
        event.request.data = redacted;
      }

      // Redacta também breadcrumbs que possam conter dados sensíveis em mensagens de log
      if (event.breadcrumbs?.values) {
        event.breadcrumbs.values = event.breadcrumbs.values.map(crumb => {
          if (crumb.message) {
            let msg = crumb.message;
            for (const [pattern, replacement] of SENSITIVE_PATTERNS) {
              msg = msg.replace(pattern, replacement);
            }
            return { ...crumb, message: msg };
          }
          return crumb;
        });
      }

      return event;
    },
  });
}

/**
 * Reporta erro manualmente com contexto adicional.
 * Use quando um erro é capturado mas precisa ser enviado ao Sentry
 * com informações extras (ex: fluxo do usuário, operação que falhou).
 *
 * Nunca passe dados pessoais no `context`.
 */
export function reportError(error: unknown, context?: Record<string, string | number | boolean>) {
  if (!IS_PROD || !DSN) {
    if (import.meta.env.DEV) console.error('[Sentry mock]', error, context);
    return;
  }
  Sentry.withScope(scope => {
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
}
