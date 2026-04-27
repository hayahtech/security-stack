import React, { createContext, useContext, useState } from "react";

export type ProfileType = "pessoal" | "empresarial";

interface ProfileContextType {
  profile: ProfileType;
  toggleProfile: () => void;
  isEmpresarial: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ProfileType>("pessoal");

  const toggleProfile = () =>
    setProfile((p) => (p === "pessoal" ? "empresarial" : "pessoal"));

  return (
    <ProfileContext.Provider value={{ profile, toggleProfile, isEmpresarial: profile === "empresarial" }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
