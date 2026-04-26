import React, { useState } from "react";
import { Person, FamilyEvent } from "@/types/database";
import { Save, X, Plus, Trash2, Image } from "lucide-react";

interface PersonEditFormProps {
  person: Person;
  onSave: (updated: Person) => void;
  onCancel: () => void;
}

const eventTypes = ["birth", "death", "marriage", "migration", "baptism", "military", "major"];
const eventTypeLabels: Record<string, string> = {
  birth: "Nascimento", death: "Falecimento", marriage: "Casamento",
  migration: "Migração", baptism: "Batismo", military: "Militar", major: "Importante",
};

const inputClass = "w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors";
const labelClass = "block text-xs font-display uppercase tracking-widest text-primary mb-1.5";
const selectClass = "w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors";

const PersonEditForm: React.FC<PersonEditFormProps> = ({ person, onSave, onCancel }) => {
  const [form, setForm] = useState<Person>({ ...person, events: person.events.map(e => ({ ...e })) });

  const update = <K extends keyof Person>(key: K, value: Person[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    onSave(form);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-gradient-neon">Editar Pessoa</h2>
          <button onClick={onCancel} className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Nome</label>
            <input className={inputClass} value={form.firstName} onChange={e => update("firstName", e.target.value)} placeholder="Nome" />
          </div>
          <div>
            <label className={labelClass}>Sobrenome</label>
            <input className={inputClass} value={form.lastName} onChange={e => update("lastName", e.target.value)} placeholder="Sobrenome" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Data de Nascimento</label>
            <input className={inputClass} type="date" value={form.birthDate || ""} onChange={e => {
              const val = e.target.value;
              update("birthDate", val);
              if (val) update("birthYear", new Date(val).getFullYear());
            }} />
          </div>
          <div>
            <label className={labelClass}>Data de Falecimento</label>
            <input className={inputClass} type="date" value={form.deathDate || ""} onChange={e => {
              const val = e.target.value;
              update("deathDate", val || undefined);
              update("deathYear", val ? new Date(val).getFullYear() : undefined);
            }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Nota de Nascimento</label>
            <input className={inputClass} value={form.birthDateNote || ""} onChange={e => update("birthDateNote", e.target.value)} placeholder="Ex: aprox. 1920" />
          </div>
          <div>
            <label className={labelClass}>Nota de Falecimento</label>
            <input className={inputClass} value={form.deathDateNote || ""} onChange={e => update("deathDateNote", e.target.value)} placeholder="Ex: aprox. 1985" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Gênero</label>
            <select className={selectClass} value={form.gender} onChange={e => update("gender", e.target.value as "male" | "female")}>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Local de Nascimento</label>
          <div className="grid grid-cols-3 gap-2">
            <input className={inputClass} value={(form.birthPlace ?? "").split(", ")[0] || ""} onChange={e => {
              const parts = (form.birthPlace ?? "").split(", ");
              parts[0] = e.target.value;
              update("birthPlace", parts.filter(Boolean).join(", "));
            }} placeholder="Cidade" />
            <input className={inputClass} value={(form.birthPlace ?? "").split(", ")[1] || ""} onChange={e => {
              const parts = (form.birthPlace ?? "").split(", ");
              while (parts.length < 2) parts.push("");
              parts[1] = e.target.value;
              update("birthPlace", parts.filter(Boolean).join(", "));
            }} placeholder="Estado" />
            <input className={inputClass} value={(form.birthPlace ?? "").split(", ")[2] || ""} onChange={e => {
              const parts = (form.birthPlace ?? "").split(", ");
              while (parts.length < 3) parts.push("");
              parts[2] = e.target.value;
              update("birthPlace", parts.filter(Boolean).join(", "));
            }} placeholder="País" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Local de Falecimento</label>
          <div className="grid grid-cols-3 gap-2">
            <input className={inputClass} value={(form.deathPlace ?? "").split(", ")[0] || ""} onChange={e => {
              const parts = (form.deathPlace ?? "").split(", ");
              parts[0] = e.target.value;
              update("deathPlace", parts.filter(Boolean).join(", "));
            }} placeholder="Cidade" />
            <input className={inputClass} value={(form.deathPlace ?? "").split(", ")[1] || ""} onChange={e => {
              const parts = (form.deathPlace ?? "").split(", ");
              while (parts.length < 2) parts.push("");
              parts[1] = e.target.value;
              update("deathPlace", parts.filter(Boolean).join(", "));
            }} placeholder="Estado" />
            <input className={inputClass} value={(form.deathPlace ?? "").split(", ")[2] || ""} onChange={e => {
              const parts = (form.deathPlace ?? "").split(", ");
              while (parts.length < 3) parts.push("");
              parts[2] = e.target.value;
              update("deathPlace", parts.filter(Boolean).join(", "));
            }} placeholder="País" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Foto de Perfil</label>
          <div className="flex gap-3 items-center">
            {form.photoUrl && (
              <img src={form.photoUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-border" />
            )}
            <div className="flex-1 space-y-2">
              <label className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs cursor-pointer transition-colors border border-dashed border-primary/30">
                <Image className="w-4 h-4" />
                <span>Escolher arquivo</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    alert("Arquivo muito grande. Máximo 2MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    update("photoUrl", reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }} />
              </label>
              <input className={inputClass} value={form.photoUrl?.startsWith("data:") ? "" : (form.photoUrl || "")} onChange={e => update("photoUrl", e.target.value || undefined)} placeholder="Ou cole uma URL..." />
            </div>
          </div>
          {form.photoUrl && (
            <button type="button" onClick={() => update("photoUrl", undefined)} className="mt-1 text-xs text-destructive hover:underline">
              Remover foto
            </button>
          )}
        </div>

        <div>
          <label className={labelClass}>Biografia</label>
          <textarea
            className={`${inputClass} min-h-[80px] resize-y`}
            value={form.bio ?? ""}
            onChange={e => update("bio", e.target.value)}
            placeholder="Breve biografia..."
            rows={3}
          />
        </div>
      </div>

      <div className="p-4 border-t border-border flex gap-2">
        <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-display text-sm uppercase tracking-wider hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-all">
          <Save className="w-4 h-4" /> Salvar
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-lg bg-muted text-muted-foreground font-display text-sm uppercase tracking-wider hover:bg-muted/80 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default PersonEditForm;
