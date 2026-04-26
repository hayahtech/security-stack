import { useState, useCallback, useEffect } from "react";
import { secureSetItem, secureGetItem, secureRemoveItem } from "@/lib/secure-storage";

export interface OnboardingData {
  // Step 1
  profileType: "produtor" | "pessoal" | "ambos" | null;
  // Step 2
  fullName: string;
  nickname: string;
  document: string;
  documentType: "cpf" | "cnpj";
  phone: string;
  whatsapp: boolean;
  state: string;
  // Step 3
  farmName: string;
  farmCity: string;
  farmState: string;
  farmArea: string;
  mainActivity: string;
  herdSize: string;
  nirf: string;
  ie: string;
  lat: number | null;
  lng: number | null;
  // Step 4
  importMethod: "csv" | "manual" | "later" | null;
  manualAnimals: Array<{ earTag: string; sex: string; category: string; birthDate: string }>;
  csvAnimalsCount: number;
  // Step 5
  accounts: Array<{
    id: string;
    type: "conta_corrente" | "cartao_credito" | "caixa" | "digital";
    bank: string;
    details: string;
    closingDay?: string;
    dueDay?: string;
  }>;
  // Step 6
  categoriesCustomized: boolean;
  // LGPD
  lgpdConsent: boolean;
  lgpdConsentDate: string | null;
}

export const defaultOnboardingData: OnboardingData = {
  profileType: null,
  fullName: "",
  nickname: "",
  document: "",
  documentType: "cpf",
  phone: "",
  whatsapp: true,
  state: "",
  farmName: "",
  farmCity: "",
  farmState: "",
  farmArea: "",
  mainActivity: "",
  herdSize: "",
  nirf: "",
  ie: "",
  lat: null,
  lng: null,
  importMethod: null,
  manualAnimals: [],
  csvAnimalsCount: 0,
  accounts: [],
  categoriesCustomized: false,
  lgpdConsent: false,
  lgpdConsentDate: null,
};

export function useOnboarding() {
  const [completed, setCompleted] = useState<boolean>(() => {
    // SECURITY: completion flag is non-sensitive, plain localStorage is fine
    return localStorage.getItem("onboarding_completed") === "true";
  });

  const [data, setData] = useState<OnboardingData>(defaultOnboardingData);

  // SECURITY FIX: Load PII data from encrypted storage on mount
  useEffect(() => {
    let cancelled = false;
    secureGetItem("onboarding_data").then((saved) => {
      if (cancelled || !saved) return;
      try {
        setData((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch {
        // corrupted data — ignore
      }
    });
    return () => { cancelled = true; };
  }, []);

  const updateData = useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => {
      const next = { ...prev, ...partial };
      // SECURITY FIX: Encrypt PII before storing (contains CPF, name, phone, etc.)
      secureSetItem("onboarding_data", JSON.stringify(next));
      return next;
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem("onboarding_completed", "true");
    setCompleted(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem("onboarding_completed");
    // SECURITY FIX: Use secure removal for encrypted data
    secureRemoveItem("onboarding_data");
    setCompleted(false);
    setData(defaultOnboardingData);
  }, []);

  const needsFarmSetup = data.profileType === "produtor" || data.profileType === "ambos";
  const needsAnimalImport = needsFarmSetup && ["pecuaria_corte", "leiteira", "mista"].includes(data.mainActivity);

  return { completed, data, updateData, completeOnboarding, resetOnboarding, needsFarmSetup, needsAnimalImport };
}

export const brazilianStates = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA",
  "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN",
  "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];
