export interface FamilyEvent {
  id?: string;
  treeId?: string;
  personId?: string;
  type: string;
  year: number;
  date?: string;
  dateNote?: string;
  description: string;
  location?: string;
}

export interface MediaItem {
  id?: string;
  treeId?: string;
  personId?: string;
  mediaType: string;
  fileUrl: string;
  description?: string;
}

export interface Person {
  id: string;
  treeId: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  deathYear?: number;
  gender: "male" | "female";
  generation: number;
  birthPlace?: string;
  deathPlace?: string;
  bio?: string;
  birthDate?: string;
  birthDateNote?: string;
  deathDate?: string;
  deathDateNote?: string;
  parentIds: string[];
  spouseIds: string[];
  exSpouseIds: string[];
  childIds: string[];
  events: FamilyEvent[];
  media: MediaItem[];
  photoUrl?: string;
}

export interface FamilyTree {
  id: string;
  name: string;
  description?: string;
}

export const getGenerationLabel = (gen: number): string => {
  const labels: Record<number, string> = {
    0: "Trisavós",
    1: "Bisavós",
    2: "Avós",
    3: "Pais",
    4: "Atual",
    5: "Nova Geração",
  };
  return labels[gen] || `Geração ${gen}`;
};

export const getAllGenerations = (people: Person[]): number[] =>
  [...new Set(people.map(p => p.generation))].sort((a, b) => a - b);
