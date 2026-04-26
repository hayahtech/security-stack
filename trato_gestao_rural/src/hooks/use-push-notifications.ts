import { useState, useEffect, useCallback } from "react";
import { secureSetItem, secureRemoveItem } from "@/lib/secure-storage";

export interface PushSubscriptionState {
  supported: boolean;
  permission: NotificationPermission | "default";
  subscription: PushSubscription | null;
  loading: boolean;
}

// SECURITY FIX: VAPID key loaded from environment variable instead of hardcoded
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
if (!VAPID_PUBLIC_KEY) {
  console.warn("[push-notifications] VITE_VAPID_PUBLIC_KEY is not set. Push notifications will not work.");
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    supported: false,
    permission: "default",
    subscription: null,
    loading: true,
  });

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) {
      setState({ supported: false, permission: "default", subscription: null, loading: false });
      return;
    }

    const checkState = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration("/sw-push.js");
        const subscription = registration ? await registration.pushManager.getSubscription() : null;
        setState({
          supported: true,
          permission: Notification.permission,
          subscription,
          loading: false,
        });
      } catch {
        setState({ supported: true, permission: Notification.permission, subscription: null, loading: false });
      }
    };

    checkState();
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return null;
    try {
      const registration = await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
      return registration;
    } catch (err) {
      console.error("SW registration failed:", err);
      return null;
    }
  }, []);

  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState((s) => ({ ...s, permission, loading: false }));
        return null;
      }

      let registration = await navigator.serviceWorker.getRegistration("/sw-push.js");
      if (!registration) {
        registration = await registerServiceWorker();
      }
      if (!registration) {
        setState((s) => ({ ...s, loading: false }));
        return null;
      }

      // Wait for SW to be ready
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      // In production: save subscription to Supabase
      // await supabase.from('push_subscriptions').upsert({ ... })
      // SECURITY FIX: Encrypt push subscription data (contains endpoint + keys)
      await secureSetItem("push_subscription", JSON.stringify(subscription.toJSON()));

      setState({
        supported: true,
        permission: "granted",
        subscription,
        loading: false,
      });

      return subscription;
    } catch (err) {
      console.error("Push subscribe error:", err);
      setState((s) => ({ ...s, loading: false }));
      return null;
    }
  }, [registerServiceWorker]);

  const unsubscribe = useCallback(async () => {
    if (state.subscription) {
      await state.subscription.unsubscribe();
      // SECURITY FIX: Use secure removal for encrypted subscription data
      secureRemoveItem("push_subscription");
      setState((s) => ({ ...s, subscription: null }));
    }
  }, [state.subscription]);

  const sendTestNotification = useCallback(async () => {
    const registration = await navigator.serviceWorker.getRegistration("/sw-push.js");
    if (!registration) return;

    // Simulate a push notification locally for testing
    registration.showNotification("🐄 AgroFinance Pro", {
      body: "Notificação de teste — tudo funcionando!",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: "test-notification",
      data: { url: "/notificacoes" },
    });
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTestNotification,
    registerServiceWorker,
  };
}

// Push preference types per category
export interface PushPreferences {
  // Rebanho
  partoProximo7dias: boolean;
  partoAmanha: boolean;
  vacinaVencendo7dias: boolean;
  animalCarenciaEmbarcado: boolean;
  animalSemPesagem: boolean;
  diasSemPesagem: number;

  // Financeiro
  contaPagarHoje: boolean;
  contaPagarAmanha: boolean;
  contaEmAtraso: boolean;
  metaAtingida: boolean;
  saldoAbaixoMinimo: boolean;
  saldoMinimo: number;

  // Clima
  chuvaIntensa: boolean;
  estresseTermico: boolean;
  geadaPrevista: boolean;

  // Estoque
  estoqueAbaixoMinimo: boolean;
  medicamentoVencendo: boolean;

  // Atividades
  atividadeHoje: boolean;
  atividadeAtrasada: boolean;

  // Documentos
  documentoVencendo: boolean;
  gtaVencendo: boolean;
  seguroVencendo: boolean;
}

export const defaultPushPreferences: PushPreferences = {
  partoProximo7dias: true,
  partoAmanha: true,
  vacinaVencendo7dias: true,
  animalCarenciaEmbarcado: true,
  animalSemPesagem: false,
  diasSemPesagem: 30,
  contaPagarHoje: true,
  contaPagarAmanha: true,
  contaEmAtraso: true,
  metaAtingida: true,
  saldoAbaixoMinimo: true,
  saldoMinimo: 5000,
  chuvaIntensa: true,
  estresseTermico: true,
  geadaPrevista: true,
  estoqueAbaixoMinimo: true,
  medicamentoVencendo: true,
  atividadeHoje: true,
  atividadeAtrasada: true,
  documentoVencendo: true,
  gtaVencendo: true,
  seguroVencendo: true,
};

export function usePushPreferences() {
  const [prefs, setPrefs] = useState<PushPreferences>(() => {
    try {
      const saved = localStorage.getItem("push_preferences");
      return saved ? { ...defaultPushPreferences, ...JSON.parse(saved) } : defaultPushPreferences;
    } catch {
      return defaultPushPreferences;
    }
  });

  const updatePrefs = useCallback((partial: Partial<PushPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem("push_preferences", JSON.stringify(next));
      return next;
    });
  }, []);

  return { prefs, updatePrefs };
}
