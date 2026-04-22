'use client';

import { useCallback, useRef, useState } from 'react';
import { useApp } from '@/components/AppLayout';
import { hasDeleteChildKeyword } from '@/lib/constants/deleteKeywords';
import { hasMinRole } from '@/lib/supabase/auth';
import { AddRuleData, DeleteChildData, InputMessage } from '@/types/intent';
import { BASIC_RULE_CATEGORIES } from '@/types/rule';
import { recordActivity } from '@/lib/activityLog';
import { ChildWithGrowth } from '@/lib/childrenStore';

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
    removeChild,
    openConfirm,
    addToast,
    setPendingAiRule,
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
      const growthCount = messages.filter(
        m2 => m2.status === 'saved' && m2.result?.intent === 'growth' && m2.linkedChildIds?.includes(target.id),
      ).length;
      const attendanceCount = attendance.filter(a => a.childId === target.id).length;
      const confirmed = await openConfirm({
        title: `${name} さんを削除します`,
        message: `クラス: ${target.className}\n園児情報のみ削除されます。関連する成長記録・出欠記録は残ります(Phase 2で退園処理に切り替え予定)。`,
        type: 'danger',
        influenceScope: [
          { label: '関連する成長記録', count: growthCount },
          { label: '関連する出欠記録', count: attendanceCount, unit: '日分' },
        ],
        typedConfirm: { keyword: '削除' },
        confirmLabel: '削除する',
      });
      if (confirmed) {
        removeChild(target.id);
        confirmMessage(msg.id);
        addToast({ type: 'success', message: `${name} さん(${target.className})を削除しました` });
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
      removeChild,
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
      if (msg.result?.intent === 'rule_query') {
        // rule_query はそのまま popup から閉じるだけ
        return { dismiss: true };
      }
      confirmMessage(msg.id);
      return { dismiss: false };
    },
    [confirmMessage, performDeleteChild, performAddRule],
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
      }
      cancelMessage(msg.id);
      setSelectedCandidateId(null);
    },
    [cancelMessage, currentUserRole, resolveDeleteTarget],
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
