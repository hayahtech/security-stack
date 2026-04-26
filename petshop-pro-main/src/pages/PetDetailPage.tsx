import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { pets as allPets } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft, Stethoscope, Weight, Bug, FileText, FlaskConical,
  Camera, Syringe, ClipboardList, MessageSquare, Video, Plus, Clock
} from "lucide-react";

interface TimelineEvent {
  id: string;
  tipo: string;
  descricao: string;
  data: string;
  icon: React.ElementType;
  color: string;
}

const actionButtons = [
  { label: "Atendimento", icon: Stethoscope, color: "from-blue-500 to-blue-600" },
  { label: "Peso", icon: Weight, color: "from-green-500 to-green-600" },
  { label: "Patologia", icon: Bug, color: "from-red-500 to-red-600" },
  { label: "Documento", icon: FileText, color: "from-amber-500 to-amber-600" },
  { label: "Exame", icon: FlaskConical, color: "from-purple-500 to-purple-600" },
  { label: "Fotos", icon: Camera, color: "from-pink-500 to-pink-600" },
  { label: "Vacina", icon: Syringe, color: "from-teal-500 to-teal-600" },
  { label: "Receita", icon: ClipboardList, color: "from-indigo-500 to-indigo-600" },
  { label: "Observações", icon: MessageSquare, color: "from-orange-500 to-orange-600" },
  { label: "Vídeo", icon: Video, color: "from-cyan-500 to-cyan-600" },
];

const iconMap: Record<string, React.ElementType> = {
  Atendimento: Stethoscope, Peso: Weight, Patologia: Bug, Documento: FileText,
  Exame: FlaskConical, Fotos: Camera, Vacina: Syringe, Receita: ClipboardList,
  Observações: MessageSquare, Vídeo: Video,
};

const colorMap: Record<string, string> = {
  Atendimento: "bg-blue-500", Peso: "bg-green-500", Patologia: "bg-red-500",
  Documento: "bg-amber-500", Exame: "bg-purple-500", Fotos: "bg-pink-500",
  Vacina: "bg-teal-500", Receita: "bg-indigo-500", Observações: "bg-orange-500",
  Vídeo: "bg-cyan-500",
};

export default function PetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pet = allPets.find(p => p.id === id);

  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    { id: "1", tipo: "Vacina", descricao: "V10 aplicada", data: "2025-03-15", icon: Syringe, color: "bg-teal-500" },
    { id: "2", tipo: "Peso", descricao: "12.5 kg", data: "2025-03-10", icon: Weight, color: "bg-green-500" },
    { id: "3", tipo: "Atendimento", descricao: "Consulta de rotina", data: "2025-02-20", icon: Stethoscope, color: "bg-blue-500" },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formData, setFormData] = useState(new Date().toISOString().split("T")[0]);

  if (!pet) return <div className="p-8 text-center text-muted-foreground">Pet não encontrado</div>;

  const openModal = (tipo: string) => {
    setModalType(tipo);
    setFormDesc("");
    setFormData(new Date().toISOString().split("T")[0]);
    setShowModal(true);
  };

  const handleAdd = () => {
    if (!formDesc.trim()) { toast.error("Preencha a descrição"); return; }
    const newEvent: TimelineEvent = {
      id: `ev-${Date.now()}`,
      tipo: modalType,
      descricao: formDesc,
      data: formData,
      icon: iconMap[modalType] || Stethoscope,
      color: colorMap[modalType] || "bg-primary",
    };
    setTimeline(prev => [newEvent, ...prev]);
    setShowModal(false);
    toast.success(`${modalType} adicionado!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/pets")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-heading text-xl font-bold text-foreground">Perfil de {pet.nome}</h1>
      </div>

      {/* Pet info card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5 flex flex-col sm:flex-row gap-5">
        <div className="w-32 h-32 rounded-xl bg-muted overflow-hidden shrink-0">
          <img src={pet.foto} alt={pet.nome} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm flex-1">
          <div><p className="text-muted-foreground text-xs">Nome</p><p className="font-semibold text-foreground">{pet.nome}</p></div>
          <div><p className="text-muted-foreground text-xs">Raça</p><p className="font-semibold text-foreground">{pet.raca}</p></div>
          <div><p className="text-muted-foreground text-xs">Idade</p><p className="font-semibold text-foreground">{pet.idade} {pet.idade === 1 ? "ano" : "anos"}</p></div>
          <div><p className="text-muted-foreground text-xs">Porte</p><p className="font-semibold text-foreground">{pet.porte}</p></div>
          <div><p className="text-muted-foreground text-xs">Dono</p><p className="font-semibold text-foreground">{pet.clienteNome}</p></div>
        </div>
      </div>

      {/* Action buttons */}
      <div>
        <h2 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Adicionar Registro
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {actionButtons.map(btn => (
            <button
              key={btn.label}
              onClick={() => openModal(btn.label)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${btn.color} text-white shadow-sm hover:shadow-md hover:scale-[1.03] transition-all duration-200`}
            >
              <btn.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h2 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Linha do Tempo
        </h2>
        <div className="relative border-l-2 border-border ml-4 space-y-0">
          {timeline.length === 0 && (
            <p className="pl-8 py-4 text-sm text-muted-foreground">Nenhum registro ainda</p>
          )}
          {timeline.map(ev => {
            const Icon = ev.icon;
            return (
              <div key={ev.id} className="relative pl-8 pb-6">
                <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full ${ev.color} flex items-center justify-center`}>
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <div className="bg-card rounded-lg border border-border p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-primary">{ev.tipo}</span>
                    <span className="text-xs text-muted-foreground">{ev.data}</span>
                  </div>
                  <p className="text-sm text-foreground">{ev.descricao}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Adicionar {modalType}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={formData} onChange={e => setFormData(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder={`Descreva o ${modalType.toLowerCase()}...`} rows={3} />
            </div>
            <Button className="w-full" onClick={handleAdd}>Salvar {modalType}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
