'use client';

import { useState, useMemo } from 'react';
import { useApp } from './AppLayout';
import { intentConfig } from '@/lib/constants/intentConfig';
import { IntentContentRenderer } from './IntentContentRenderer';
import { hasDeleteChildKeyword } from '@/lib/constants/deleteKeywords';
import { hasMinRole } from '@/lib/supabase/auth';
import { AddRuleData, DeleteChildData, InputMessage } from '@/types/intent';
import { BASIC_RULE_CATEGORIES } from '@/types/rule';
import { recordActivity } from '@/lib/activityLog';

interface FloatingPopupProps {
  sidebarCollapsed: boolean;
}

export function FloatingPopup(_props: FloatingPopupProps) {
  const {
    messages,
    confirmMessage,
    cancelMessage,
    markForRecord,
    children: childrenData,
    attendance,
    removeChild,
    openConfirm,
    addToast,
    setPendingAiRule,
    currentUserRole,
  } = useApp();
  const [dismissed, setDismissed] = useState<string[]>([]);
  // delete_child で候補が複数ある場合、教諭が選んだID
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // pending/confirmed messages (not yet saved)
  const pendingMessages = messages.filter(
    m => (m.status === 'processing' || m.status === 'confirmed') && !dismissed.includes(m.id)
  );

  const current = pendingMessages[0];
  const queueCount = pendingMessages.length;

  // delete_child の候補園児は「原文由来の aiMatchedChildIds」からのみ解決。
  // linkedChildIds には selectedChildId が含まれうるため、破壊的操作の対象特定には使わない(誤削除防止)。
  const deleteCandidates = useMemo(() => {
    if (current?.result?.intent !== 'delete_child') return [];
    return (current.aiMatchedChildIds ?? [])
      .map(id => childrenData.find(c => c.id === id))
      .filter((c): c is NonNullable<typeof c> => !!c);
  }, [current, childrenData]);

  if (pendingMessages.length === 0) return null;

  const config = current.result ? intentConfig[current.result.intent] : null;
  const isRuleQuery = current.result?.intent === 'rule_query';
  const isEmergency = current.isEmergency === true;
  const isDeleteChild = current.result?.intent === 'delete_child';
  const isAddRule = current.result?.intent === 'add_rule';
  const aiIntent = current.result?.intent;
  const aiMisalignedWithEmergency = isEmergency && aiIntent && aiIntent !== 'incident';
  const canDelete = hasMinRole(currentUserRole, 'manager'); // admin | manager のみ

  // delete_child のターゲット一意化
  const resolvedDeleteTarget =
    deleteCandidates.length === 1
      ? deleteCandidates[0]
      : selectedCandidateId
      ? deleteCandidates.find(c => c.id === selectedCandidateId) ?? null
      : null;

  const handleDeleteChildAction = async (msg: InputMessage) => {
    const data = msg.result?.data as DeleteChildData | undefined;
    const matchedKeyword = data?.matched_keyword;
    const candidateCount = deleteCandidates.length;
    // 二重ガード: 原文の削除語を再検証
    if (!hasDeleteChildKeyword(msg.content)) {
      addToast({
        type: 'error',
        message: 'AIが削除と判定しましたが、原文に明示的な削除語がないため中止しました',
      });
      recordActivity('ai_delete_child_blocked', {
        sourceMessageId: msg.id,
        matchedKeyword,
        candidateCount,
        role: currentUserRole,
        reason: 'no_explicit_keyword_in_raw_text',
      });
      cancelMessage(msg.id);
      return;
    }
    // ロールチェック
    if (!canDelete) {
      addToast({
        type: 'error',
        message: '園児の削除は管理者・主任のみ実行できます。管理者にご依頼ください。',
      });
      recordActivity('ai_delete_child_blocked', {
        sourceMessageId: msg.id,
        matchedKeyword,
        candidateCount,
        role: currentUserRole,
        reason: 'insufficient_role',
      });
      return;
    }
    // 対象特定
    if (deleteCandidates.length === 0) {
      addToast({
        type: 'error',
        message: `「${data?.target_name ?? '不明'}」に一致する園児が見つかりません。フルネームやクラスで指定してください。`,
      });
      recordActivity('ai_delete_child_blocked', {
        sourceMessageId: msg.id,
        matchedKeyword,
        candidateCount,
        role: currentUserRole,
        reason: 'no_matching_child',
      });
      return;
    }
    if (deleteCandidates.length > 1 && !resolvedDeleteTarget) {
      addToast({ type: 'info', message: '同名の園児が複数います。候補から対象を選んでください。' });
      return;
    }
    const target = resolvedDeleteTarget!;
    const name = `${target.lastNameKanji || target.lastName} ${target.firstNameKanji || target.firstName}`.trim();
    // 影響範囲
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
  };

  const handleAddRuleAction = (msg: InputMessage) => {
    const data = msg.result?.data as AddRuleData | undefined;
    if (!data) return;
    // AIが返したcategoryが既知のRuleCategory集合に含まれなければ 'other' に正規化
    const normalizedCategory = BASIC_RULE_CATEGORIES.includes(data.category) ? data.category : 'other';
    setPendingAiRule({
      sourceMessageId: msg.id,
      draft: {
        title: data.title,
        content: data.content,
        category: normalizedCategory,
      },
    });
  };

  const handleConfirm = async () => {
    // 緊急モードは最優先 — rule_query/delete_child 分岐より前に confirmMessage へ流して incident/high 強制を発火させる
    if (current.isEmergency) {
      confirmMessage(current.id);
      return;
    }
    if (isDeleteChild) {
      await handleDeleteChildAction(current);
      return;
    }
    if (isAddRule) {
      handleAddRuleAction(current);
      return;
    }
    if (current.result?.intent === 'rule_query') {
      setDismissed(prev => [...prev, current.id]);
      return;
    }
    confirmMessage(current.id);
  };

  const handleCancel = () => {
    // delete_child の最初のポップアップでキャンセルされたケースも監査ログに残す
    if (current.result?.intent === 'delete_child') {
      const data = current.result.data as DeleteChildData | undefined;
      recordActivity('ai_delete_child_cancelled', {
        sourceMessageId: current.id,
        matchedKeyword: data?.matched_keyword,
        candidateCount: deleteCandidates.length,
        role: currentUserRole,
        targetChildId: resolvedDeleteTarget?.id,
      });
    }
    cancelMessage(current.id);
    setSelectedCandidateId(null);
  };

  const handleMarkForRecord = () => {
    markForRecord(current.id);
  };

  const confirmDisabled =
    isDeleteChild && deleteCandidates.length > 1 && !resolvedDeleteTarget;

  return (
    <div
      className="fixed bottom-24 z-30 w-96 max-w-[calc(100vw-2rem)] transition-all duration-300 right-3 sm:right-6"
    >
      <div className={`rounded-xl shadow-lg border overflow-hidden ${
        isEmergency
          ? 'bg-alert/10 border-alert'
          : config ? `${config.bgColor} ${config.borderColor}` : 'bg-surface border-secondary/30'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-paragraph/10">
          <div className="flex items-center gap-2">
            {isEmergency ? (
              <svg className="w-5 h-5 text-alert" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : config && <span className="text-lg">{config.icon}</span>}
            <span className="font-medium text-headline text-sm">
              {isEmergency ? '緊急ヒヤリハット (重要度:高)' : (config?.label ?? '処理中...')}
            </span>
          </div>
          {queueCount > 1 && (
            <span className="text-xs bg-button text-white px-2 py-0.5 rounded-full">
              +{queueCount - 1}件
            </span>
          )}
        </div>

        {aiMisalignedWithEmergency && config && (
          <div className="px-4 py-2 bg-alert/5 border-b border-alert/20 text-xs text-paragraph">
            AIは「{config.label}」と判断しましたが、緊急モードで送信されたため
            <span className="font-medium text-alert">ヒヤリハット(重要度:高)</span>として記録します。
          </div>
        )}

        {/* Content */}
        <div className="px-4 py-3">
          {current.status === 'processing' ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-secondary/50 rounded w-3/4" />
              <div className="h-3 bg-secondary/30 rounded w-1/2" />
            </div>
          ) : current.result ? (
            <>
              <div className="text-xs text-paragraph/60 bg-surface/30 p-1.5 rounded mb-2 truncate">
                {current.content}
              </div>
              <IntentContentRenderer result={current.result} mode="compact" linkedChildIds={current.linkedChildIds} ruleAnswer={current.ruleAnswer} />
            </>
          ) : null}
        </div>

        {/* delete_child 用 候補選択 */}
        {isDeleteChild && current.status === 'confirmed' && (
          <div className="px-4 py-2 border-t border-alert/20 bg-alert/5 text-xs space-y-2">
            {!canDelete && (
              <p className="text-alert font-medium">※ 園児削除は管理者・主任のみ実行可能です。</p>
            )}
            {deleteCandidates.length === 0 && (
              <p className="text-paragraph">
                対象園児が特定できませんでした。フルネームやクラスで再度指定してください。
              </p>
            )}
            {deleteCandidates.length === 1 && (
              <p className="text-paragraph">
                対象: <span className="font-medium">
                  {deleteCandidates[0].lastNameKanji || deleteCandidates[0].lastName} {deleteCandidates[0].firstNameKanji || deleteCandidates[0].firstName}
                </span>
                （{deleteCandidates[0].className}）
              </p>
            )}
            {deleteCandidates.length > 1 && (
              <div>
                <p className="text-paragraph mb-1">同名の候補が{deleteCandidates.length}名います。対象を選択してください:</p>
                <div className="space-y-1">
                  {deleteCandidates.map(c => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-alert/10">
                      <input
                        type="radio"
                        name="delete-candidate"
                        checked={selectedCandidateId === c.id}
                        onChange={() => setSelectedCandidateId(c.id)}
                      />
                      <span>
                        {c.lastNameKanji || c.lastName} {c.firstNameKanji || c.firstName}
                        <span className="text-paragraph/60 ml-1">({c.className})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {current.status === 'confirmed' && current.result && (
          <div className="px-4 py-3 border-t border-paragraph/10">
            {!isRuleQuery && !isDeleteChild && !isAddRule && (
              <div className="flex gap-2 mb-2">
                <button
                  onClick={handleMarkForRecord}
                  className={`flex-1 py-1.5 px-2 text-xs rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    current.isMarkedForRecord
                      ? 'bg-button text-white'
                      : 'bg-secondary/30 text-headline hover:bg-secondary/50'
                  }`}
                >
                  <svg className="w-3 h-3" fill={current.isMarkedForRecord ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  {current.isMarkedForRecord ? '要録マーク済' : '要録用にマーク'}
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={confirmDisabled}
                className={`flex-1 py-2 px-3 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
                  isEmergency || isDeleteChild ? 'bg-alert' : 'bg-button'
                }`}
              >
                {isEmergency ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    緊急登録する
                  </span>
                ) : isDeleteChild
                  ? '対象を確認して削除へ'
                  : isAddRule
                  ? '内容を確認して保存'
                  : (config?.actionLabel ?? '確認')}
              </button>
              {!isRuleQuery && (
                <button
                  onClick={handleCancel}
                  className="py-2 px-3 bg-surface text-paragraph rounded-lg text-sm hover:bg-secondary/20 transition-colors"
                >
                  キャンセル
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
