'use client';

import { useCallback, useRef, useState } from 'react';
import { useApp } from '@/components/AppLayout';
import { hasDeleteChildKeyword, hasDeleteRuleSignal } from '@/lib/constants/deleteKeywords';
import { hasMinRole } from '@/lib/supabase/auth';
import { AddCalendarEventData, AddRuleData, DeleteChildData, DeleteRuleData, InputMessage, UpdateRuleData } from '@/types/intent';
import { BASIC_RULE_CATEGORIES, Rule } from '@/types/rule';
import { recordActivity } from '@/lib/activityLog';
import { ChildWithGrowth } from '@/lib/childrenStore';
import { countChildActivity } from '@/lib/childActivityCount';

/**
 * AIメッセージ確定/キャンセル時の副作用を集約したフック。
 * FloatingPopup から action 処理を切り出し、責務を「UI」と「action」に分離する。
 *
 * 返り値:
 * - selectedCandidateId / setSelectedCandidateId: delete_child で複数候補から1人選ぶUI用
 * - getDeleteCandidates(msg): delete_child の aiMatchedChildIds を ChildWithGrowth[] に解決
 * - canDelete: admin|manager かどうか
 * - performConfirm(msg, candidates): 確定ボタン押下時の分岐処理。{ dismiss } を返し、
 *   呼び出し側(FloatingPopup)は dismiss=true なら popup から消す
 * - performCancel(msg, candidates): キャンセル時の監査ログ + cancelMessage
 */
