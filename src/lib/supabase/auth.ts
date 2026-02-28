import { createClient } from './client';
import type { User } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'manager' | 'teacher' | 'part_time';

export interface Membership {
  id: string;
  user_id: string;
  organization_id: string;
  staff_id: string | null;
  role: AppRole;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getMembership(): Promise<Membership | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  return data as Membership | null;
}

export async function getRole(): Promise<AppRole | null> {
  const membership = await getMembership();
  return membership?.role ?? null;
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

/**
 * ロール階層の判定
 * admin > manager > teacher > part_time
 */
const roleHierarchy: Record<AppRole, number> = {
  admin: 4,
  manager: 3,
  teacher: 2,
  part_time: 1,
};

export function hasMinRole(userRole: AppRole | null, minRole: AppRole): boolean {
  if (!userRole) return false;
  return roleHierarchy[userRole] >= roleHierarchy[minRole];
}

export const roleLabels: Record<AppRole, string> = {
  admin: '園長',
  manager: '主任',
  teacher: '担任',
  part_time: 'パート',
};
