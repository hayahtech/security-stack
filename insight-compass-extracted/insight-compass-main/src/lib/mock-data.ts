export interface CompanyIdentity {
  name: string;
  cnpj: string;
  location: string;
  partners: string[];
  size: string;
  activity: string;
  foundedDate: string;
}

export interface DomainInfo {
  domain: string;
  dns: { a: string[]; mx: string[]; ns: string[] };
  currentIp: string;
  historicalIps: string[];
  hostingProvider: string;
  serverCountry: string;
  cdn: string;
  httpStatus: number;
  sslValid: boolean;
  sslIssuer: string;
  sslExpiry: string;
}

export interface DigitalPresence {
  siteActive: boolean;
  waybackSnapshots: number;
  firstSeen: string;
  socialMedia: { platform: string; url: string; active: boolean }[];
  apps: { store: string; name: string; rating: number }[];
}

export interface SecurityAnalysis {
  https: boolean;
  headers: { name: string; present: boolean; value?: string }[];
  secureCookies: boolean;
  exposedEndpoints: string[];
  vulnerabilities: string[];
}

export interface Reputation {
  complaints: { source: string; count: number; resolved: number }[];
  rating: number;
  platforms: { name: string; present: boolean; score?: number }[];
}

export interface RiskDetection {
  flags: { description: string; severity: "low" | "medium" | "high" | "critical" }[];
  overallRisk: "Baixo" | "Médio" | "Alto";
  score: number;
}

export interface Competitor {
  name: string;
  domain: string;
  similarity: number;
  conflict: boolean;
}

export interface AIConclusion {
  diagnosis: string;
  riskLevel: "Baixo" | "Médio" | "Alto";
  reliability: number;
  scenarios: { title: string; probability: number; description: string }[];
}

export interface TimelineEvent {
  date: string;
  event: string;
  type: "info" | "warning" | "success" | "danger";
}

export interface InvestigationReport {
  query: string;
  timestamp: string;
  identity: CompanyIdentity;
  domain: DomainInfo;
  presence: DigitalPresence;
  security: SecurityAnalysis;
  reputation: Reputation;
  risk: RiskDetection;
  competitors: Competitor[];
  conclusion: AIConclusion;
  timeline: TimelineEvent[];
}

function extractDomain(input: string): string {
  let d = input.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  return d || input;
}

