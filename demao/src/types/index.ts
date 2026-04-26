export type UserRole = 'admin' | 'painter';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  currentWorkId?: string; // ID of the work currently checked in
}

export type PropertyType = 'Apartamento' | 'Casa' | 'Sobrado' | 'Predio' | 'Estacionamento' | 'Galpao';

export type RoomType =
  | 'Sala'
  | 'Quarto'
  | 'Banheiro'
  | 'Cozinha'
  | 'Sacada'
  | 'Hall'
  | 'Corredor'
  | 'Teto'
  | 'Fachada'
  | 'Garagem'
  | 'Piscina'
  | 'Outros';

export interface Photo {
  id: string;
  url: string; // Remote download URL or Local URI
  thumbnailUrl?: string;
  type: 'BEFORE' | 'AFTER';
  createdAt: string; // ISO string
  workId: string;
  roomId: string;
  userId: string;
  uploaded: boolean;
}

export interface Room {
  id: string;
  name: string; // e.g., "Quarto 1", "Sala de Estar"
  type: RoomType;
  areaSqm: number;
  progress: number; // 0 to 100 percentage
  completed: boolean; // Helper based on progress === 100
  notes?: string;
  photosBefore: Photo[];
  photosAfter: Photo[];
}


export type WorkStatus = 'Em andamento' | 'Concluida' | 'Pausada';

export interface Work {
  id: string;
  numberId: string; // "#564"
  title: string; // Description like "Obra #564 - Apartamento..."
  propertyType: PropertyType;
  address?: string;
  clientName?: string;
  status: WorkStatus;
  createdAt: string;
  rooms: Room[]; // Array of rooms embedded for easier offline access or sub-collection
  painters: string[]; // Array of User UIDs
  totalAreaSqm: number; // Calculated sum of room areas
  progressPercentageByRoom: number; // Calculated: (completed rooms / total rooms) * 100
  progressPercentageByArea: number; // Calculated: (sum of (room.progress * room.area) / totalArea)
  startDate?: string; // ISO Date YYYY-MM-DD
  estimatedCompletionDate?: string; // ISO Date YYYY-MM-DD
}

export interface DailyLog {
  id: string;
  workId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string;
  checkOutTime?: string;
  roomsWorkedIds: string[]; // IDs of rooms worked on this day
  notes: string;
  tasks?: string[]; // Array of selected predefined tasks
}

// --- BUDGET MODULE TYPES ---

export interface RegionalProfile {
  id: string;
  name: string;
  multiplier: number;
}

export interface RoomPackage {
  id: string;
  name: string;
  defaultAreaSqm: number;
  icon?: string; // Icon name for UI
}

export interface ComplexityAddon {
  id: string;
  name: string;
  type: 'FIXED' | 'PER_SQM' | 'PERCENTAGE';
  value: number;
  description?: string;
}

export interface ServiceBasePrice {
  id: string;
  name: string;
  pricePerSqm: number;
}

export interface BudgetItem {
  id: string;
  name: string; // e.g., "Quarto 1"
  roomPackageId?: string; // If created from a package
  areaSqm: number;
  serviceId: string; // Selected service (Paint, Texture, etc.)
  selectedAddons: string[]; // IDs of ComplexityAddon
  calculatedPrice: number;
}

export interface Budget {
  id: string;
  regionId: string;
  items: BudgetItem[];
  totalPrice: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  workId: string;
  userId: string;
  date: string;
  item: string; // Product name
  amount: number; // Cost
  photoUrl?: string; // Invoice image
  createdAt: string;
}
