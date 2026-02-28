/**
 * localStorage 実装 — 既存の storage.ts をラップ
 * 暗号化対象データは非同期ロードに対応
 */
import { Repository, Identifiable } from './types';
import { saveToStorage, loadFromStorageAsync } from '../storage';

export class LocalRepository<T extends Identifiable> implements Repository<T> {
  constructor(
    private storageKey: string,
    private defaultData: T[] = []
  ) { }

  async getAll(): Promise<T[]> {
    return (await loadFromStorageAsync<T[]>(this.storageKey)) ?? this.defaultData;
  }

  async getById(id: string): Promise<T | null> {
    const all = await this.getAll();
    return all.find(item => item.id === id) ?? null;
  }

  async create(item: T): Promise<T> {
    const all = await this.getAll();
    all.push(item);
    saveToStorage(this.storageKey, all);
    return item;
  }

  async update(id: string, partial: Partial<T>): Promise<T> {
    const all = await this.getAll();
    const idx = all.findIndex(item => item.id === id);
    if (idx === -1) throw new Error(`Item not found: ${id}`);
    all[idx] = { ...all[idx], ...partial };
    saveToStorage(this.storageKey, all);
    return all[idx];
  }

  async delete(id: string): Promise<void> {
    const all = await this.getAll();
    const filtered = all.filter(item => item.id !== id);
    saveToStorage(this.storageKey, filtered);
  }
}
