import { useState, useCallback } from 'react';
import { IntentResult, InputMessage, AddChildData, AddStaffData } from '@/types/intent';
import { Rule } from '@/types/rule';
import { classifyInputAction } from '@/app/actions/classify';
import { askRulesAction } from '@/app/actions/rules-chat';
import { ChildWithGrowth, splitName, inferGradeFromClass, createBirthDate } from '@/lib/childrenStore';
import { ChildEntry } from '@/lib/anonymize';
import { recordActivity } from '@/lib/activityLog';
import { recordAudit } from '@/lib/audit';
import { SAFETY_KEYWORDS } from '@/lib/safetyKeywords';
import type { Staff } from '@/components/AppLayout';
import type { Attachment } from '@/components/SmartInput';

interface UseMessageControllerArgs {
  messages: InputMessage[];
  setMessages: React.Dispatch<React.SetStateAction<InputMessage[]>>;
  childrenData: ChildWithGrowth[];
  staffData: Staff[];
  rules: Rule[];
  addChildToStore: (child: ChildWithGrowth) => void;
  addStaffToStore: (staff: Staff) => void;
  addToast: (toast: { message: string; type: 'success' | 'error' | 'info'; action?: { label: string; onClick: () => void }; duration?: number }) => string;
  selectedChildId?: string | null;
}

/** 選択中の園児のコンテキストをGemini用テキストに付与 */
function buildChildContext(child: ChildWithGrowth): string {
  const name = `${child.lastNameKanji || child.lastName} ${child.firstNameKanji || child.firstName}`.trim();
  const parts = [`[対象園児: ${name}`, `${child.className}`, `${child.grade}`];
  if (child.allergies.length > 0) parts.push(`アレルギー: ${child.allergies.join('・')}`);
  if (child.characteristics.length > 0) parts.push(`特徴: ${child.characteristics.join('・')}`);
  if (child.interests && child.interests.length > 0) parts.push(`興味: ${child.interests.join('・')}`);
  return parts.join(' / ') + '] ';
}

