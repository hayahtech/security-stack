import { GradientCard } from "@/components/GradientCard";
import { Button } from "@/components/ui/button";

const mockErros = [
  { id: 1, evento: "S-2200", funcionario: "Pedro Santos", codigo: "MS0082", mensagem: "CPF do trabalhador inválido ou não encontrado na base da RFB", dataOcorrencia: "10/03/2025", tentativas: 2, status: "Não Resolvido" },
  { id: 2, evento: "S-1200", funcionario: "Juliana Mendes", codigo: "MS0156", mensagem: "Rubrica informada não cadastrada na tabela S-1010", dataOcorrencia: "07/03/2025", tentativas: 1, status: "Não Resolvido" },
  { id: 3, evento: "S-1210", funcionario: "Fernando Souza", codigo: "MS0201", mensagem: "Data de pagamento anterior à competência informada", dataOcorrencia: "05/03/2025", tentativas: 3, status: "Resolvido" },
  { id: 4, evento: "S-2299", funcionario: "Ana Paula Ferreira", codigo: "MS0320", mensagem: "Motivo do desligamento incompatível com tipo de contrato", dataOcorrencia: "01/03/2025", tentativas: 1, status: "Resolvido" },
];

export default function MonitorErrosPage() {
  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">Monitor de Erros eSocial</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GradientCard variant="alert">
          <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1 font-inter">Erros Ativos</p>
          <h3 className="font-nirmala text-3xl text-foreground">2</h3>
          <p className="text-[10px] text-accent mt-1 font-inter">Requerem ação imediata</p>
        </GradientCard>
        <GradientCard variant="esocial">
          <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1 font-inter">Resolvidos</p>
          <h3 className="font-nirmala text-3xl text-foreground">2</h3>
          <p className="text-[10px] text-muted-foreground mt-1 font-inter">Neste mês</p>
        </GradientCard>
      </div>

      <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm font-inter">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 text-muted-foreground font-medium">Evento</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Funcionário</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Código</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Mensagem</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Data</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Status</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockErros.map((e) => (
              <tr key={e.id} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4 font-bold text-foreground">{e.evento}</td>
                <td className="px-6 py-4 text-foreground">{e.funcionario}</td>
                <td className="px-6 py-4 text-destructive font-mono text-xs">{e.codigo}</td>
                <td className="px-6 py-4 text-foreground text-xs max-w-xs">{e.mensagem}</td>
                <td className="px-6 py-4 text-foreground">{e.dataOcorrencia}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    e.status === "Resolvido" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-destructive/10 text-destructive"
                  }`}>{e.status}</span>
                </td>
                <td className="px-6 py-4">
                  {e.status !== "Resolvido" && <Button variant="outline" size="sm" className="text-xs font-inter">Corrigir</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
