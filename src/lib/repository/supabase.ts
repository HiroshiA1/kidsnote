/**
 * Supabase 実装 — サーバー/クライアント両対応
 */
import { Repository, Identifiable } from './types';
import { createClient } from '../supabase/client';

export class SupabaseRepository<T extends Identifiable> implements Repository<T> {
  constructor(
    private tableName: string,
    private organizationId: string
  ) {}

  private get client() {
    return createClient();
  }

  async getAll(): Promise<T[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('organization_id', this.organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as T[];
  }

  async getById(id: string): Promise<T | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('organization_id', this.organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      throw error;
    }
    return data as T;
  }

  async create(item: T): Promise<T> {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert({ ...item, organization_id: this.organizationId })
      .select()
      .single();

    if (error) throw error;
    return data as T;
  }

  async update(id: string, partial: Partial<T>): Promise<T> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update(partial)
      .eq('id', id)
      .eq('organization_id', this.organizationId)
      .select()
      .single();

    if (error) throw error;
    return data as T;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .eq('organization_id', this.organizationId);

    if (error) throw error;
  }
}