export function useMessageController({
  messages,
  setMessages,
  childrenData,
  staffData,
  rules,
  addChildToStore,
  addStaffToStore,
  addToast,
  selectedChildId,
}: UseMessageControllerArgs) {
  const [isProcessing, setIsProcessing] = useState(false);

  const collectChildEntries = useCallback((): ChildEntry[] =>
    childrenData.map(c => ({
      id: c.id,
      names: [
        c.firstName, c.lastName,
        c.firstNameKanji, c.lastNameKanji,
        `${c.lastName}${c.firstName}`.trim(),
        `${c.lastNameKanji ?? ''}${c.firstNameKanji ?? ''}`.trim(),
      ].filter((n): n is string => !!n && n.length >= 2),
    })), [childrenData]);

  const collectExtraNames = useCallback((): string[] => {
    const names: string[] = [];
    for (const s of staffData) {
      if (s.firstName && s.firstName.length >= 2) names.push(s.firstName);
      if (s.lastName && s.lastName.length >= 2) names.push(s.lastName);
    }
    return [...new Set(names)];
  }, [staffData]);

  const addMessage = useCallback(async (text: string, _attachments?: Attachment[]) => {
    const newMessage: InputMessage = {
      id: crypto.randomUUID(),
      content: text,
      timestamp: new Date(),
      status: 'processing',
    };

    setMessages(prev => [newMessage, ...prev]);
    setIsProcessing(true);

    // 選択中の園児がいればコンテキストを付与してGeminiに送信
    const selectedChild = selectedChildId ? childrenData.find(c => c.id === selectedChildId) : null;
    const classifyText = selectedChild ? buildChildContext(selectedChild) + text : text;

    const { intent: result, matchedChildIds } = await classifyInputAction(
      classifyText,
      collectChildEntries(),
      collectExtraNames(),
    );

    // selectedChildIdがある場合、matchedChildIdsにマージ
    const linkedChildIds = selectedChildId && !matchedChildIds.includes(selectedChildId)
      ? [selectedChildId, ...matchedChildIds]
      : matchedChildIds;

    if (result?.intent === 'rule_query') {
      const rulesContext = rules.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content,
        category: r.category,
      }));

      try {
        const ruleResult = await askRulesAction(
          text,
          rulesContext,
          undefined,
          collectChildEntries(),
          collectExtraNames()
        );
        setMessages(prev =>
          prev.map(msg =>
            msg.id === newMessage.id
              ? { ...msg, result, status: 'confirmed', linkedChildIds, ruleAnswer: ruleResult }
              : msg
          )
        );
      } catch {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === newMessage.id
              ? {
                ...msg,
                result,
                status: 'confirmed',
                linkedChildIds,
                ruleAnswer: { answer: 'エラーが発生しました。もう一度お試しください。', referencedRuleIds: [] },
              }
              : msg
          )
        );
      }
    } else {
      const hasSafetyHit = SAFETY_KEYWORDS.some(kw => text.includes(kw));
      const isHighConfidence = result?.confidence !== undefined && result.confidence >= 0.9;
      const shouldAutoSave = isHighConfidence && !hasSafetyHit && result?.intent !== 'add_child' && result?.intent !== 'add_staff';

      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id
            ? { ...msg, result, status: shouldAutoSave ? 'saved' : 'confirmed', linkedChildIds }
            : msg
        )
      );

      if (shouldAutoSave && result) {
        const intentLabels: Record<string, string> = {
          growth: '成長記録', incident: 'ヒヤリハット', handover: '申し送り', child_update: '園児情報更新',
        };
        addToast({
          message: `${intentLabels[result.intent] ?? result.intent}として自動保存しました`,
          type: 'success',
          action: {
            label: '取り消す',
            onClick: () => {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === newMessage.id ? { ...msg, status: 'confirmed' } : msg
                )
              );
            },
          },
          duration: 6000,
        });
      }
    }
    setIsProcessing(false);

    if (result) {
      recordActivity('classify', {
        inputText: text,
        intent: result.intent,
        confidence: result.confidence,
      });
    }
  }, [setMessages, collectChildEntries, collectExtraNames, rules, addToast, selectedChildId, childrenData]);

  const confirmMessage = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);

    if (message?.result) {
      if (message.result.intent === 'add_child') {
        const data = message.result.data as AddChildData;
        const rawData = message.result.data as unknown as Record<string, unknown>;
        const name = data.name || (rawData.child_name as string) || '不明';
        const nameParts = splitName(name);
        const newChild: ChildWithGrowth = {
          id: crypto.randomUUID(),
          firstName: nameParts.firstName || nameParts.firstNameKanji || '',
          lastName: nameParts.lastName || nameParts.lastNameKanji || '',
          firstNameKanji: nameParts.firstNameKanji,
          lastNameKanji: nameParts.lastNameKanji,
          birthDate: createBirthDate(data.birth_date),
          classId: data.class_name?.replace('組', '') || 'unknown',
          className: data.class_name || '未定',
          grade: data.class_name ? inferGradeFromClass(data.class_name) : '年中',
          gender: data.gender || 'other',
          allergies: data.allergies || [],
          characteristics: [],
          emergencyContact: { name: '', phone: '', relationship: '' },
          createdAt: new Date(),
          updatedAt: new Date(),
          growthLevels: [
            { domain: 'health', level: 1, lastUpdated: new Date(), linkedEpisodeIds: [] },
            { domain: 'relationships', level: 1, lastUpdated: new Date(), linkedEpisodeIds: [] },
            { domain: 'environment', level: 1, lastUpdated: new Date(), linkedEpisodeIds: [] },
            { domain: 'language', level: 1, lastUpdated: new Date(), linkedEpisodeIds: [] },
            { domain: 'expression', level: 1, lastUpdated: new Date(), linkedEpisodeIds: [] },
          ],
        };
        addChildToStore(newChild);
      }

      if (message.result.intent === 'add_staff') {
        const data = message.result.data as AddStaffData;
        const rawData = message.result.data as unknown as Record<string, unknown>;
        const name = data.name || (rawData.staff_name as string) || '不明';
        const nameParts = splitName(name);
        const newStaff: Staff = {
          id: crypto.randomUUID(),
          firstName: nameParts.firstName || nameParts.firstNameKanji || '',
          lastName: nameParts.lastName || nameParts.lastNameKanji || '',
          role: (data.role as Staff['role']) || '担任',
          classAssignment: data.class_name,
          phone: data.contact,
          hireDate: new Date(),
          qualifications: ['保育士'],
        };
        addStaffToStore(newStaff);
      }
    }

    recordActivity('classify_confirm', { messageId });
    recordAudit({
      event_type: 'message.confirm',
      target_type: 'message',
      target_id: messageId,
      payload: { intent: message?.result?.intent },
    });

    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, status: 'saved' } : msg
      )
    );
  }, [messages, setMessages, addChildToStore, addStaffToStore]);

  const editMessage = useCallback((messageId: string, newIntent: IntentResult['intent']) => {
    const existing = messages.find(m => m.id === messageId);
    recordActivity('classify_edit', {
      messageId,
      oldIntent: existing?.result?.intent ?? 'unknown',
      newIntent,
    });

    setMessages(prev =>
      prev.map(msg => {
        if (msg.id !== messageId || !msg.result) return msg;
        return { ...msg, result: { ...msg.result, intent: newIntent } };
      })
    );
  }, [messages, setMessages]);

  const cancelMessage = useCallback((messageId: string) => {
    recordActivity('classify_cancel', { messageId });
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, [setMessages]);

  const markForRecord = useCallback((messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, isMarkedForRecord: !msg.isMarkedForRecord }
          : msg
      )
    );
  }, [setMessages]);

  return {
    isProcessing,
    addMessage,
    confirmMessage,
    editMessage,
    cancelMessage,
    markForRecord,
  };
}
