export type SessionStatus = "success" | "blocked" | "failed";
export type BackupStatus = "complete" | "in_progress" | "failed";

export interface LoginSession {
  id: string;
  date: string;
  user: string;
  ip: string;
  location: string;
  device: string;
  status: SessionStatus;
  reason?: string;
}

export interface ActiveSession {
  id: string;
  user: string;
  device: string;
  location: string;
  startedAt: string;
  isCurrent?: boolean;
}

export interface BackupRecord {
  id: string;
  date: string;
  size: string;
  status: BackupStatus;
  type: "automatic" | "manual";
}

export interface SecurityAlert {
  id: string;
  date: string;
  type: "suspicious_login" | "failed_attempts" | "new_device" | "new_country";
  message: string;
  user: string;
  resolved: boolean;
  action?: "confirm" | "block";
}

export const loginSessions: LoginSession[] = [
  { id: "s1", date: "2025-03-09 09:14", user: "carlos@techbr.com", ip: "177.23.45.12", location: "São Paulo, BR", device: "Chrome / Mac", status: "success" },
  { id: "s2", date: "2025-03-09 08:47", user: "ana@techbr.com", ip: "189.45.67.89", location: "Rio de Janeiro, BR", device: "Safari / iPhone", status: "success" },
  { id: "s3", date: "2025-03-08 23:12", user: "carlos@techbr.com", ip: "45.89.123.45", location: "Moscou, RU", device: "Chrome / Win", status: "blocked", reason: "IP suspeito" },
  { id: "s4", date: "2025-03-08 19:33", user: "rafael@techbr.com", ip: "177.23.45.12", location: "São Paulo, BR", device: "Firefox / Win", status: "success" },
  { id: "s5", date: "2025-03-08 14:22", user: "mariana@techbr.com", ip: "200.12.34.56", location: "Curitiba, BR", device: "Chrome / Win", status: "success" },
  { id: "s6", date: "2025-03-08 11:05", user: "carlos@techbr.com", ip: "177.23.45.12", location: "São Paulo, BR", device: "Chrome / Mac", status: "success" },
  { id: "s7", date: "2025-03-08 09:30", user: "ana@techbr.com", ip: "189.45.67.89", location: "Rio de Janeiro, BR", device: "Safari / iPhone", status: "success" },
  { id: "s8", date: "2025-03-07 22:15", user: "carlos@techbr.com", ip: "177.23.45.12", location: "São Paulo, BR", device: "Safari / iPad", status: "success" },
  { id: "s9", date: "2025-03-07 18:40", user: "pedro@techbr.com", ip: "201.45.78.90", location: "Belo Horizonte, BR", device: "Chrome / Android", status: "success" },
  { id: "s10", date: "2025-03-07 15:12", user: "ana@techbr.com", ip: "189.45.67.89", location: "Rio de Janeiro, BR", device: "Chrome / Mac", status: "success" },
  { id: "s11", date: "2025-03-07 10:25", user: "carlos@techbr.com", ip: "177.23.45.12", location: "São Paulo, BR", device: "Chrome / Mac", status: "success" },
  { id: "s12", date: "2025-03-06 23:45", user: "unknown@test.com", ip: "103.45.67.89", location: "Beijing, CN", device: "Firefox / Linux", status: "blocked", reason: "Usuário não existe" },
  { id: "s13", date: "2025-03-06 20:30", user: "rafael@techbr.com", ip: "177.23.45.12", location: "São Paulo, BR", device: "Firefox / Win", status: "success" },
  { id: "s14", date: "2025-03-06 16:18", user: "mariana@techbr.com", ip: "200.12.34.56", location: "Curitiba, BR", device: "Edge / Win", status: "success" },
  { id: "s15", date: "2025-03-06 12:05", user: "carlos@techbr.com", ip: "177.23.45.12", location: "São Paulo, BR", device: "Chrome / Mac", status: "success" },
  { id: "s16", date: "2025-03-06 08:30", user: "ana@techbr.com", ip: "189.45.67.89", location: "Rio de Janeiro, BR", device: "Safari / iPhone", status: "failed", reason: "Senha incorreta" },
  { id: "s17", date: "2025-03-06 08:31", user: "ana@techbr.com", ip: "189.45.67.89", location: "Rio de Janeiro, BR", device: "Safari / iPhone", status: "success" },
  { id: "s18", date: "2025-03-05 19:20", user: "pedro@techbr.com", ip: "201.45.78.90", location: "Belo Horizonte, BR", device: "Chrome / Android", status: "success" },
  { id: "s19", date: "2025-03-05 14:55", user: "carlos@techbr.com", ip: "177.23.45.12", location: "São Paulo, BR", device: "Chrome / Mac", status: "success" },
  { id: "s20", date: "2025-03-05 09:10", user: "rafael@techbr.com", ip: "177.23.45.12", location: "São Paulo, BR", device: "Firefox / Win", status: "success" },
];

