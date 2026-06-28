import type { ActiveProcedureType } from "./types";
import { getTemplate } from "./procedure-templates";

export interface SupplyItem {
  id: string;
  label: string;
  checked: boolean;
  custom: boolean;
}

function getDefaultItems(procedureType: ActiveProcedureType): Omit<SupplyItem, "checked">[] {
  return getTemplate(procedureType).suppliesChecklist.map((item) => ({
    ...item,
    custom: false,
  }));
}

const STORAGE_KEY = "preppal-supplies";

export function loadChecklist(procedureType: ActiveProcedureType = "colonoscopy"): SupplyItem[] {
  const defaults = getDefaultItems(procedureType);
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaults.map((item) => ({ ...item, checked: false }));
  try {
    const saved = JSON.parse(raw) as SupplyItem[];
    const savedIds = new Set(saved.map((s) => s.id));
    const merged: SupplyItem[] = [];
    for (const def of defaults) {
      const match = saved.find((s) => s.id === def.id);
      merged.push(match ? { ...def, checked: match.checked } : { ...def, checked: false });
    }
    for (const s of saved) {
      if (s.custom && !savedIds.has(s.id)) continue;
      if (s.custom) merged.push(s);
    }
    return merged;
  } catch {
    return defaults.map((item) => ({ ...item, checked: false }));
  }
}

export function saveChecklist(items: SupplyItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function toggleItem(items: SupplyItem[], itemId: string): SupplyItem[] {
  const updated = items.map((item) =>
    item.id === itemId ? { ...item, checked: !item.checked } : item,
  );
  saveChecklist(updated);
  return updated;
}

export function addCustomItem(items: SupplyItem[], label: string): SupplyItem[] {
  const id = `custom-${Date.now()}`;
  const updated = [...items, { id, label: label.trim(), checked: false, custom: true }];
  saveChecklist(updated);
  return updated;
}

export function removeItem(items: SupplyItem[], itemId: string): SupplyItem[] {
  const updated = items.filter((item) => item.id !== itemId);
  saveChecklist(updated);
  return updated;
}

export function resetChecklist(procedureType: ActiveProcedureType = "colonoscopy"): SupplyItem[] {
  const fresh = getDefaultItems(procedureType).map((item) => ({ ...item, checked: false }));
  saveChecklist(fresh);
  return fresh;
}

export function getProgress(items: SupplyItem[]): { checked: number; total: number } {
  return { checked: items.filter((i) => i.checked).length, total: items.length };
}
