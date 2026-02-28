/**
 * Repository ファクトリ — 環境変数で localStorage / Supabase を切替
 */
import { Repository, Identifiable, StorageMode } from './types';
import { LocalRepository } from './local';
import { SupabaseRepository } from './supabase';

export function getStorageMode(): StorageMode {
  const mode = (typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_STORAGE_MODE
    : process.env.NEXT_PUBLIC_STORAGE_MODE) as StorageMode | undefined;
  return mode ?? 'local';
}

/**
 * dual モード: localStorage に書き込みつつ Supabase にも書き込む
 */
class DualRepository<T extends Identifiable> implements Repository<T> {
  constructor(
    private local: LocalRepository<T>,
    private remote: SupabaseRepository<T>
  ) {}

  async getAll(): Promise<T[]> {
    // dual モードでは local を primary とする
    return this.local.getAll();
  }

  async getById(id: string): Promise<T | null> {
    return this.local.getById(id);
  }

  async create(item: T): Promise<T> {
    const result = await this.local.create(item);
    // Supabase への書き込みは best-effort
    this.remote.create(item).catch(err =>
      console.warn('[DualRepo] Supabase create failed:', err)
    );
    return result;
  }

  async update(id: string, partial: Partial<T>): Promise<T> {
    const result = await this.local.update(id, partial);
    this.remote.update(id, partial).catch(err =>
      console.warn('[DualRepo] Supabase update failed:', err)
    );
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.local.delete(id);
    this.remote.delete(id).catch(err =>
      console.warn('[DualRepo] Supabase delete failed:', err)
    );
  }
}

interface CreateRepoOptions<T extends Identifiable> {
  storageKey: string;
  tableName: string;
  defaultData?: T[];
  organizationId?: string;
}

export function createRepository<T extends Identifiable>(
  options: CreateRepoOptions<T>
): Repository<T> {
  const mode = getStorageMode();
  const local = new LocalRepository<T>(options.storageKey, options.defaultData);

  if (mode === 'local') {
    return local;
  }

  const orgId = options.organizationId ?? 'default';
  const remote = new SupabaseRepository<T>(options.tableName, orgId);

  if (mode === 'dual') {
    return new DualRepository<T>(local, remote);
  }

  // supabase mode
  return remote;
}

// Re-export types
export type { Repository, Identifiable, StorageMode, EntityName } from './types';
