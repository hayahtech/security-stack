import { supabase } from "@/lib/supabaseClient";
import { Person, FamilyEvent, FamilyTree, MediaItem } from "@/types/database";

// ---- Tree ----

export async function getOrCreateTree(): Promise<FamilyTree | null> {
  try {
    const { data, error } = await supabase.from("trees").select("*").limit(1);
    console.log("Trees fetch result:", { data, error });
    if (error) {
      console.error("Erro ao buscar árvores:", error);
      return null;
    }
    if (data && data.length > 0) {
      return { id: data[0].id, name: data[0].name, description: data[0].description };
    }
    // Create default tree
    const { data: newTree, error: createError } = await supabase
      .from("trees")
      .insert({ name: "Minha Família", description: "Árvore genealógica" })
      .select()
      .single();
    console.log("Tree create result:", { newTree, createError });
    if (createError) {
      console.error("Erro ao criar árvore:", createError);
      return null;
    }
    return { id: newTree.id, name: newTree.name, description: newTree.description };
  } catch (e) {
    console.error("Exceção ao buscar/criar árvore:", e);
    return null;
  }
}

// ---- People ----

export async function fetchFamilyData(treeId: string): Promise<Person[]> {
  const [peopleRes, relRes, eventsRes, mediaRes] = await Promise.all([
    supabase.from("people").select("*").eq("tree_id", treeId),
    supabase.from("relationships").select("*").eq("tree_id", treeId),
    supabase.from("events").select("*").eq("tree_id", treeId),
    supabase.from("media").select("*").eq("tree_id", treeId),
  ]);

  if (peopleRes.error) { console.error("Erro people:", peopleRes.error); return []; }

  const relationships = relRes.data || [];
  const events = eventsRes.data || [];
  const media = mediaRes.data || [];

  // Build relationship maps
  const parentMap = new Map<string, string[]>(); // childId -> parentIds
  const childMap = new Map<string, string[]>();  // parentId -> childIds
  const spouseMap = new Map<string, string[]>();
  const exSpouseMap = new Map<string, string[]>();

  relationships.forEach((r: any) => {
    if (r.relationship_type === "parent") {
      const childParents = parentMap.get(r.related_person_id) || [];
      childParents.push(r.person_id);
      parentMap.set(r.related_person_id, childParents);

      const parentChildren = childMap.get(r.person_id) || [];
      parentChildren.push(r.related_person_id);
      childMap.set(r.person_id, parentChildren);
    } else if (r.relationship_type === "spouse") {
      const s1 = spouseMap.get(r.person_id) || [];
      s1.push(r.related_person_id);
      spouseMap.set(r.person_id, s1);

      const s2 = spouseMap.get(r.related_person_id) || [];
      s2.push(r.person_id);
      spouseMap.set(r.related_person_id, s2);
    } else if (r.relationship_type === "ex_spouse") {
      const e1 = exSpouseMap.get(r.person_id) || [];
      e1.push(r.related_person_id);
      exSpouseMap.set(r.person_id, e1);

      const e2 = exSpouseMap.get(r.related_person_id) || [];
      e2.push(r.person_id);
      exSpouseMap.set(r.related_person_id, e2);
    }
  });

  // Compute generations: each person's gen = max depth from any root ancestor
  const generationMap = new Map<string, number>();
  const allIds = new Set(peopleRes.data.map((p: any) => p.id));

  // Recursive function to compute max depth for a person
  const computeGen = (id: string, visited: Set<string>): number => {
    if (generationMap.has(id)) return generationMap.get(id)!;
    if (visited.has(id)) return 0; // cycle protection
    visited.add(id);

    const parents = parentMap.get(id) || [];
    if (parents.length === 0) {
      generationMap.set(id, 0);
      return 0;
    }

    const maxParentGen = Math.max(...parents.map(pid => computeGen(pid, visited)));
    const gen = maxParentGen + 1;
    generationMap.set(id, gen);
    return gen;
  };

  // Compute generation for all people based on parent-child hierarchy
  allIds.forEach(id => {
    if (!generationMap.has(id)) computeGen(id, new Set());
  });

  // Align spouses/ex-spouses to the maximum generation of the pair
  let changed = true;
  while (changed) {
    changed = false;
    allIds.forEach(id => {
      const myGen = generationMap.get(id) || 0;
      const spouses = spouseMap.get(id) || [];
      const exSpouses = exSpouseMap.get(id) || [];
      [...spouses, ...exSpouses].forEach(sid => {
        const theirGen = generationMap.get(sid) || 0;
        if (theirGen < myGen) {
          generationMap.set(sid, myGen);
          changed = true;
        }
      });
    });
  }

  // Build events map
  const eventsMap = new Map<string, FamilyEvent[]>();
  events.forEach((e: any) => {
    const personEvents = eventsMap.get(e.person_id) || [];
    personEvents.push({
      id: e.id,
      treeId: e.tree_id,
      personId: e.person_id,
      type: e.event_type || "major",
      year: e.event_date ? new Date(e.event_date).getFullYear() : 0,
      date: e.event_date,
      dateNote: e.event_date_note,
      description: e.description || "",
      location: e.location,
    });
    eventsMap.set(e.person_id, personEvents);
  });

  // Build media map
  const mediaMap = new Map<string, MediaItem[]>();
  media.forEach((m: any) => {
    const personMedia = mediaMap.get(m.person_id) || [];
    personMedia.push({
      id: m.id,
      treeId: m.tree_id,
      personId: m.person_id,
      mediaType: m.media_type || "photo",
      fileUrl: m.file_url,
      description: m.description,
    });
    mediaMap.set(m.person_id, personMedia);
  });

  return peopleRes.data.map((p: any) => {
    const personMedia = mediaMap.get(p.id) || [];
    const photo = personMedia.find(m => m.mediaType === "photo");
    return {
      id: p.id,
      treeId: p.tree_id,
      firstName: p.first_name,
      lastName: p.last_name,
      gender: (p.gender === "female" ? "female" : "male") as "male" | "female",
      birthYear: p.birth_date ? new Date(p.birth_date).getFullYear() : new Date().getFullYear(),
      deathYear: p.death_date ? new Date(p.death_date).getFullYear() : undefined,
      birthDate: p.birth_date,
      birthDateNote: p.birth_date_note,
      deathDate: p.death_date,
      deathDateNote: p.death_date_note,
      birthPlace: p.birth_place,
      deathPlace: p.death_place,
      bio: p.biography,
      generation: generationMap.get(p.id) || 0,
      parentIds: parentMap.get(p.id) || [],
      spouseIds: spouseMap.get(p.id) || [],
      exSpouseIds: exSpouseMap.get(p.id) || [],
      childIds: childMap.get(p.id) || [],
      events: eventsMap.get(p.id) || [],
      media: personMedia,
      photoUrl: photo?.fileUrl,
    };
  });
}

