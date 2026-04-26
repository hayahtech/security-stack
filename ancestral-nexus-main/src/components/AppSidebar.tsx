import React, { useState } from "react";
import { Person, getAllGenerations } from "@/types/database";
import { createPerson, deletePerson } from "@/services/familyService";
import { Users, Layers, TrendingUp, MapPin, Calendar, Plus, Pencil, Trash2, Sun, Moon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useTheme } from "@/hooks/useTheme";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface AppSidebarProps {
  activeSection: string | null;
  onSectionChange: (section: string) => void;
  people: Person[];
  treeId: string | null;
  onReload: () => void;
  onSelectPerson: (person: Person) => void;
  timeFilter: number;
  onTimeFilterChange: (value: number) => void;
}

export function AppSidebar({ activeSection, onSectionChange, people, treeId, onReload, onSelectPerson, timeFilter, onTimeFilterChange }: AppSidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", birthDate: "", deathDate: "",
    gender: "male" as "male" | "female", birthCity: "", birthState: "", birthCountry: "", bio: "",
  });

  const generations = getAllGenerations(people);
  const livingCount = people.filter(p => !p.deathYear).length;
  const locations = new Set(people.map(p => p.birthPlace).filter(Boolean));
  const totalEvents = people.reduce((sum, p) => sum + p.events.length, 0);

  const sections = [
    { id: "ancestors", icon: Users, label: "Ancestrais", value: people.length, color: "text-primary" },
    { id: "generations", icon: Layers, label: "Gerações", value: generations.length, color: "text-accent" },
    { id: "living", icon: TrendingUp, label: "Vivos", value: livingCount, color: "text-emerald" },
    { id: "locations", icon: MapPin, label: "Localizações", value: locations.size, color: "text-electric-blue" },
    { id: "events", icon: Calendar, label: "Eventos", value: totalEvents, color: "text-primary" },
  ];

  const openAdd = () => {
    setFormData({ firstName: "", lastName: "", birthDate: "", deathDate: "", gender: "male", birthCity: "", birthState: "", birthCountry: "", bio: "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({ title: "Erro", description: "Preencha nome e sobrenome.", variant: "destructive" });
      return;
    }
    if (!treeId) {
      toast({ title: "Erro", description: "Árvore não carregada. Recarregue a página.", variant: "destructive" });
      return;
    }
    const id = await createPerson(treeId, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      gender: formData.gender,
      birthDate: formData.birthDate || undefined,
      deathDate: formData.deathDate || undefined,
      birthPlace: [formData.birthCity, formData.birthState, formData.birthCountry].filter(Boolean).join(", ") || undefined,
      biography: formData.bio || undefined,
    });
    if (id) {
      toast({ title: "Sucesso", description: `${formData.firstName} ${formData.lastName} adicionado(a).` });
      setDialogOpen(false);
      onReload();
    } else {
      toast({ title: "Erro", description: "Falha ao salvar no banco.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!personToDelete) return;
    const success = await deletePerson(personToDelete.id);
    if (success) {
      toast({ title: "Excluído", description: `${personToDelete.firstName} ${personToDelete.lastName} removido(a).` });
      setDeleteConfirmOpen(false);
      setPersonToDelete(null);
      onReload();
    }
  };

  const confirmDelete = (person: Person) => {
    setPersonToDelete(person);
    setDeleteConfirmOpen(true);
  };

  const getFilteredPeople = () => {
    if (activeSection === "living") return people.filter(p => !p.deathYear);
    return people;
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-border">
        <SidebarContent className="bg-sidebar">
          {/* Theme toggle */}
          <div className="p-3 border-b border-sidebar-border">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="text-sm">{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
            </button>
          </div>

          {/* Time Slider */}
          <div className="p-3 border-b border-sidebar-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60 font-display">Linha do Tempo</span>
              <span className="font-display text-sm text-primary font-semibold">{timeFilter}</span>
            </div>
            <input
              type="range"
              min={1800}
              max={2026}
              value={timeFilter}
              onChange={(e) => onTimeFilterChange(Number(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((timeFilter - 1800) / (2026 - 1800)) * 100}%, hsl(var(--border)) ${((timeFilter - 1800) / (2026 - 1800)) * 100}%, hsl(var(--border)) 100%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="font-mono text-[10px] text-sidebar-foreground/40">1800</span>
              <span className="font-mono text-[10px] text-sidebar-foreground/40">2026</span>
            </div>
          </div>

          {/* Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs tracking-widest uppercase text-sidebar-foreground/60">
              Painel
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sections.map((section) => (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton
                      onClick={() => onSectionChange(section.id)}
                      isActive={activeSection === section.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <section.icon className={`w-4 h-4 ${section.color}`} />
                        <span>{section.label}</span>
                      </div>
                      <span className={`font-display text-sm font-semibold ${section.color}`}>{section.value}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Actions */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs tracking-widest uppercase text-sidebar-foreground/60">
              Ações
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={openAdd}>
                    <Plus className="w-4 h-4 text-emerald" />
                    <span>Adicionar Pessoa</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* People list */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs tracking-widest uppercase text-sidebar-foreground/60">
              Pessoas ({getFilteredPeople().length})
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="max-h-[400px] overflow-y-auto">
                {getFilteredPeople().map(person => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-sidebar-accent rounded-md group cursor-pointer transition-colors"
                    onClick={() => onSelectPerson(person)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${person.gender === "male" ? "bg-electric-blue" : "bg-destructive"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                          {person.firstName} {person.lastName}
                        </p>
                        <p className="text-[10px] text-sidebar-foreground/50 font-mono">
                          {person.birthYear}{person.deathYear ? ` — ${person.deathYear}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); confirmDelete(person); }} className="p-1 hover:bg-destructive/20 rounded" title="Excluir">
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Adicionar Pessoa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome *</Label>
                <Input value={formData.firstName} onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <Label>Sobrenome *</Label>
                <Input value={formData.lastName} onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data de Nascimento</Label>
                <Input type="date" value={formData.birthDate} onChange={e => setFormData(f => ({ ...f, birthDate: e.target.value }))} />
              </div>
              <div>
                <Label>Data de Falecimento</Label>
                <Input type="date" value={formData.deathDate} onChange={e => setFormData(f => ({ ...f, deathDate: e.target.value }))} placeholder="Vivo(a)" />
              </div>
            </div>
            <div>
              <Label>Gênero</Label>
              <Select value={formData.gender} onValueChange={v => setFormData(f => ({ ...f, gender: v as "male" | "female" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Cidade</Label>
                <Input value={formData.birthCity} onChange={e => setFormData(f => ({ ...f, birthCity: e.target.value }))} />
              </div>
              <div>
                <Label>Estado</Label>
                <Input value={formData.birthState} onChange={e => setFormData(f => ({ ...f, birthState: e.target.value }))} />
              </div>
              <div>
                <Label>País</Label>
                <Input value={formData.birthCountry} onChange={e => setFormData(f => ({ ...f, birthCountry: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Biografia</Label>
              <Input value={formData.bio} onChange={e => setFormData(f => ({ ...f, bio: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong>{personToDelete?.firstName} {personToDelete?.lastName}</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