export const activeSessions: ActiveSession[] = [
  { id: "as1", user: "carlos@techbr.com", device: "Chrome / Mac", location: "São Paulo", startedAt: "há 23 minutos", isCurrent: true },
  { id: "as2", user: "ana@techbr.com", device: "Safari / iPhone", location: "Rio de Janeiro", startedAt: "há 2 horas" },
  { id: "as3", user: "rafael@techbr.com", device: "Firefox / Win", location: "São Paulo", startedAt: "há 4 horas" },
];

export const securityAlerts: SecurityAlert[] = [
  {
    id: "alert1",
    date: "2025-03-08 23:12",
    type: "suspicious_login",
    message: "Tentativa de login bloqueada de Moscou, RU — usuário carlos@techbr.com. Este foi você?",
    user: "carlos@techbr.com",
    resolved: false,
  },
  {
    id: "alert2",
    date: "2025-03-06 23:45",
    type: "suspicious_login",
    message: "Tentativa de login com usuário inexistente de Beijing, CN",
    user: "unknown@test.com",
    resolved: true,
  },
];

export const backupRecords: BackupRecord[] = [
  { id: "b1", date: "2025-03-09 03:00", size: "2,4 GB", status: "complete", type: "automatic" },
  { id: "b2", date: "2025-03-08 03:00", size: "2,3 GB", status: "complete", type: "automatic" },
  { id: "b3", date: "2025-03-07 03:00", size: "2,3 GB", status: "complete", type: "automatic" },
  { id: "b4", date: "2025-03-06 03:00", size: "2,2 GB", status: "complete", type: "automatic" },
  { id: "b5", date: "2025-03-05 03:00", size: "2,2 GB", status: "complete", type: "automatic" },
  { id: "b6", date: "2025-03-04 03:00", size: "2,1 GB", status: "complete", type: "automatic" },
  { id: "b7", date: "2025-03-03 03:00", size: "2,1 GB", status: "complete", type: "automatic" },
  { id: "b8", date: "2025-03-02 03:00", size: "2,0 GB", status: "complete", type: "automatic" },
  { id: "b9", date: "2025-03-01 03:00", size: "2,0 GB", status: "complete", type: "automatic" },
  { id: "b10", date: "2025-02-28 03:00", size: "1,9 GB", status: "complete", type: "automatic" },
];

export const securitySettings = {
  sessionTimeout: 8,
  maxConcurrentSessions: 3,
  maxFailedAttempts: 5,
  alertNewCountry: true,
  require2FA: false,
};

export const backupInfo = {
  lastBackup: "Hoje, 03:00",
  frequency: "Diário automático",
  retention: "90 dias",
  location: "AWS S3 — região us-east-1",
  size: "2,4 GB",
  encryption: "AES-256",
};

export const users2FAStatus = [
  { email: "carlos@techbr.com", name: "Carlos Silva", role: "Admin", twoFAEnabled: true, method: "authenticator" },
  { email: "ana@techbr.com", name: "Ana Costa", role: "CFO", twoFAEnabled: true, method: "sms" },
  { email: "rafael@techbr.com", name: "Rafael Souza", role: "Contador", twoFAEnabled: false },
  { email: "mariana@techbr.com", name: "Mariana Lima", role: "Financeiro", twoFAEnabled: false },
  { email: "pedro@techbr.com", name: "Pedro Santos", role: "Analista", twoFAEnabled: false },
];
