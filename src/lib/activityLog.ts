import { saveToStorage, loadFromStorage, STORAGE_KEYS } from './storage';

export type ActivityType =
  | 'classify'
  | 'classify_confirm'
  | 'classify_edit'
  | 'classify_cancel'
  | 'rule_chat'
  | 'ai_delete_child_blocked'
  | 'ai_delete_child_confirmed'
  | 'ai_delete_child_cancelled'
  | 'ai_add_rule_saved'
  | 'ai_update_rule_saved'
  | 'ai_delete_rule_blocked'
  | 'ai_delete_rule_confirmed'
  | 'ai_delete_rule_cancelled'
  | 'ai_add_calendar_event_saved'
  | 'ai_delete_calendar_event_blocked'
  | 'ai_delete_calendar_event_confirmed'
  | 'ai_delete_calendar_event_cancelled';

export interface ClassifyPayload {
  inputText: string;
  intent: string;
  confidence?: number;
}

export interface ConfirmPayload {
  messageId: string;
  emergency?: boolean;
}

export interface EditPayload {
  messageId: string;
  oldIntent: string;
  newIntent: string;
}

export interface CancelPayload {
  messageId: string;
}

export interface RuleChatPayload {
  question: string;
  answer: string;
  referencedRuleIds?: string[];
}

/** AI起動の園児削除に関する監査用ペイロード */
export interface AiDeleteChildPayload {
  sourceMessageId: string;
  /** 原文に含まれていた削除語(監査用) */
  matchedKeyword?: string;
  /** 原文由来で一致した候補数 */
  candidateCount: number;
  /** 操作したユーザーのロール */
  role: string | null;
  /** 確定時は対象園児ID、ブロック/キャンセル時は undefined */
  targetChildId?: string;
  /** ブロック理由(blocked時のみ) */
  reason?: string;
}

export interface AiAddRuleSavedPayload {
  sourceMessageId: string;
  ruleId: string;
  ruleTitle: string;
  category: string;
}

/** AI起動のルール削除監査用ペイロード */
export interface AiDeleteRulePayload {
  sourceMessageId: string;
  matchedKeyword?: string;
  candidateCount: number;
  role: string | null;
  /** 確定時は対象ルールID、ブロック/キャンセル時は undefined */
  targetRuleId?: string;
  targetRuleTitle?: string;
  reason?: string;
}

/** AI起動の予定追加監査用ペイロード */
export interface AiAddCalendarEventPayload {
  sourceMessageId: string;
  eventId: string;
  title: string;
  date: string;
}

/** AI起動の予定削除監査用ペイロード */
export interface AiDeleteCalendarEventPayload {
  sourceMessageId: string;
  matchedKeyword?: string;
  candidateCount: number;
  role: string | null;
  /** 確定時は対象予定ID、ブロック/キャンセル時は undefined */
  targetEventId?: string;
  targetEventTitle?: string;
  /** AI が抽出した対象日(YYYY-MM-DD)。null/undefined のこともある */
  targetDate?: string;
  reason?: string;
}

export type ActivityPayload =
  | ClassifyPayload
  | ConfirmPayload
  | EditPayload
  | CancelPayload
  | RuleChatPayload
  | AiDeleteChildPayload
  | AiAddRuleSavedPayload
  | AiDeleteRulePayload
  | AiAddCalendarEventPayload
  | AiDeleteCalendarEventPayload;

export interface ActivityLog {
  id: string;
  timestamp: Date;
  type: ActivityType;
  payload: ActivityPayload;
}

function getLogs(): ActivityLog[] {
  return loadFromStorage<ActivityLog[]>(STORAGE_KEYS.activityLog) ?? [];
}

function saveLogs(logs: ActivityLog[]): void {
  saveToStorage(STORAGE_KEYS.activityLog, logs);
}

export function recordActivity(type: ActivityType, payload: ActivityPayload): void {
  const entry: ActivityLog = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    type,
    payload,
  };
  const logs = getLogs();
  logs.push(entry);
  saveLogs(logs);
}

export function exportLogsAsJSON(): void {
  const logs = getLogs();
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `kidsnote_activity_log_${formatDate()}.json`);
}

export function exportLogsAsCSV(): void {
  const logs = getLogs();
  const header = 'id,timestamp,type,payload\n';
  const rows = logs.map(l =>
    `${l.id},${new Date(l.timestamp).toISOString()},${l.type},"${JSON.stringify(l.payload).replace(/"/g, '""')}"`
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  downloadBlob(blob, `kidsnote_activity_log_${formatDate()}.csv`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(): string {
  return new Date().toISOString().slice(0, 10);
}
