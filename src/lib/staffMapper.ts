import { Staff } from '@/components/AppLayout';

/** Supabase staff テーブルの列を API 層に閉じ込めた表現 */
export interface SupabaseStaffRow {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  class_assignment: string | null;
  email: string | null;
  phone: string | null;
  hire_date: string | null;
  qualifications: string[];
  /** API が memberships 存在を join して付与するフラグ。真偽値として取得想定 */
  has_account?: boolean;
  /** Phase 2d: 退職日時 (在職中は null)。ISO 文字列で来る */
  archived_at?: string | null;
  archive_reason?: string | null;
}

/**
 * Supabase の staff 行を UI 型にマップする唯一の経路。
 * hireDate の `Date` 変換もここに集約し、呼び出し側で個別に Date 化しない。
 */
export function mapSupabaseStaff(row: SupabaseStaffRow): Staff {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    classAssignment: row.class_assignment ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    hireDate: row.hire_date ? new Date(row.hire_date) : new Date(),
    qualifications: row.qualifications ?? [],
    hasAccount: row.has_account === true,
    archivedAt: row.archived_at ? new Date(row.archived_at) : undefined,
    archiveReason: row.archive_reason ?? undefined,
  };
}
