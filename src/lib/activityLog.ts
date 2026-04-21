import { saveToStorage, loadFromStorage, STORAGE_KEYS } from './storage';

export type ActivityType =
  | 'classify'
  | 'classify_confirm'
  | 'classify_edit'
  | 'classify_cancel'
  | 'rule_chat';

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

export type ActivityPayload =
  | ClassifyPayload
  | ConfirmPayload
  | EditPayload
  | CancelPayload
  | RuleChatPayload;

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
