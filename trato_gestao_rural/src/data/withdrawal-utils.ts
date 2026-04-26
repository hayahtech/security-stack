import { mockTreatments } from "@/data/animal-detail-mock";
import { mockAnimals } from "@/data/rebanho-mock";

export interface WithdrawalStatus {
  animalId: string;
  treatmentId: string;
  medication: string;
  applicationDate: string;
  withdrawalDays: number;
  releaseDate: string;
  remainingDays: number;
  inWithdrawal: boolean;
}

/** Calculate the withdrawal status for a single treatment */
function calcWithdrawal(treatmentDate: string, withdrawalDays: number): { releaseDate: string; remainingDays: number; inWithdrawal: boolean } {
  const appDate = new Date(treatmentDate);
  const release = new Date(appDate);
  release.setDate(release.getDate() + withdrawalDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  release.setHours(0, 0, 0, 0);
  const diffMs = release.getTime() - today.getTime();
  const remaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    releaseDate: release.toISOString().slice(0, 10),
    remainingDays: Math.max(0, remaining),
    inWithdrawal: remaining > 0,
  };
}

/** Get all active withdrawal statuses for an animal */
export function getAnimalWithdrawals(animalId: string): WithdrawalStatus[] {
  return mockTreatments
    .filter((t) => t.animal_id === animalId && t.withdrawal_days > 0)
    .map((t) => {
      const { releaseDate, remainingDays, inWithdrawal } = calcWithdrawal(t.date, t.withdrawal_days);
      return {
        animalId: t.animal_id,
        treatmentId: t.id,
        medication: t.medication,
        applicationDate: t.date,
        withdrawalDays: t.withdrawal_days,
        releaseDate,
        remainingDays,
        inWithdrawal,
      };
    })
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
}

/** Check if animal is currently in ANY withdrawal period */
export function isAnimalInWithdrawal(animalId: string): WithdrawalStatus | null {
  const statuses = getAnimalWithdrawals(animalId);
  const active = statuses.find((s) => s.inWithdrawal);
  return active || null;
}

/** Get all animals with their withdrawal status for reporting */
export function getAllWithdrawalReport(): (WithdrawalStatus & { earTag: string; animalName: string })[] {
  const results: (WithdrawalStatus & { earTag: string; animalName: string })[] = [];
  mockAnimals
    .filter((a) => a.current_status === "ativo")
    .forEach((a) => {
      const statuses = getAnimalWithdrawals(a.id);
      statuses.forEach((s) => {
        results.push({ ...s, earTag: a.ear_tag, animalName: a.name });
      });
    });
  return results.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
}
