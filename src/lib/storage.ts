import { encryptData, decryptData, isCryptoAvailable } from './crypto';

const DATE_ISO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function dateReviver(_key: string, value: unknown): unknown {
  if (typeof value === 'string' && DATE_ISO_REGEX.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  return value;
}

/** 暗号化対象キー（個人情報を含むもの） */
const ENCRYPTED_KEYS = new Set([
  'kidsnote_children',
  'kidsnote_staff',
  'kidsnote_messages',
  'kidsnote_attendance',
  'kidsnote_staff_attendance',
]);

/** 暗号化保存済みマーカー */
const ENCRYPTED_PREFIX = 'enc:';

/**
 * データを localStorage に保存する
 * 個人情報キーは AES-GCM で暗号化してから保存
 */
export function saveToStorage<T>(key: string, data: T): void {
  try {
    const json = JSON.stringify(data);

    if (ENCRYPTED_KEYS.has(key) && isCryptoAvailable()) {
      // 非同期で暗号化保存（fire-and-forget）
      encryptData(json)
        .then(encrypted => {
          localStorage.setItem(key, ENCRYPTED_PREFIX + encrypted);
        })
        .catch(() => {
          // 暗号化失敗時は平文保存にフォールバック
          localStorage.setItem(key, json);
        });
    } else {
      localStorage.setItem(key, json);
    }
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/**
 * localStorage からデータを読み込む
 * 暗号化されたデータは復号して返す
 */
export function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;

    // 暗号化データの場合は非同期復号が必要 → 同期 API では返せない
    // loadFromStorageAsync を使用するか、キャッシュから返す
    if (raw.startsWith(ENCRYPTED_PREFIX)) {
      // 暗号化データの場合は null を返し、非同期版を使用させる
      return null;
    }

    return JSON.parse(raw, dateReviver) as T;
  } catch {
    return null;
  }
}

/**
 * localStorage から暗号化データを非同期で読み込む
 */
export async function loadFromStorageAsync<T>(key: string): Promise<T | null> {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;

    if (raw.startsWith(ENCRYPTED_PREFIX)) {
      const decrypted = await decryptData(raw.slice(ENCRYPTED_PREFIX.length));
      return JSON.parse(decrypted, dateReviver) as T;
    }

    return JSON.parse(raw, dateReviver) as T;
  } catch {
    return null;
  }
}

export const STORAGE_KEYS = {
  children: 'kidsnote_children',
  staff: 'kidsnote_staff',
  rules: 'kidsnote_rules',
  messages: 'kidsnote_messages',
  activityLog: 'kidsnote_activity_log',
  attendance: 'kidsnote_attendance',
  settings: 'kidsnote_settings',
  shiftPatterns: 'kidsnote_shift_patterns',
  shiftAssignments: 'kidsnote_shift_assignments',
  staffAttendance: 'kidsnote_staff_attendance',
  currentStaffId: 'kidsnote_current_staff_id',
  fiscalYear: 'kidsnote_fiscal_year',
  calendarEvents: 'kidsnote_calendar_events',
  supportAssignments: 'kidsnote_support_assignments',
} as const;