export function useMessageActions() {
  const {
    messages,
    confirmMessage,
    cancelMessage,
    children: childrenData,
    attendance,
    archiveChild,
    openConfirm,
    addToast,
    setPendingAiRule,
    setPendingAiCalendarEvent,
    rules,
    deleteRule,
    currentUserRole,
  } = useApp();

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  /** blocked 重複排除: (messageId, reason) 単位で初回のみ記録 */
  const blockedLoggedRef = useRef<Set<string>>(new Set());

  const logBlockedOnce = useCallback(
    (msg: InputMessage, reason: string, matchedKeyword: string | undefined, candidateCount: number) => {
      const key = `${msg.id}:${reason}`;
      if (blockedLoggedRef.current.has(key)) return;
      blockedLoggedRef.current.add(key);
      recordActivity('ai_delete_child_blocked', {
        sourceMessageId: msg.id,
        matchedKeyword,
        candidateCount,
        role: currentUserRole,
        reason,
      });
    },
    [currentUserRole],
  );

  const getDeleteCandidates = useCallback(
    (msg: InputMessage | undefined): ChildWithGrowth[] => {
      if (!msg || msg.result?.intent !== 'delete_child') return [];
      return (msg.aiMatchedChildIds ?? [])
        .map(id => childrenData.find(c => c.id === id))
        .filter((c): c is ChildWithGrowth => !!c);
    },
    [childrenData],
  );

  const canDelete = hasMinRole(currentUserRole, 'manager');

  const resolveDeleteTarget = useCallback(
    (candidates: ChildWithGrowth[]): ChildWithGrowth | null => {
      if (candidates.length === 1) return candidates[0];
      return candidates.find(c => c.id === selectedCandidateId) ?? null;
    },
    [selectedCandidateId],
  );

  const performDeleteChild = useCallback(
    async (msg: InputMessage, candidates: ChildWithGrowth[]) => {
      const data = msg.result?.data as DeleteChildData | undefined;
      const matchedKeyword = data?.matched_keyword;
      const candidateCount = candidates.length;

      if (!hasDeleteChildKeyword(msg.content)) {
        addToast({
          type: 'error',
          message: 'AIが削除と判定しましたが、原文に明示的な削除語がないため中止しました',
        });
        logBlockedOnce(msg, 'no_explicit_keyword_in_raw_text', matchedKeyword, candidateCount);
        cancelMessage(msg.id);
        return;
      }
      if (!canDelete) {
        addToast({
          type: 'error',
          message: '園児の削除は管理者・主任のみ実行できます。管理者にご依頼ください。',
        });
        logBlockedOnce(msg, 'insufficient_role', matchedKeyword, candidateCount);
        return;
      }
      if (candidateCount === 0) {
        addToast({
          type: 'error',
          message: `「${data?.target_name ?? '不明'}」に一致する園児が見つかりません。フルネームやクラスで指定してください。`,
        });
        logBlockedOnce(msg, 'no_matching_child', matchedKeyword, candidateCount);
        return;
      }
      const target = resolveDeleteTarget(candidates);
      if (!target) {
        addToast({ type: 'info', message: '同名の園児が複数います。候補から対象を選んでください。' });
        return;
      }
      const name = `${target.lastNameKanji || target.lastName} ${target.firstNameKanji || target.firstName}`.trim();
      const { growthCount, attendanceCount } = countChildActivity(target, messages, attendance);
      // AI 経由の「削除」は退園(アーカイブ)として扱う。復元可能なので typed confirm 不要
      const confirmed = await openConfirm({
        title: `${name} さんを退園します`,
        message: `クラス: ${target.className}\nアーカイブに移動され、一覧から非表示になります。関連する成長記録・出欠は保持されます。\n「管理 > アーカイブ」から復元・完全削除できます。`,
        type: 'info',
        influenceScope: [
          { label: '関連する成長記録', count: growthCount },
          { label: '関連する出欠記録', count: attendanceCount, unit: '日分' },
        ],
        confirmLabel: '退園する',
      });
      if (confirmed) {
        archiveChild(target.id);
        confirmMessage(msg.id);
        addToast({ type: 'success', message: `${name} さん(${target.className})を退園しました(アーカイブから復元可)` });
        recordActivity('ai_delete_child_confirmed', {
          sourceMessageId: msg.id,
          matchedKeyword,
          candidateCount,
          role: currentUserRole,
          targetChildId: target.id,
        });
        setSelectedCandidateId(null);
      } else {
        recordActivity('ai_delete_child_cancelled', {
          sourceMessageId: msg.id,
          matchedKeyword,
          candidateCount,
          role: currentUserRole,
          targetChildId: target.id,
        });
      }
    },
    [
      addToast,
      cancelMessage,
      canDelete,
      confirmMessage,
      currentUserRole,
      logBlockedOnce,
      messages,
      attendance,
      openConfirm,
      archiveChild,
      resolveDeleteTarget,
    ],
  );

  const performAddRule = useCallback(
    (msg: InputMessage) => {
      const data = msg.result?.data as AddRuleData | undefined;
      if (!data) return;
      const normalizedCategory = BASIC_RULE_CATEGORIES.includes(data.category) ? data.category : 'other';
      setPendingAiRule({
        sourceMessageId: msg.id,
        draft: {
          title: data.title,
          content: data.content,
          category: normalizedCategory,
        },
      });
    },
    [setPendingAiRule],
  );

  /** タイトルヒントから既存ルールを緩やかにマッチ(部分一致/双方向) */
  const findMatchingRules = useCallback(
    (titleHint: string): Rule[] => {
      const h = titleHint.trim();
      if (!h) return [];
      return rules.filter(r => r.title.includes(h) || h.includes(r.title));
    },
    [rules],
  );

  const performDeleteRule = useCallback(
    async (msg: InputMessage) => {
      const data = msg.result?.data as DeleteRuleData | undefined;
      const matchedKeyword = data?.matched_keyword;
      const logBlocked = (reason: string, candidateCount: number, target?: Rule) =>
        recordActivity('ai_delete_rule_blocked', {
          sourceMessageId: msg.id,
          matchedKeyword,
          candidateCount,
          role: currentUserRole,
          targetRuleId: target?.id,
          targetRuleTitle: target?.title,
          reason,
        });
      // 二重ガード: 原文にルール削除シグナル(削除語+ルール文脈)があるか
      if (!hasDeleteRuleSignal(msg.content)) {
        addToast({ type: 'error', message: 'AIがルール削除と判定しましたが、原文に削除語+ルール文脈がないため中止しました' });
        logBlocked('no_explicit_rule_delete_signal', 0);
        cancelMessage(msg.id);
        return;
      }
      // ロール: admin|manager のみ
      if (!canDelete) {
        addToast({ type: 'error', message: 'ルール削除は管理者・主任のみ実行できます。管理者にご依頼ください。' });
        logBlocked('insufficient_role', 0);
        return;
      }
      const candidates = findMatchingRules(data?.target_title_hint ?? '');
      if (candidates.length === 0) {
        addToast({ type: 'error', message: `「${data?.target_title_hint ?? '不明'}」に一致するルールが見つかりません。タイトルを正確に指定してください。` });
        logBlocked('no_matching_rule', 0);
        return;
      }
      if (candidates.length > 1) {
        const names = candidates.map(c => `「${c.title}」`).join('、');
        addToast({ type: 'info', message: `同じタイトルのルールが複数あります(${names})。ルール管理画面で削除してください。` });
        logBlocked('multiple_matches', candidates.length);
        return;
      }
      const target = candidates[0];
      const confirmed = await openConfirm({
        title: `ルール「${target.title}」を削除します`,
        message: 'この操作は取り消せません。ルールは復元できません。',
        type: 'danger',
        confirmLabel: '削除する',
      });
      if (confirmed) {
        deleteRule(target.id);
        confirmMessage(msg.id);
        addToast({ type: 'success', message: `ルール「${target.title}」を削除しました` });
        recordActivity('ai_delete_rule_confirmed', {
          sourceMessageId: msg.id,
          matchedKeyword,
          candidateCount: 1,
          role: currentUserRole,
          targetRuleId: target.id,
          targetRuleTitle: target.title,
        });
      } else {
        recordActivity('ai_delete_rule_cancelled', {
          sourceMessageId: msg.id,
          matchedKeyword,
          candidateCount: 1,
          role: currentUserRole,
          targetRuleId: target.id,
          targetRuleTitle: target.title,
        });
      }
    },
    [addToast, cancelMessage, canDelete, confirmMessage, currentUserRole, deleteRule, findMatchingRules, openConfirm],
  );

  const performUpdateRule = useCallback(
    (msg: InputMessage) => {
      const data = msg.result?.data as UpdateRuleData | undefined;
      if (!data) return;
      if (!canDelete) {
        addToast({ type: 'error', message: 'ルール編集は管理者・主任のみ実行できます。管理者にご依頼ください。' });
        return;
      }
      const candidates = findMatchingRules(data.target_title_hint ?? '');
      if (candidates.length === 0) {
        addToast({ type: 'error', message: `「${data.target_title_hint ?? '不明'}」に一致するルールが見つかりません。タイトルを正確に指定してください。` });
        return;
      }
      if (candidates.length > 1) {
        addToast({ type: 'info', message: '同じタイトルのルールが複数あります。ルール管理画面で編集してください。' });
        return;
      }
      const target = candidates[0];
      const normalizedCategory = BASIC_RULE_CATEGORIES.includes(data.updated_category ?? '') ? data.updated_category! : target.category;
      setPendingAiRule({
        sourceMessageId: msg.id,
        updateTargetId: target.id,
        draft: {
          title: data.updated_title || target.title,
          content: data.updated_content || target.content,
          category: normalizedCategory,
        },
      });
    },
    [addToast, canDelete, findMatchingRules, setPendingAiRule],
  );

  const performAddCalendarEvent = useCallback(
    (msg: InputMessage) => {
      const data = msg.result?.data as AddCalendarEventData | undefined;
      if (!data) return;
      setPendingAiCalendarEvent({
        sourceMessageId: msg.id,
        draft: {
          title: data.title,
          date: data.date,
          startTime: data.start_time,
          endTime: data.end_time,
          allDay: data.all_day ?? false,
          category: data.category ?? '行事',
          location: data.location,
          description: data.description,
        },
      });
    },
    [setPendingAiCalendarEvent],
  );

  const performConfirm = useCallback(
    async (msg: InputMessage, candidates: ChildWithGrowth[]): Promise<{ dismiss: boolean }> => {
      // 緊急モードは最優先
      if (msg.isEmergency) {
        confirmMessage(msg.id);
        return { dismiss: false };
      }
      if (msg.result?.intent === 'delete_child') {
        await performDeleteChild(msg, candidates);
        return { dismiss: false };
      }
      if (msg.result?.intent === 'add_rule') {
        performAddRule(msg);
        return { dismiss: false };
      }
      if (msg.result?.intent === 'delete_rule') {
        await performDeleteRule(msg);
        return { dismiss: false };
      }
      if (msg.result?.intent === 'update_rule') {
        performUpdateRule(msg);
        return { dismiss: false };
      }
      if (msg.result?.intent === 'add_calendar_event') {
        performAddCalendarEvent(msg);
        return { dismiss: false };
      }
      if (msg.result?.intent === 'rule_query') {
        // rule_query はそのまま popup から閉じるだけ
        return { dismiss: true };
      }
      confirmMessage(msg.id);
      return { dismiss: false };
    },
    [confirmMessage, performDeleteChild, performAddRule, performDeleteRule, performUpdateRule, performAddCalendarEvent],
  );

  const performCancel = useCallback(
    (msg: InputMessage, candidates: ChildWithGrowth[]) => {
      if (msg.result?.intent === 'delete_child') {
        const data = msg.result.data as DeleteChildData | undefined;
        const target = resolveDeleteTarget(candidates);
        recordActivity('ai_delete_child_cancelled', {
          sourceMessageId: msg.id,
          matchedKeyword: data?.matched_keyword,
          candidateCount: candidates.length,
          role: currentUserRole,
          targetChildId: target?.id,
        });
      } else if (msg.result?.intent === 'delete_rule') {
        // popup キャンセル経路も監査ログに残す。対象は原文タイトルヒントから再解決
        const data = msg.result.data as DeleteRuleData | undefined;
        const ruleCandidates = findMatchingRules(data?.target_title_hint ?? '');
        const target = ruleCandidates.length === 1 ? ruleCandidates[0] : undefined;
        recordActivity('ai_delete_rule_cancelled', {
          sourceMessageId: msg.id,
          matchedKeyword: data?.matched_keyword,
          candidateCount: ruleCandidates.length,
          role: currentUserRole,
          targetRuleId: target?.id,
          targetRuleTitle: target?.title,
        });
      }
      cancelMessage(msg.id);
      setSelectedCandidateId(null);
    },
    [cancelMessage, currentUserRole, findMatchingRules, resolveDeleteTarget],
  );

  return {
    selectedCandidateId,
    setSelectedCandidateId,
    getDeleteCandidates,
    canDelete,
    performConfirm,
    performCancel,
  };
}
