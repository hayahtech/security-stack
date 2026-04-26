import { useState } from "react";
import { ShoppingCart, Users, PawPrint, AlertTriangle, Calendar, DollarSign, Plus, Stethoscope, Camera, FileText } from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { statsData, vendas, servicos, produtos, clientes, pets as allPets, type Venda, type Servico, type Pet } from "@/lib/mockData";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function DashboardPage() {
  const today = new Date().toISOString().split("T")[0];
  const agendamentosHoje = servicos.filter(s => s.data === today).slice(0, 5);
  const estoqueBaixo = produtos.filter(p => p.estoque < 10);

  const [showVenda, setShowVenda] = useState(false);
  const [showAgendamento, setShowAgendamento] = useState(false);
  const [showPet, setShowPet] = useState(false);
  const [showAtendimento, setShowAtendimento] = useState(false);

  // Venda form
  const [vendaForm, setVendaForm] = useState({ clienteNome: "", itens: "", total: "", tipo: "Produto" as Venda["tipo"] });
  // Agendamento form
  const [agendForm, setAgendForm] = useState({ petId: "", tipo: "Banho" as Servico["tipo"], data: today, hora: "09:00", preco: "60" });
  // Pet form
  const [petForm, setPetForm] = useState({ nome: "", raca: "", idade: "", porte: "Médio" as Pet["porte"], clienteId: "" });
  // Atendimento form
  const [atendForm, setAtendForm] = useState({ petId: "", descricao: "", data: today });

  const quickActions = [
    { label: "Novo Pet", icon: PawPrint, color: "from-pink-500 to-pink-600", onClick: () => setShowPet(true) },
    { label: "Nova Venda", icon: ShoppingCart, color: "from-emerald-500 to-emerald-600", onClick: () => setShowVenda(true) },
    { label: "Novo Agendamento", icon: Calendar, color: "from-blue-500 to-blue-600", onClick: () => setShowAgendamento(true) },
    { label: "Novo Atendimento", icon: Stethoscope, color: "from-purple-500 to-purple-600", onClick: () => setShowAtendimento(true) },
    { label: "Relatórios", icon: FileText, color: "from-amber-500 to-amber-600", onClick: () => toast.info("Módulo de relatórios em breve!") },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full">
      {/* Center: Stats + Tables */}
      <div className="flex-1 space-y-6 min-w-0 order-2 xl:order-1">
        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Vendas Hoje" value={`R$ ${statsData.vendasHoje.toFixed(2)}`} icon={DollarSign} color="success" subtitle={`${statsData.totalVendasHoje} vendas realizadas`} />
          <StatCard title="Agendamentos Hoje" value={statsData.agendamentosHoje} icon={Calendar} color="primary" />
          <StatCard title="Estoque Baixo" value={statsData.estoqueBaixo} icon={AlertTriangle} color="warning" subtitle="Produtos com menos de 10 un." />
          <StatCard title="Total de Pets" value={statsData.totalPets} icon={PawPrint} color="accent" subtitle={`${statsData.totalClientes} clientes cadastrados`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendas recentes */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" /> Vendas Recentes
              </h2>
              <Link to="/vendas" className="text-xs text-primary hover:underline font-medium">Ver todas →</Link>
            </div>
            <div className="divide-y divide-border">
              {vendas.slice(0, 5).map(v => (
                <div key={v.id} className="data-table-row px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{v.clienteNome}</p>
                    <p className="text-xs text-muted-foreground">{v.itens}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">R$ {v.total.toFixed(2)}</p>
                    <StatusBadge status={v.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agendamentos */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Próximos Agendamentos
              </h2>
              <Link to="/servicos" className="text-xs text-primary hover:underline font-medium">Ver todos →</Link>
            </div>
            <div className="divide-y divide-border">
              {agendamentosHoje.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum agendamento para hoje</p>
              )}
              {servicos.slice(0, 5).map(s => (
                <div key={s.id} className="data-table-row px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.petNome} — {s.tipo}</p>
                    <p className="text-xs text-muted-foreground">{s.clienteNome} • {s.data} às {s.hora}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estoque baixo */}
        {estoqueBaixo.length > 0 && (
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="p-5 border-b border-border">
              <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" /> Alerta de Estoque Baixo
              </h2>
            </div>
            <div className="divide-y divide-border">
              {estoqueBaixo.map(p => (
                <div key={p.id} className="data-table-row px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.categoria}</p>
                  </div>
                  <span className="text-sm font-semibold text-destructive">{p.estoque} un.</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Quick Actions vertical */}
      <div className="xl:w-64 shrink-0 order-1 xl:order-2">
        <div className="flex flex-row xl:flex-col gap-3.5 overflow-x-auto xl:overflow-x-visible pb-2 xl:pb-0">
          {quickActions.map(qa => (
            <button
              key={qa.label}
              onClick={qa.onClick}
              className={`flex flex-col items-center justify-center gap-3 p-7 rounded-xl bg-gradient-to-br ${qa.color} text-white shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200 min-w-[180px] xl:min-w-0 xl:w-full`}
            >
              <qa.icon className="w-9 h-9" />
              <span className="text-base font-semibold whitespace-nowrap">{qa.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nova Venda Dialog */}
      <Dialog open={showVenda} onOpenChange={setShowVenda}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Nova Venda</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Cliente</Label><Input value={vendaForm.clienteNome} onChange={e => setVendaForm(f => ({ ...f, clienteNome: e.target.value }))} placeholder="Nome do cliente" /></div>
            <div className="space-y-2"><Label>Itens</Label><Input value={vendaForm.itens} onChange={e => setVendaForm(f => ({ ...f, itens: e.target.value }))} placeholder="Descreva os itens" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Total (R$)</Label><Input type="number" value={vendaForm.total} onChange={e => setVendaForm(f => ({ ...f, total: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={vendaForm.tipo} onValueChange={v => setVendaForm(f => ({ ...f, tipo: v as Venda["tipo"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Produto", "Serviço", "Misto"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={() => { toast.success("Venda registrada!"); setShowVenda(false); }}>Registrar Venda</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Novo Agendamento Dialog */}
      <Dialog open={showAgendamento} onOpenChange={setShowAgendamento}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Novo Agendamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pet</Label>
              <Select value={agendForm.petId} onValueChange={v => setAgendForm(f => ({ ...f, petId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o pet" /></SelectTrigger>
                <SelectContent>{allPets.map(p => <SelectItem key={p.id} value={p.id}>{p.nome} ({p.clienteNome})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={agendForm.tipo} onValueChange={v => { const precos: Record<string, string> = { Banho: "60", Tosa: "80", Vacina: "120", Consulta: "150", "Cortar Unhas": "30", "Banho e Tosa": "120" }; setAgendForm(f => ({ ...f, tipo: v as Servico["tipo"], preco: precos[v] || "60" })); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Banho", "Tosa", "Vacina", "Consulta", "Cortar Unhas", "Banho e Tosa"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={agendForm.data} onChange={e => setAgendForm(f => ({ ...f, data: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Hora</Label><Input type="time" value={agendForm.hora} onChange={e => setAgendForm(f => ({ ...f, hora: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Preço</Label><Input type="number" value={agendForm.preco} onChange={e => setAgendForm(f => ({ ...f, preco: e.target.value }))} /></div>
            </div>
            <Button className="w-full" onClick={() => { toast.success("Agendamento criado!"); setShowAgendamento(false); }}>Criar Agendamento</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Novo Pet Dialog */}
      <Dialog open={showPet} onOpenChange={setShowPet}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Novo Pet</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={petForm.nome} onChange={e => setPetForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do pet" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Raça</Label><Input value={petForm.raca} onChange={e => setPetForm(f => ({ ...f, raca: e.target.value }))} placeholder="Ex: Labrador" /></div>
              <div className="space-y-2"><Label>Idade</Label><Input type="number" value={petForm.idade} onChange={e => setPetForm(f => ({ ...f, idade: e.target.value }))} placeholder="Anos" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Porte</Label>
                <Select value={petForm.porte} onValueChange={v => setPetForm(f => ({ ...f, porte: v as Pet["porte"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Pequeno", "Médio", "Grande"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dono</Label>
                <Select value={petForm.clienteId} onValueChange={v => setPetForm(f => ({ ...f, clienteId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Foto do Pet</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input type="file" accept="image/*" className="hidden" id="pet-photo-dash" onChange={e => { if (e.target.files?.[0]) toast.info(`Foto "${e.target.files[0].name}" selecionada`); }} />
                <label htmlFor="pet-photo-dash" className="cursor-pointer flex flex-col items-center gap-2">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clique para adicionar foto</span>
                </label>
              </div>
            </div>
            <Button className="w-full" onClick={() => { toast.success("Pet cadastrado!"); setShowPet(false); }}>Cadastrar Pet</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Novo Atendimento Dialog */}
      <Dialog open={showAtendimento} onOpenChange={setShowAtendimento}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Novo Atendimento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pet</Label>
              <Select value={atendForm.petId} onValueChange={v => setAtendForm(f => ({ ...f, petId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o pet" /></SelectTrigger>
                <SelectContent>{allPets.map(p => <SelectItem key={p.id} value={p.id}>{p.nome} ({p.clienteNome})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Data</Label><Input type="date" value={atendForm.data} onChange={e => setAtendForm(f => ({ ...f, data: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Input value={atendForm.descricao} onChange={e => setAtendForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descreva o atendimento" /></div>
            <Button className="w-full" onClick={() => { toast.success("Atendimento registrado!"); setShowAtendimento(false); }}>Registrar Atendimento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
