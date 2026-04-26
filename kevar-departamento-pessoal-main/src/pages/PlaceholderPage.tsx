import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/folha": "Folha de Pagamento",
  "/folha/processamento": "Processamento Mensal",
  "/folha/rubricas": "Rubricas & Verbas",
  "/folha/holerites": "Holerites",
  "/folha/adiantamentos": "Adiantamentos",
  "/admissoes": "Admissões & Rescisões",
  "/admissoes/nova": "Nova Admissão",
  "/admissoes/rescisoes": "Rescisões",
  "/admissoes/contratos": "Contratos",
  "/esocial": "eSocial",
  "/esocial/pendentes": "Eventos Pendentes",
  "/esocial/transmissao": "Transmissão",
  "/esocial/erros": "Monitor de Erros",
  "/encargos": "Encargos",
  "/encargos/inss": "INSS",
  "/encargos/fgts": "FGTS",
  "/encargos/irrf": "IRRF",
  "/encargos/darf": "DARF / GFIP",
  "/ferias": "Férias & 13º Salário",
  "/relatorios": "Relatórios Legais",
  "/configuracoes": "Configurações",
};

export default function PlaceholderPage() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Página";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="font-nirmala text-3xl text-kevar-navy mb-3">{title}</h1>
      <p className="text-muted-foreground font-inter text-sm max-w-md">
        Este módulo está em desenvolvimento. Em breve você terá acesso completo a todas as funcionalidades de {title.toLowerCase()}.
      </p>
      <div className="mt-6 bg-card-std rounded-kevar border border-kevar-border px-8 py-4 shadow-sm">
        <p className="text-xs text-muted-foreground font-inter uppercase tracking-widest">Em breve</p>
      </div>
    </div>
  );
}
