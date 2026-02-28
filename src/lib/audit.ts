/**
 * 監査ログ — audit_events テーブルへの INSERT
 *
 * localStorage モードでは既存の activityLog に委譲し、
 * Supabase モードでは audit_events テーブルに直接 INSERT する。
 */

import { getStorageMode } from './repository';
import { recordActivity, ActivityType, ActivityPayload } from './activityLog';

export interface AuditEvent {
  event_type: string;
  target_type: string;
  target_id?: string;
  payload?: Record<string, unknown>;
}

/**
 * 監査イベントを記録する
 * - local モード: activityLog 経由で localStorage に保存
 * - supabase/dual モード: Supabase audit_events テーブルに INSERT
 */
export async function recordAudit(event: AuditEvent): Promise<void> {
  const mode = getStorageMode();

  if (mode === 'local') {
    // 既存 activityLog へのマッピング
    const activityType = mapToActivityType(event.event_type);
    if (activityType) {
      recordActivity(activityType, (event.payload ?? {}) as unknown as ActivityPayload);
    }
    return;
  }

  // Supabase モード
  try {
    const { createClient } = await import('./supabase/client');
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('audit_events').insert({
      organization_id: event.payload?.organization_id ?? null,
      actor_user_id: user?.id ?? null,
      event_type: event.event_type,
      target_type: event.target_type,
      target_id: event.target_id,
      payload: event.payload ?? {},
    });
  } catch (err) {
    console.warn('[audit] Failed to write audit event:', err);
    // フォールバック: localStorage に記録
    const activityType = mapToActivityType(event.event_type);
    if (activityType) {
      recordActivity(activityType, (event.payload ?? {}) as unknown as ActivityPayload);
    }
  }
}

function mapToActivityType(eventType: string): ActivityType | null {
  const mapping: Record<string, ActivityType> = {
    'message.classify': 'classify',
    'message.confirm': 'classify_confirm',
    'message.edit': 'classify_edit',
    'message.cancel': 'classify_cancel',
    'rule.chat': 'rule_chat',
  };
  return mapping[eventType] ?? null;
}

/**
 * 便利ヘルパー: CRUD 操作用
 */
export function auditCreate(targetType: string, targetId: string, payload?: Record<string, unknown>) {
  return recordAudit({
    event_type: `${targetType}.create`,
    target_type: targetType,
    target_id: targetId,
    payload,
  });
}

export function auditUpdate(targetType: string, targetId: string, payload?: Record<string, unknown>) {
  return recordAudit({
    event_type: `${targetType}.update`,
    target_type: targetType,
    target_id: targetId,
    payload,
  });
}

export function auditDelete(targetType: string, targetId: string, payload?: Record<string, unknown>) {
  return recordAudit({
    event_type: `${targetType}.delete`,
    target_type: targetType,
    target_id: targetId,
    payload,
  });
}