export function generateMockReport(query: string): InvestigationReport {
  const domain = extractDomain(query);
  const isGov = domain.includes(".gov");
  const isBr = domain.includes(".br");

  const score = isGov ? 72 : Math.floor(Math.random() * 40) + 55;

  return {
    query,
    timestamp: new Date().toISOString(),
    identity: {
      name: isGov ? `Prefeitura Municipal de ${domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1)}` : `${domain.split(".")[0].toUpperCase()} Tecnologia LTDA`,
      cnpj: isBr ? "12.345.678/0001-90" : "N/A",
      location: isGov ? "Minas Gerais, Brasil" : "São Paulo, SP, Brasil",
      partners: isGov ? ["Administração Pública Municipal"] : ["João Silva", "Maria Oliveira", "Carlos Santos"],
      size: isGov ? "Órgão Público" : "Médio Porte",
      activity: isGov ? "Administração Pública em Geral" : "Desenvolvimento de Software",
      foundedDate: isGov ? "1948" : "2015",
    },
    domain: {
      domain,
      dns: {
        a: ["104.21.35.12", "172.67.182.44"],
        mx: [`mail.${domain}`, `mx2.${domain}`],
        ns: ["ns1.cloudflare.com", "ns2.cloudflare.com"],
      },
      currentIp: "104.21.35.12",
      historicalIps: ["198.51.100.14", "203.0.113.42", "104.21.35.12"],
      hostingProvider: "Cloudflare, Inc.",
      serverCountry: isBr ? "Brasil" : "Estados Unidos",
      cdn: "Cloudflare",
      httpStatus: 200,
      sslValid: true,
      sslIssuer: "Let's Encrypt Authority X3",
      sslExpiry: "2026-08-15",
    },
    presence: {
      siteActive: true,
      waybackSnapshots: isGov ? 342 : 89,
      firstSeen: isGov ? "2008-03-15" : "2018-06-22",
      socialMedia: [
        { platform: "Facebook", url: `https://facebook.com/${domain.split(".")[0]}`, active: true },
        { platform: "Instagram", url: `https://instagram.com/${domain.split(".")[0]}`, active: isGov },
        { platform: "Twitter/X", url: `https://x.com/${domain.split(".")[0]}`, active: false },
        { platform: "LinkedIn", url: `https://linkedin.com/company/${domain.split(".")[0]}`, active: !isGov },
      ],
      apps: isGov
        ? [{ store: "Google Play", name: "Canapolys Cidadão", rating: 3.2 }]
        : [
            { store: "Google Play", name: `${domain.split(".")[0]} App`, rating: 4.1 },
            { store: "App Store", name: `${domain.split(".")[0]} App`, rating: 4.3 },
          ],
    },
    security: {
      https: true,
      headers: [
        { name: "Strict-Transport-Security", present: true, value: "max-age=31536000" },
        { name: "Content-Security-Policy", present: false },
        { name: "X-Frame-Options", present: true, value: "SAMEORIGIN" },
        { name: "X-Content-Type-Options", present: true, value: "nosniff" },
        { name: "X-XSS-Protection", present: false },
        { name: "Referrer-Policy", present: isGov },
        { name: "Permissions-Policy", present: false },
      ],
      secureCookies: isGov,
      exposedEndpoints: isGov
        ? ["/api/v1/docs", "/wp-admin", "/wp-login.php"]
        : ["/api/health", "/swagger-ui"],
      vulnerabilities: isGov
        ? ["WordPress desatualizado detectado", "Endpoint /wp-admin exposto publicamente"]
        : ["Falta de CSP pode permitir XSS", "X-XSS-Protection header ausente"],
    },
    reputation: {
      complaints: [
        { source: "Reclame Aqui", count: isGov ? 23 : 8, resolved: isGov ? 12 : 6 },
        { source: "Procon", count: isGov ? 5 : 2, resolved: isGov ? 3 : 2 },
      ],
      rating: isGov ? 5.8 : 7.2,
      platforms: [
        { name: "Google", present: true, score: isGov ? 3.4 : 4.1 },
        { name: "Reclame Aqui", present: true, score: isGov ? 5.8 : 7.2 },
        { name: "Trustpilot", present: !isGov, score: isGov ? undefined : 3.9 },
      ],
    },
    risk: {
      flags: [
        ...(isGov
          ? [
              { description: "WordPress desatualizado com vulnerabilidades conhecidas", severity: "high" as const },
              { description: "Painel administrativo exposto publicamente", severity: "critical" as const },
              { description: "Content-Security-Policy ausente", severity: "medium" as const },
              { description: "Cookies sem flag Secure em algumas rotas", severity: "medium" as const },
            ]
          : [
              { description: "Content-Security-Policy não configurada", severity: "medium" as const },
              { description: "Swagger UI exposto em produção", severity: "low" as const },
            ]),
      ],
      overallRisk: isGov ? "Médio" : "Baixo",
      score,
    },
    competitors: [
      { name: `${domain.split(".")[0]}-digital.com.br`, domain: `${domain.split(".")[0]}-digital.com.br`, similarity: 78, conflict: false },
      { name: `${domain.split(".")[0]}online.com`, domain: `${domain.split(".")[0]}online.com`, similarity: 65, conflict: true },
    ],
    conclusion: {
      diagnosis: isGov
        ? `O domínio ${domain} pertence a uma entidade governamental municipal legítima. A infraestrutura utiliza Cloudflare como CDN e WordPress como CMS. Foram identificadas vulnerabilidades de segurança moderadas, incluindo exposição do painel administrativo e ausência de headers de segurança críticos. A presença digital é compatível com órgãos públicos municipais de médio porte, com atividade regular nas redes sociais e histórico consistente no Wayback Machine desde 2008.`
        : `A empresa associada ao domínio ${domain} apresenta estrutura digital consistente com uma empresa de tecnologia de médio porte. A infraestrutura é moderna, utilizando Cloudflare para CDN e proteção. Os headers de segurança precisam de melhorias, mas não representam risco imediato. A presença digital é adequada e a reputação online é positiva.`,
      riskLevel: isGov ? "Médio" : "Baixo",
      reliability: score,
      scenarios: [
        { title: isGov ? "Órgão Público Legítimo" : "Empresa Legítima", probability: 92, description: "Estrutura consistente com a proposta declarada" },
        { title: "Projeto em Evolução", probability: 6, description: "Possibilidade de reestruturação em andamento" },
        { title: "Risco de Marca", probability: 2, description: "Domínios similares podem causar confusão" },
      ],
    },
    timeline: [
      { date: isGov ? "2008-03-15" : "2018-06-22", event: "Primeiro registro no Wayback Machine", type: "info" },
      { date: isGov ? "2015-07-10" : "2020-01-15", event: "Migração para Cloudflare detectada", type: "success" },
      { date: isGov ? "2022-11-03" : "2023-03-20", event: "Certificado SSL renovado", type: "success" },
      { date: isGov ? "2024-02-18" : "2024-06-10", event: "Atualização de infraestrutura detectada", type: "info" },
      { date: "2025-01-05", event: "Última verificação de segurança", type: "warning" },
      { date: new Date().toISOString().split("T")[0], event: "Análise OSINT Inspector realizada", type: "info" },
    ],
  };
}