// ---- CRUD Person ----

export async function createPerson(treeId: string, data: {
  firstName: string; lastName: string; gender: string;
  birthDate?: string; birthDateNote?: string;
  deathDate?: string; deathDateNote?: string;
  birthPlace?: string; deathPlace?: string; biography?: string;
}): Promise<string | null> {
  const { data: result, error } = await supabase
    .from("people")
    .insert({
      tree_id: treeId,
      first_name: data.firstName,
      last_name: data.lastName,
      gender: data.gender,
      birth_date: data.birthDate || null,
      birth_date_note: data.birthDateNote || null,
      death_date: data.deathDate || null,
      death_date_note: data.deathDateNote || null,
      birth_place: data.birthPlace || null,
      death_place: data.deathPlace || null,
      biography: data.biography || null,
    })
    .select("id")
    .single();
  if (error) { console.error("Erro ao criar pessoa:", error); return null; }
  return result.id;
}

export async function updatePerson(personId: string, data: {
  firstName?: string; lastName?: string; gender?: string;
  birthDate?: string; birthDateNote?: string;
  deathDate?: string; deathDateNote?: string;
  birthPlace?: string; deathPlace?: string; biography?: string;
}): Promise<boolean> {
  const updates: any = {};
  if (data.firstName !== undefined) updates.first_name = data.firstName;
  if (data.lastName !== undefined) updates.last_name = data.lastName;
  if (data.gender !== undefined) updates.gender = data.gender;
  if (data.birthDate !== undefined) updates.birth_date = data.birthDate || null;
  if (data.birthDateNote !== undefined) updates.birth_date_note = data.birthDateNote || null;
  if (data.deathDate !== undefined) updates.death_date = data.deathDate || null;
  if (data.deathDateNote !== undefined) updates.death_date_note = data.deathDateNote || null;
  if (data.birthPlace !== undefined) updates.birth_place = data.birthPlace || null;
  if (data.deathPlace !== undefined) updates.death_place = data.deathPlace || null;
  if (data.biography !== undefined) updates.biography = data.biography || null;

  const { error } = await supabase.from("people").update(updates).eq("id", personId);
  if (error) { console.error("Erro ao atualizar pessoa:", error); return false; }
  return true;
}

