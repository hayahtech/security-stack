import React, { useState } from "react";
import { Person } from "@/types/database";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, Heart, Users, BookOpen, Pencil, Trash2, Image, FileText, Plus, Link } from "lucide-react";
import PersonEditForm from "./PersonEditForm";
import { addMedia, deleteMedia, addRelationship, deleteRelationship } from "@/services/familyService";
import { toast } from "@/hooks/use-toast";

interface PersonProfileProps {
  person: Person | null;
  allPeople?: Person[];
  onClose: () => void;
  onSave?: (updated: Person) => void;
  onCopy?: (person: Person) => void;
  onDelete?: (person: Person) => void;
  treeId?: string | null;
  onReload?: () => void;
}

const eventTypeLabels: Record<string, string> = {
  birth: "Nascimento", death: "Falecimento", marriage: "Casamento",
  migration: "Migração", baptism: "Batismo", military: "Militar", major: "Importante",
};

const PersonProfile: React.FC<PersonProfileProps> = ({ person, allPeople = [], onClose, onCopy, onDelete, onSave, treeId, onReload }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"photo" | "document">("photo");
  const [mediaDesc, setMediaDesc] = useState("");
  const [showRelForm, setShowRelForm] = useState(false);
  const [relType, setRelType] = useState<"parent" | "spouse" | "child" | "ex_spouse">("parent");
  const [relPersonId, setRelPersonId] = useState("");

  if (!person) return null;

  const age = person.deathYear
    ? person.deathYear - person.birthYear
    : new Date().getFullYear() - person.birthYear;

  const eventIcons: Record<string, React.ReactNode> = {
    birth: <Calendar className="w-3 h-3" />,
    death: <X className="w-3 h-3" />,
    marriage: <Heart className="w-3 h-3" />,
    migration: <MapPin className="w-3 h-3" />,
    military: <Users className="w-3 h-3" />,
    baptism: <BookOpen className="w-3 h-3" />,
    major: <BookOpen className="w-3 h-3" />,
  };

  const handleSave = (updated: Person) => {
    onSave?.(updated);
    setIsEditing(false);
  };

  const handleAddMedia = async () => {
    if (!mediaUrl.trim() || !treeId) return;
    const success = await addMedia(treeId, person.id, {
      mediaType,
      fileUrl: mediaUrl.trim(),
      description: mediaDesc.trim() || undefined,
    });
    if (success) {
      toast({ title: "Mídia adicionada", description: `${mediaType === "photo" ? "Foto" : "Documento"} salvo(a).` });
      setMediaUrl("");
      setMediaDesc("");
      setShowMediaForm(false);
      onReload?.();
    } else {
      toast({ title: "Erro", description: "Falha ao salvar mídia.", variant: "destructive" });
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    const success = await deleteMedia(mediaId);
    if (success) {
      toast({ title: "Removido", description: "Mídia removida." });
      onReload?.();
    }
  };

  const inputClass = "w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors";
  const selectClass = "w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 bottom-0 w-[380px] glass-panel-neon z-30 flex flex-col"
      >
        {isEditing ? (
          <PersonEditForm person={person} onSave={handleSave} onCancel={() => setIsEditing(false)} />
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center glow-neon overflow-hidden">
                  {person.photoUrl ? (
                    <img src={person.photoUrl} alt={person.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-lg text-primary">
                      {person.firstName[0]}{person.lastName[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-xl text-gradient-neon">
                    {person.firstName} {person.lastName}
                  </h2>
                  <p className="text-sm text-muted-foreground font-mono">
                    {person.birthYear} — {person.deathYear || "Presente"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {person.deathYear ? `Viveu ${age} anos` : `${age} anos`}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs transition-colors">
                  <Pencil className="w-3 h-3" /> Editar
                </button>
                {onDelete && (
                  <button onClick={() => onDelete(person)} className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs transition-colors">
                    <Trash2 className="w-3 h-3" /> Excluir
                  </button>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-px bg-border mx-6 my-4 rounded-lg overflow-hidden">
              {[
                { label: "Geração", value: person.generation },
                { label: "Filhos", value: person.childIds.length },
                { label: "Eventos", value: person.events.length },
              ].map((stat) => (
                <div key={stat.label} className="bg-secondary p-3 text-center">
                  <div className="text-lg font-display text-primary">{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Biography */}
            {person.bio && (
              <div className="px-6 py-3">
                <h3 className="font-display text-xs uppercase tracking-widest text-primary mb-2">Biografia</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{person.bio}</p>
              </div>
            )}

            {/* Birth place */}
            {person.birthPlace && (
              <div className="px-6 py-3">
                <h3 className="font-display text-xs uppercase tracking-widest text-primary mb-2">Origem</h3>
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <MapPin className="w-4 h-4 text-accent" />
                  {person.birthPlace}
                </div>
              </div>
            )}

            {/* Media (Photos & Documents) */}
            <div className="px-6 py-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-xs uppercase tracking-widest text-primary">Fotos & Documentos</h3>
                <button onClick={() => setShowMediaForm(!showMediaForm)} className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs transition-colors">
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>

              {showMediaForm && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2 mb-3">
                  <select className={selectClass} value={mediaType} onChange={e => setMediaType(e.target.value as "photo" | "document")}>
                    <option value="photo">Foto</option>
                    <option value="document">Documento</option>
                  </select>
                  <input className={inputClass} value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="URL da imagem ou documento" />
                  <input className={inputClass} value={mediaDesc} onChange={e => setMediaDesc(e.target.value)} placeholder="Descrição (opcional)" />
                  <div className="flex gap-2">
                    <button onClick={handleAddMedia} className="flex-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-display">Salvar</button>
                    <button onClick={() => setShowMediaForm(false)} className="px-3 py-1.5 rounded-md bg-muted text-muted-foreground text-xs">Cancelar</button>
                  </div>
                </div>
              )}

              {person.media && person.media.length > 0 ? (
                <div className="space-y-2">
                  {person.media.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 border border-border group">
                      {m.mediaType === "photo" ? (
                        <img src={m.fileUrl} alt={m.description || ""} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{m.description || (m.mediaType === "photo" ? "Foto" : "Documento")}</p>
                        <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">Abrir</a>
                      </div>
                      <button onClick={() => m.id && handleDeleteMedia(m.id)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded transition-all">
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhuma mídia adicionada</p>
              )}
            </div>

            {/* Life Timeline */}
            {person.events.length > 0 && (
              <div className="px-6 py-3">
                <h3 className="font-display text-xs uppercase tracking-widest text-primary mb-3">Linha do Tempo</h3>
                <div className="space-y-3">
                  {person.events
                    .sort((a, b) => a.year - b.year)
                    .map((event, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-primary">
                            {eventIcons[event.type] || <Calendar className="w-3 h-3" />}
                          </div>
                          {i < person.events.length - 1 && <div className="w-px h-6 bg-border mt-1" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-primary font-semibold">{event.year}</span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                              {eventTypeLabels[event.type] || event.type}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 mt-0.5">{event.description}</p>
                          {event.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" /> {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Relationships Management */}
            <div className="px-6 py-3 pb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-xs uppercase tracking-widest text-primary">Conexões</h3>
                <button onClick={() => setShowRelForm(!showRelForm)} className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs transition-colors">
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>

              {showRelForm && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2 mb-3">
                  <select className={selectClass} value={relType} onChange={e => setRelType(e.target.value as "parent" | "spouse" | "child" | "ex_spouse")}>
                    <option value="parent">Pai/Mãe desta pessoa</option>
                    <option value="child">Filho(a) desta pessoa</option>
                    <option value="spouse">Cônjuge</option>
                    <option value="ex_spouse">Ex-cônjuge</option>
                  </select>
                  <select className={selectClass} value={relPersonId} onChange={e => setRelPersonId(e.target.value)}>
                    <option value="">Selecione uma pessoa...</option>
                    {allPeople
                      .filter(p => p.id !== person.id)
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                      ))}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      if (!relPersonId || !treeId) return;
                      let success: boolean;
                      if (relType === "parent") {
                        // relPersonId is parent OF current person
                        success = await addRelationship(treeId, relPersonId, person.id, "parent");
                      } else if (relType === "child") {
                        // current person is parent OF relPersonId
                        success = await addRelationship(treeId, person.id, relPersonId, "parent");
                      } else if (relType === "ex_spouse") {
                        success = await addRelationship(treeId, person.id, relPersonId, "ex_spouse");
                      } else {
                        success = await addRelationship(treeId, person.id, relPersonId, "spouse");
                      }
                      if (success) {
                        toast({ title: "Relacionamento adicionado" });
                        setRelPersonId("");
                        setShowRelForm(false);
                        onReload?.();
                      } else {
                        toast({ title: "Erro", description: "Falha ao salvar relacionamento.", variant: "destructive" });
                      }
                    }} className="flex-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-display">Salvar</button>
                    <button onClick={() => setShowRelForm(false)} className="px-3 py-1.5 rounded-md bg-muted text-muted-foreground text-xs">Cancelar</button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                {person.parentIds.length > 0 && (
                  <div>
                    <span className="text-accent font-medium text-xs">Pais:</span>
                    {person.parentIds.map(pid => {
                      const parent = allPeople.find(p => p.id === pid);
                      return (
                        <div key={pid} className="flex items-center justify-between ml-2 py-1 group">
                          <span className="text-xs text-foreground/70">{parent ? `${parent.firstName} ${parent.lastName}` : pid}</span>
                          <button onClick={async () => {
                            await deleteRelationship(pid, person.id, "parent");
                            onReload?.();
                          }} className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded transition-all">
                            <X className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {person.spouseIds.length > 0 && (
                  <div>
                    <span className="text-accent font-medium text-xs">Cônjuge:</span>
                    {person.spouseIds.map(sid => {
                      const spouse = allPeople.find(p => p.id === sid);
                      return (
                        <div key={sid} className="flex items-center justify-between ml-2 py-1 group">
                          <span className="text-xs text-foreground/70">{spouse ? `${spouse.firstName} ${spouse.lastName}` : sid}</span>
                          <button onClick={async () => {
                            await deleteRelationship(person.id, sid, "spouse");
                            onReload?.();
                          }} className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded transition-all">
                            <X className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {person.exSpouseIds && person.exSpouseIds.length > 0 && (
                  <div>
                    <span className="text-accent font-medium text-xs">Ex-cônjuge:</span>
                    {person.exSpouseIds.map(eid => {
                      const ex = allPeople.find(p => p.id === eid);
                      return (
                        <div key={eid} className="flex items-center justify-between ml-2 py-1 group">
                          <span className="text-xs text-foreground/70">{ex ? `${ex.firstName} ${ex.lastName}` : eid}</span>
                          <button onClick={async () => {
                            await deleteRelationship(person.id, eid, "ex_spouse");
                            onReload?.();
                          }} className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded transition-all">
                            <X className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {person.childIds.length > 0 && (
                  <div>
                    <span className="text-accent font-medium text-xs">Filhos:</span>
                    {person.childIds.map(cid => {
                      const child = allPeople.find(p => p.id === cid);
                      return (
                        <div key={cid} className="flex items-center justify-between ml-2 py-1 group">
                          <span className="text-xs text-foreground/70">{child ? `${child.firstName} ${child.lastName}` : cid}</span>
                          <button onClick={async () => {
                            await deleteRelationship(person.id, cid, "parent");
                            onReload?.();
                          }} className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded transition-all">
                            <X className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {person.parentIds.length === 0 && person.spouseIds.length === 0 && person.childIds.length === 0 && (!person.exSpouseIds || person.exSpouseIds.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-2">Nenhuma conexão registrada</p>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default PersonProfile;
