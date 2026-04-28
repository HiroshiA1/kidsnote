export type IntentType = 'growth' | 'incident' | 'handover' | 'child_update' | 'add_child' | 'add_staff' | 'rule_query' | 'delete_child' | 'add_rule' | 'delete_rule' | 'update_rule' | 'add_calendar_event' | 'delete_calendar_event' | 'update_child';

export interface GrowthData {
  child_names: string[];
  summary: string;
  tags: string[];
}

export interface IncidentData {
  location: string;
  cause: string;
  severity: 'low' | 'medium' | 'high';
  child_name: string;
  description: string;
}

export interface HandoverData {
  message: string;
  target: string;
  urgent: boolean;
}

export interface ChildUpdateData {
  child_name: string;
  field: 'allergy' | 'characteristic';
  new_value: string;
}

export interface AddChildData {
  name: string;
  class_name?: string;
  birth_date?: string;
  gender?: 'male' | 'female';
  allergies?: string[];
  notes?: string;
}

export interface AddStaffData {
  name: string;
  role?: string;
  class_name?: string;
  contact?: string;
  notes?: string;
}

export interface RuleQueryData {
  question: string;
}

/** 園児削除 — AI起動の破壊的操作。原文の削除キーワード再検証と openConfirm を必須とする */
export interface DeleteChildData {
  /** AIが原文から抽出した削除対象名(確定ではなく手がかり) */
  target_name: string;
  /** 絞り込みのヒント(例: 「年中組」「3歳」) */
  class_hint?: string;
  /** 原文に含まれていた削除語(監査用) */
  matched_keyword?: string;
}

/** ルール追加 — AI提案を教諭が編集してから保存 */
export interface AddRuleData {
  title: string;
  content: string;
  /** Rule型の category に合わせる。AIが判定できない場合は "other" */
  category: string;
  /** 関連の可能性がある既存ルールID(参考情報、保存ブロック条件ではない) */
  related_rule_ids?: string[];
}

/** ルール削除 — AI起動の破壊的操作。原文のルール関連語+削除語 併存が必須 */
export interface DeleteRuleData {
  /** 対象ルールタイトルのヒント(AI抽出) */
  target_title_hint: string;
  /** 原文に含まれていた削除語(監査用) */
  matched_keyword?: string;
}

/** ルール更新 — AIがルール本文の変更を提案、教諭が RuleModal で編集確定 */
export interface UpdateRuleData {
  /** 対象ルールタイトルのヒント(AI抽出) */
  target_title_hint: string;
  /** 更新後のタイトル(同じでよい場合は target_title_hint と同じ) */
  updated_title?: string;
  /** 更新後の本文 */
  updated_content?: string;
  /** 更新後のカテゴリ */
  updated_category?: string;
}

/**
 * 園児の一般情報を AI 提案で「実際に書き換える」更新。
 * 既存 `child_update` (記録のみで実データは書き換えない) と分離して設計。
 *
 * v1 で対応するフィールド:
 * - `emergency_contact_phone`: 緊急連絡先の電話番号変更
 * - `add_interest`: 興味関心の追加 (interests 配列に push)
 *
 * 名前/誕生日/性別/クラス/アレルギー/配慮事項は v1 では対象外 (誤発火被害が大きい or 別フローを優先)。
 */
export interface UpdateChildData {
  /** AIが原文から抽出した対象園児名(確定ではなく手がかり) */
  target_name: string;
  /** 絞り込みのヒント(例: 「年中組」「3歳」) */
  class_hint?: string;
  field: 'emergency_contact_phone' | 'add_interest';
  /** field='emergency_contact_phone' なら新電話番号、'add_interest' なら追加する興味 */
  new_value: string;
  /** 原文に含まれていたフィールド示唆語(監査用、例: 「連絡先」「電話」「興味」) */
  matched_keyword?: string;
}

/** 予定削除 — AI起動の破壊的操作。原文の予定文脈+削除語 併存が必須 */
export interface DeleteCalendarEventData {
  /** 対象予定タイトルのヒント(AI抽出) */
  target_title_hint: string;
  /** 絞り込み用の対象日 (YYYY-MM-DD)。AI が特定できないこともある */
  target_date?: string;
  /** 原文に含まれていた削除語(監査用) */
  matched_keyword?: string;
}

/** 予定追加 — AI提案を CalendarEventModal で編集確定 */
export interface AddCalendarEventData {
  title: string;
  /** ISO date (YYYY-MM-DD)。AIが特定できない場合は本日 */
  date?: string;
  /** HH:mm 形式、終日なら未指定 */
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  /** カレンダーカテゴリ名(行事/健診 等) */
  category?: string;
  /** 場所 */
  location?: string;
  /** 詳細・説明 */
  description?: string;
}

export interface IntentResult {
  intent: IntentType;
  data:
    | GrowthData
    | IncidentData
    | HandoverData
    | ChildUpdateData
    | AddChildData
    | AddStaffData
    | RuleQueryData
    | DeleteChildData
    | AddRuleData
    | DeleteRuleData
    | UpdateRuleData
    | AddCalendarEventData
    | DeleteCalendarEventData
    | UpdateChildData;
  confidence?: number;
}

export interface InputMessage {
  id: string;
  content: string;
  timestamp: Date;
  result?: IntentResult;
  status: 'pending' | 'processing' | 'confirmed' | 'saved';
  visibility?: 'staff_only' | 'guardians_allowed';
  isMarkedForRecord?: boolean;
  /** 表示用の園児紐付け(selectedChildIdを含む可能性あり、破壊的操作の対象特定には使用不可) */
  linkedChildIds?: string[];
  /** 原文匿名化で確定した園児ID。破壊的操作(delete_child)の対象一意化にはこちらのみ使用する */
  aiMatchedChildIds?: string[];
  linkedToGrowthRecordId?: string;
  ruleAnswer?: { answer: string; referencedRuleIds: string[] };
  /** 送信時に🚨トグルONだった入力。AI分類は保持しつつFloatingPopupで incident としてpre-selectされ、確定時に intent=incident/severity=high に強制される */
  isEmergency?: boolean;
  /**
   * 緊急モードで intent=incident に上書きされる前のAI分類結果。監査・検証用途。
   * 非緊急メッセージでは undefined のまま。
   */
  originalResult?: IntentResult;
}
