/**
 * Repository interface — localStorage と Supabase の切替を抽象化
 */

export interface Repository<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(item: T): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

/** 全エンティティ共通の識別子 */
export interface Identifiable {
  id: string;
}

/** ストレージモード */
export type StorageMode = 'local' | 'dual' | 'supabase';

/** Repository が扱うエンティティ名 */
export type EntityName =
  | 'children'
  | 'staff'
  | 'rules'
  | 'messages'
  | 'attendance'
  | 'shiftPatterns'
  | 'shiftAssignments'
  | 'staffAttendance';