export async function deletePerson(personId: string): Promise<boolean> {
  // Delete related data first
  await Promise.all([
    supabase.from("relationships").delete().or(`person_id.eq.${personId},related_person_id.eq.${personId}`),
    supabase.from("events").delete().eq("person_id", personId),
    supabase.from("media").delete().eq("person_id", personId),
  ]);
  const { error } = await supabase.from("people").delete().eq("id", personId);
  if (error) { console.error("Erro ao excluir pessoa:", error); return false; }
  return true;
}

// ---- Relationships ----

export async function addRelationship(treeId: string, personId: string, relatedPersonId: string, type: string): Promise<boolean> {
  const { error } = await supabase.from("relationships").insert({
    tree_id: treeId,
    person_id: personId,
    related_person_id: relatedPersonId,
    relationship_type: type,
  });
  if (error) { console.error("Erro ao criar relacionamento:", error); return false; }
  return true;
}

export async function deleteRelationship(personId: string, relatedPersonId: string, type: string): Promise<boolean> {
  const { error } = await supabase.from("relationships").delete()
    .eq("person_id", personId)
    .eq("related_person_id", relatedPersonId)
    .eq("relationship_type", type);
  if (error) { console.error("Erro ao excluir relacionamento:", error); return false; }
  return true;
}

// ---- Events ----

export async function addEvent(treeId: string, personId: string, event: {
  type: string; date?: string; dateNote?: string; description: string; location?: string;
}): Promise<boolean> {
  const { error } = await supabase.from("events").insert({
    tree_id: treeId,
    person_id: personId,
    event_type: event.type,
    event_date: event.date || null,
    event_date_note: event.dateNote || null,
    description: event.description,
    location: event.location || null,
  });
  if (error) { console.error("Erro ao criar evento:", error); return false; }
  return true;
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) { console.error("Erro ao excluir evento:", error); return false; }
  return true;
}

// ---- Media ----

export async function addMedia(treeId: string, personId: string, media: {
  mediaType: string; fileUrl: string; description?: string;
}): Promise<boolean> {
  const { error } = await supabase.from("media").insert({
    tree_id: treeId,
    person_id: personId,
    media_type: media.mediaType,
    file_url: media.fileUrl,
    description: media.description || null,
  });
  if (error) { console.error("Erro ao criar mídia:", error); return false; }
  return true;
}

export async function deleteMedia(mediaId: string): Promise<boolean> {
  const { error } = await supabase.from("media").delete().eq("id", mediaId);
  if (error) { console.error("Erro ao excluir mídia:", error); return false; }
  return true;
}
