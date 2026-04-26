import React, { useState, useRef, useEffect, useCallback } from "react";
import TreeNetwork, { TreeNetworkHandle } from "@/components/TreeNetwork";
import PersonProfile from "@/components/PersonProfile";
import GenerationFilter from "@/components/GenerationFilter";
import { Person, getAllGenerations } from "@/types/database";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { toast } from "@/hooks/use-toast";
import { Maximize } from "lucide-react";
import {
  getOrCreateTree,
  fetchFamilyData,
  createPerson,
  updatePerson,
  deletePerson as deletePersonDb,
} from "@/services/familyService";

const Index = () => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [timeFilter, setTimeFilter] = useState(2026);
  const [activeSection, setActiveSection] = useState<string | null>("ancestors");
  const [people, setPeople] = useState<Person[]>([]);
  const [treeId, setTreeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generationFilter, setGenerationFilter] = useState<number | null>(null);
  const treeRef = useRef<TreeNetworkHandle>(null);

  // Load data from Supabase
  const loadData = useCallback(async () => {
    const tree = await getOrCreateTree();
    if (!tree) {
      toast({ title: "Erro", description: "Não foi possível carregar a árvore.", variant: "destructive" });
      setLoading(false);
      return;
    }
    setTreeId(tree.id);
    const data = await fetchFamilyData(tree.id);
    setPeople(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Clear old localStorage data
    localStorage.removeItem("familyData");
    loadData();
  }, [loadData]);

  const handleSave = async (updated: Person) => {
    const success = await updatePerson(updated.id, {
      firstName: updated.firstName,
      lastName: updated.lastName,
      gender: updated.gender,
      birthDate: updated.birthDate,
      birthDateNote: updated.birthDateNote,
      deathDate: updated.deathDate,
      deathDateNote: updated.deathDateNote,
      birthPlace: updated.birthPlace,
      deathPlace: updated.deathPlace,
      biography: updated.bio,
    });
    if (success) {
      await loadData();
      toast({ title: "Salvo", description: `${updated.firstName} ${updated.lastName} atualizado(a) com sucesso.` });
    } else {
      toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
    }
  };

  const handleDelete = async (person: Person) => {
    const success = await deletePersonDb(person.id);
    if (success) {
      setSelectedPerson(null);
      await loadData();
      toast({ title: "Excluído", description: `${person.firstName} ${person.lastName} removido(a).` });
    }
  };

  return (
    <SidebarProvider>
      <div className="h-screen w-screen overflow-hidden flex w-full">
        <AppSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          people={people}
          treeId={treeId}
          onReload={loadData}
          onSelectPerson={setSelectedPerson}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
        />

        <div className="flex-1 relative bg-background">
          <div className="absolute inset-0 grid-bg opacity-50" />
          <div className="absolute inset-0 scanline opacity-20" />
          <div
            className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse, hsla(270 80% 60% / 0.06) 0%, transparent 70%)" }}
          />

          <div className="absolute top-0 left-0 right-0 z-20 flex items-center px-2 py-2 gap-2">
            <SidebarTrigger className="text-foreground flex-shrink-0" />
            <GenerationFilter
              value={generationFilter}
              onChange={setGenerationFilter}
              generations={getAllGenerations(people)}
            />
            <button
              onClick={() => treeRef.current?.resetView()}
              className="flex-shrink-0 p-2 rounded-lg border transition-all duration-200 backdrop-blur-sm"
              style={{
                backgroundColor: "hsla(80, 100%, 45%, 0.1)",
                borderColor: "hsla(80, 100%, 45%, 0.4)",
                color: "hsl(80, 100%, 45%)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "hsla(80, 100%, 45%, 0.2)";
                e.currentTarget.style.boxShadow = "0 0 12px hsla(80, 100%, 45%, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "hsla(80, 100%, 45%, 0.1)";
                e.currentTarget.style.boxShadow = "none";
              }}
              title="Centralizar e resetar zoom"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute inset-0 pt-12">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground font-display">Carregando...</p>
              </div>
            ) : people.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground font-display text-lg">Nenhuma pessoa cadastrada</p>
                  <p className="text-muted-foreground/60 text-sm">Use o menu lateral para adicionar familiares</p>
                </div>
              </div>
            ) : (
              <TreeNetwork
                ref={treeRef}
                onSelectPerson={setSelectedPerson}
                selectedPersonId={selectedPerson?.id}
                timeFilter={timeFilter}
                people={people}
                generationFilter={generationFilter}
              />
            )}
          </div>

          <PersonProfile
            person={selectedPerson}
            allPeople={people}
            onClose={() => setSelectedPerson(null)}
            onSave={handleSave}
            onDelete={handleDelete}
            treeId={treeId}
            onReload={loadData}
          />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
