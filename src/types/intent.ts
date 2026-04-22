export type IntentType = 'growth' | 'incident' | 'handover' | 'child_update' | 'add_child' | 'add_staff' | 'rule_query' | 'delete_child' | 'add_rule';

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

export interface IntentResult {
  intent: IntentType;
  data: GrowthData | IncidentData | HandoverData | ChildUpdateData | AddChildData | AddStaffData | RuleQueryData | DeleteChildData | AddRuleData;
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
