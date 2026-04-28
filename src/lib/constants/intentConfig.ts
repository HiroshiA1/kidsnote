import { IntentType } from '@/types/intent';

export interface IntentConfigItem {
  label: string;
  icon: string;
  bgColor: string;
  borderColor: string;
  /** IntentCard用 */
  color: string;
  /** FloatingPopup用 */
  actionLabel: string;
  /** Dashboard用 */
  cardBg: string;
  href: string;
}

export const intentConfig: Record<IntentType, IntentConfigItem> = {
  growth: {
    label: '成長記録',
    icon: '🌱',
    color: 'text-headline',
    bgColor: 'bg-tertiary/30',
    borderColor: 'border-tertiary',
    actionLabel: '保存する',
    cardBg: 'bg-tertiary/20',
    href: '/records/growth',
  },
  incident: {
    label: 'ヒヤリハット',
    icon: '⚠️',
    color: 'text-headline',
    bgColor: 'bg-alert/20',
    borderColor: 'border-alert',
    actionLabel: '保存する',
    cardBg: 'bg-alert/10',
    href: '/records/incident',
  },
  handover: {
    label: '申し送り',
    icon: '📝',
    color: 'text-headline',
    bgColor: 'bg-secondary/30',
    borderColor: 'border-button',
    actionLabel: '保存する',
    cardBg: 'bg-secondary/20',
    href: '/records/handover',
  },
  child_update: {
    label: '園児情報更新',
    icon: '👤',
    color: 'text-headline',
    bgColor: 'bg-surface',
    borderColor: 'border-paragraph/30',
    actionLabel: '保存する',
    cardBg: 'bg-paragraph/5',
    href: '/records/child-update',
  },
  add_child: {
    label: '園児追加',
    icon: '👶',
    color: 'text-headline',
    bgColor: 'bg-button/10',
    borderColor: 'border-button',
    actionLabel: '追加する',
    cardBg: 'bg-button/5',
    href: '/children',
  },
  add_staff: {
    label: '職員追加',
    icon: '👩‍🏫',
    color: 'text-headline',
    bgColor: 'bg-tertiary/20',
    borderColor: 'border-tertiary',
    actionLabel: '追加する',
    cardBg: 'bg-tertiary/10',
    href: '/staff',
  },
  rule_query: {
    label: 'ルール質問',
    icon: '📚',
    color: 'text-headline',
    bgColor: 'bg-button/10',
    borderColor: 'border-button/50',
    actionLabel: '確認',
    cardBg: 'bg-button/5',
    href: '/rules',
  },
  delete_child: {
    label: '園児削除',
    icon: '🗑️',
    color: 'text-alert',
    bgColor: 'bg-alert/10',
    borderColor: 'border-alert/60',
    actionLabel: '対象を確認',
    cardBg: 'bg-alert/5',
    href: '/children',
  },
  add_rule: {
    label: 'ルール追加',
    icon: '📘',
    color: 'text-headline',
    bgColor: 'bg-tertiary/20',
    borderColor: 'border-tertiary',
    actionLabel: '内容を確認して保存',
    cardBg: 'bg-tertiary/10',
    href: '/rules',
  },
  delete_rule: {
    label: 'ルール削除',
    icon: '🗑️',
    color: 'text-alert',
    bgColor: 'bg-alert/10',
    borderColor: 'border-alert/60',
    actionLabel: '対象を確認して削除へ',
    cardBg: 'bg-alert/5',
    href: '/rules',
  },
  update_rule: {
    label: 'ルール更新',
    icon: '✏️',
    color: 'text-headline',
    bgColor: 'bg-button/10',
    borderColor: 'border-button/50',
    actionLabel: '内容を確認して保存',
    cardBg: 'bg-button/5',
    href: '/rules',
  },
  add_calendar_event: {
    label: '予定追加',
    icon: '📅',
    color: 'text-headline',
    bgColor: 'bg-secondary/30',
    borderColor: 'border-button',
    actionLabel: '内容を確認して保存',
    cardBg: 'bg-secondary/20',
    href: '/calendar',
  },
  delete_calendar_event: {
    label: '予定削除',
    icon: '🗑️',
    color: 'text-alert',
    bgColor: 'bg-alert/10',
    borderColor: 'border-alert/60',
    actionLabel: '対象を確認して削除へ',
    cardBg: 'bg-alert/5',
    href: '/calendar',
  },
  update_child: {
    label: '園児情報変更',
    icon: '✏️',
    color: 'text-headline',
    bgColor: 'bg-button/10',
    borderColor: 'border-button/50',
    actionLabel: '内容を確認して保存',
    cardBg: 'bg-button/5',
    href: '/children',
  },
};

/** ダッシュボードで表示する記録タイプ */
export const recordIntentTypes = ['growth', 'incident', 'handover', 'child_update'] as const;
