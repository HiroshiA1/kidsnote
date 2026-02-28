'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { SmartInput, Attachment } from './SmartInput';
import { IntentResult, InputMessage, AddChildData, AddStaffData } from '@/types/intent';
import { Rule, RuleChatMessage } from '@/types/rule';
import { classifyInputAction } from '@/app/actions/classify';
import { askRulesAction } from '@/app/actions/rules-chat';
import { ChildWithGrowth, initialChildren, inferGradeFromClass, splitName, createBirthDate } from '@/lib/childrenStore';
import { ChildEntry } from '@/lib/anonymize';
import { sampleRules } from '@/lib/sampleRules';
import { saveToStorage, loadFromStorage, loadFromStorageAsync, STORAGE_KEYS } from '@/lib/storage';
import { recordActivity } from '@/lib/activityLog';
import { AttendanceRecord } from '@/types/document';
import { SchoolSettings, ClassInfo, defaultSchoolSettings, defaultClasses } from '@/types/settings';
import { ShiftPattern, ShiftAssignment, StaffAttendanceRecord } from '@/types/staffAttendance';
import { FloatingPopup } from './FloatingPopup';
import { AppRole } from '@/lib/supabase/auth';
import { recordAudit, auditCreate, auditUpdate, auditDelete } from '@/lib/audit';
import { ToastContainer, useToast, ToastMessage } from './Toast';
import { SAFETY_KEYWORDS } from '@/lib/safetyKeywords';

// 職員型
export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  role: '園長' | '主任' | '担任' | '副担任' | 'パート';
  classAssignment?: string;
  email?: string;
  phone?: string;
  hireDate: Date;
  qualifications: string[];
}

// 初期職員データ
const initialStaff: Staff[] = [
  { id: '1', firstName: '花子', lastName: '佐藤', role: '園長', email: 'sato@example.com', phone: '090-1111-1111', hireDate: new Date('2010-04-01'), qualifications: ['保育士', '幼稚園教諭一種'] },
  { id: '2', firstName: '太郎', lastName: '田中', role: '主任', classAssignment: 'さくら組', email: 'tanaka@example.com', phone: '090-2222-2222', hireDate: new Date('2015-04-01'), qualifications: ['保育士', '幼稚園教諭二種'] },
  { id: '3', firstName: '美咲', lastName: '鈴木', role: '担任', classAssignment: 'さくら組', email: 'suzuki@example.com', phone: '090-3333-3333', hireDate: new Date('2020-04-01'), qualifications: ['保育士'] },
  { id: '4', firstName: '健太', lastName: '山本', role: '担任', classAssignment: 'ひまわり組', email: 'yamamoto@example.com', phone: '090-4444-4444', hireDate: new Date('2021-04-01'), qualifications: ['保育士', '幼稚園教諭二種'] },
  { id: '5', firstName: '優子', lastName: '中村', role: '副担任', classAssignment: 'ひまわり組', email: 'nakamura@example.com', phone: '090-5555-5555', hireDate: new Date('2022-04-01'), qualifications: ['保育士'] },
  { id: '6', firstName: '和子', lastName: '小林', role: 'パート', email: 'kobayashi@example.com', hireDate: new Date('2023-04-01'), qualifications: ['保育士'] },
  { id: '7', firstName: '真理子', lastName: '高橋', role: '担任', classAssignment: 'たんぽぽ組', email: 'takahashi@example.com', phone: '090-7777-7777', hireDate: new Date('2018-04-01'), qualifications: ['保育士', '幼稚園教諭二種'] },
  { id: '8', firstName: '大輔', lastName: '渡辺', role: '担任', classAssignment: 'ひよこ組', email: 'watanabe@example.com', phone: '090-8888-8888', hireDate: new Date('2019-04-01'), qualifications: ['保育士'] },
  { id: '9', firstName: '恵子', lastName: '伊藤', role: '副担任', classAssignment: 'さくら組', email: 'ito@example.com', phone: '090-9999-9999', hireDate: new Date('2021-04-01'), qualifications: ['保育士'] },
  { id: '10', firstName: '裕介', lastName: '加藤', role: '担任', classAssignment: 'うさぎ組', email: 'kato@example.com', phone: '090-1010-1010', hireDate: new Date('2017-04-01'), qualifications: ['保育士', '幼稚園教諭一種'] },
  { id: '11', firstName: '千尋', lastName: '吉田', role: '副担任', classAssignment: 'たんぽぽ組', email: 'yoshida@example.com', phone: '090-1111-1100', hireDate: new Date('2022-04-01'), qualifications: ['保育士'] },
  { id: '12', firstName: '翔太', lastName: '松本', role: '担任', classAssignment: 'ゆり組', email: 'matsumoto@example.com', phone: '090-1212-1212', hireDate: new Date('2016-04-01'), qualifications: ['保育士', '幼稚園教諭二種'] },
  { id: '13', firstName: '美穂', lastName: '井上', role: '副担任', classAssignment: 'ゆり組', email: 'inoue@example.com', phone: '090-1313-1313', hireDate: new Date('2023-04-01'), qualifications: ['保育士'] },
  { id: '14', firstName: '直美', lastName: '木村', role: 'パート', email: 'kimura@example.com', phone: '090-1414-1414', hireDate: new Date('2024-04-01'), qualifications: ['保育士'] },
  { id: '15', firstName: '拓也', lastName: '林', role: '副担任', classAssignment: 'ひよこ組', email: 'hayashi@example.com', phone: '090-1515-1515', hireDate: new Date('2022-04-01'), qualifications: ['保育士'] },
  { id: '16', firstName: '由美', lastName: '清水', role: 'パート', email: 'shimizu@example.com', phone: '090-1616-1616', hireDate: new Date('2024-10-01'), qualifications: ['保育士'] },
];

interface AppContextType {
  messages: InputMessage[];
  addMessage: (content: string, attachments?: Attachment[]) => Promise<void>;
  confirmMessage: (id: string) => void;
  editMessage: (id: string, newIntent: IntentResult['intent']) => void;
  cancelMessage: (id: string) => void;
  markForRecord: (id: string) => void;
  isProcessing: boolean;
  sidebarCollapsed: boolean;
  children: ChildWithGrowth[];
  staff: Staff[];
  addChild: (child: ChildWithGrowth) => void;
  addStaff: (staff: Staff) => void;
  rules: Rule[];
  addRule: (rule: Rule) => void;
  updateRule: (rule: Rule) => void;
  deleteRule: (id: string) => void;
  ruleChatMessages: RuleChatMessage[];
  addRuleChatMessage: (message: RuleChatMessage) => void;
  clearRuleChat: () => void;
  attendance: AttendanceRecord[];
  setAttendance: (records: AttendanceRecord[]) => void;
  updateAttendance: (record: AttendanceRecord) => void;
  settings: SchoolSettings;
  updateSettings: (settings: SchoolSettings) => void;
  // シフト・出勤簿
  shiftPatterns: ShiftPattern[];
  setShiftPatterns: (patterns: ShiftPattern[]) => void;
  shiftAssignments: ShiftAssignment[];
  setShiftAssignments: (assignments: ShiftAssignment[]) => void;
  staffAttendance: StaffAttendanceRecord[];
  setStaffAttendance: (records: StaffAttendanceRecord[]) => void;
  updateStaffAttendance: (record: StaffAttendanceRecord) => void;
  currentStaffId: string | null;
  setCurrentStaffId: (id: string | null) => void;
  currentUserRole: AppRole | null;
  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppLayout');
  }
  return context;
}



export function AppLayout({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<InputMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [childrenData, setChildrenData] = useState<ChildWithGrowth[]>(initialChildren);
  const [staffData, setStaffData] = useState<Staff[]>(initialStaff);
  const [rules, setRules] = useState<Rule[]>(sampleRules);
  const [ruleChatMessages, setRuleChatMessages] = useState<RuleChatMessage[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [settingsData, setSettingsData] = useState<SchoolSettings>(defaultSchoolSettings);
  const [shiftPatterns, setShiftPatterns] = useState<ShiftPattern[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([]);
  const [staffAttendanceData, setStaffAttendanceData] = useState<StaffAttendanceRecord[]>([]);
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<AppRole | null>(null);
  const { toasts, addToast, dismissToast } = useToast();
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount (暗号化データは非同期で復号)
  useEffect(() => {
    const hydrateAsync = async () => {
      // 暗号化対象キーは非同期ロード
      const [loadedMessages, loadedChildren, loadedStaff, loadedAttendance, loadedStaffAttendance] = await Promise.all([
        loadFromStorageAsync<InputMessage[]>(STORAGE_KEYS.messages),
        loadFromStorageAsync<ChildWithGrowth[]>(STORAGE_KEYS.children),
        loadFromStorageAsync<Staff[]>(STORAGE_KEYS.staff),
        loadFromStorageAsync<AttendanceRecord[]>(STORAGE_KEYS.attendance),
        loadFromStorageAsync<StaffAttendanceRecord[]>(STORAGE_KEYS.staffAttendance),
      ]);

      setMessages(loadedMessages ?? []);
      setChildrenData(loadedChildren ?? initialChildren);
      setStaffData(loadedStaff ?? initialStaff);
      setAttendanceData(loadedAttendance ?? []);
      setStaffAttendanceData(loadedStaffAttendance ?? []);

      // 非暗号化キーは同期ロード
      setRules(loadFromStorage<Rule[]>(STORAGE_KEYS.rules) ?? sampleRules);
      const loadedSettings = loadFromStorage<SchoolSettings>(STORAGE_KEYS.settings) ?? defaultSchoolSettings;
      setSettingsData({ ...loadedSettings, classes: loadedSettings.classes ?? defaultClasses });
      setShiftPatterns(loadFromStorage<ShiftPattern[]>(STORAGE_KEYS.shiftPatterns) ?? []);
      setShiftAssignments(loadFromStorage<ShiftAssignment[]>(STORAGE_KEYS.shiftAssignments) ?? []);

      const savedStaffId = loadFromStorage<string>(STORAGE_KEYS.currentStaffId) ?? null;
      setCurrentStaffId(savedStaffId);

      // ロール推定: currentStaffId のスタッフロールから AppRole にマッピング
      const staffList = loadedStaff ?? initialStaff;
      if (savedStaffId) {
        const staff = staffList.find(s => s.id === savedStaffId);
        if (staff) {
          const roleMap: Record<string, AppRole> = {
            '園長': 'admin', '主任': 'manager', '担任': 'teacher', '副担任': 'teacher', 'パート': 'part_time',
          };
          setCurrentUserRole(roleMap[staff.role] ?? 'teacher');
        }
      }
      setDemoBannerDismissed(sessionStorage.getItem('kidsnote_demo_dismissed') === '1');
      setHydrated(true);
    };
    hydrateAsync();
  }, []);

  // Persist state changes to localStorage (only after hydration)
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.messages, messages); }, [messages, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.children, childrenData); }, [childrenData, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.staff, staffData); }, [staffData, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.rules, rules); }, [rules, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.attendance, attendanceData); }, [attendanceData, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.settings, settingsData); }, [settingsData, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.shiftPatterns, shiftPatterns); }, [shiftPatterns, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.shiftAssignments, shiftAssignments); }, [shiftAssignments, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.staffAttendance, staffAttendanceData); }, [staffAttendanceData, hydrated]);
  useEffect(() => {
    if (hydrated) {
      saveToStorage(STORAGE_KEYS.currentStaffId, currentStaffId);
      // ロール更新
      if (currentStaffId) {
        const staff = staffData.find(s => s.id === currentStaffId);
        if (staff) {
          const roleMap: Record<string, AppRole> = {
            '園長': 'admin', '主任': 'manager', '担任': 'teacher', '副担任': 'teacher', 'パート': 'part_time',
          };
          setCurrentUserRole(roleMap[staff.role] ?? 'teacher');
        }
      } else {
        setCurrentUserRole(null);
      }
    }
  }, [currentStaffId, hydrated, staffData]);

  const addChildToStore = (child: ChildWithGrowth) => {
    setChildrenData(prev => [...prev, child]);
    auditCreate('child', child.id, { name: `${child.lastName} ${child.firstName}` });
  };

  const addStaffToStore = (staff: Staff) => {
    setStaffData(prev => [...prev, staff]);
    auditCreate('staff', staff.id, { name: `${staff.lastName} ${staff.firstName}` });
  };

  const addRule = (rule: Rule) => {
    setRules(prev => [...prev, rule]);
    auditCreate('rule', rule.id, { title: rule.title });
  };

  const updateRule = (rule: Rule) => {
    setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
    auditUpdate('rule', rule.id, { title: rule.title });
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    auditDelete('rule', id);
  };

  const addRuleChatMessage = (message: RuleChatMessage) => {
    setRuleChatMessages(prev => [...prev, message]);

    // Activity log: rule_chat (only for assistant responses)
    if (message.role === 'assistant') {
      const lastUserMsg = ruleChatMessages.filter(m => m.role === 'user').pop();
      recordActivity('rule_chat', {
        question: lastUserMsg?.content ?? '',
        answer: message.content,
        referencedRuleIds: message.referencedRuleIds,
      });
    }
  };

  const clearRuleChat = () => {
    setRuleChatMessages([]);
  };

  const updateAttendance = (record: AttendanceRecord) => {
    setAttendanceData(prev => {
      const idx = prev.findIndex(
        r => r.childId === record.childId && r.year === record.year && r.month === record.month && r.day === record.day
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = record;
        return next;
      }
      return [...prev, record];
    });
  };

  const updateStaffAttendance = (record: StaffAttendanceRecord) => {
    setStaffAttendanceData(prev => {
      const idx = prev.findIndex(
        r => r.staffId === record.staffId && r.year === record.year && r.month === record.month && r.day === record.day
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = record;
        return next;
      }
      return [...prev, record];
    });
  };

  /** 匿名化用: 園児情報を ChildEntry 形式で収集（ID付き） */
  const collectChildEntries = (): ChildEntry[] =>
    childrenData.map(c => ({
      id: c.id,
      names: [
        c.firstName, c.lastName,
        c.firstNameKanji, c.lastNameKanji,
        `${c.lastName}${c.firstName}`.trim(),
        `${c.lastNameKanji ?? ''}${c.firstNameKanji ?? ''}`.trim(),
      ].filter((n): n is string => !!n && n.length >= 2),
    }));

  /** 匿名化用: 職員名（園児ID紐付けなし） */
  const collectExtraNames = (): string[] => {
    const names: string[] = [];
    for (const s of staffData) {
      if (s.firstName && s.firstName.length >= 2) names.push(s.firstName);
      if (s.lastName && s.lastName.length >= 2) names.push(s.lastName);
    }
    return [...new Set(names)];
  };

  const addMessage = async (text: string, attachments?: Attachment[]) => {
    const newMessage: InputMessage = {
      id: crypto.randomUUID(),
      content: text,
      timestamp: new Date(),
      status: 'processing',
    };

    setMessages(prev => [newMessage, ...prev]);
    setIsProcessing(true);

    const { intent: result, matchedChildIds } = await classifyInputAction(
      text,
      collectChildEntries(),
      collectExtraNames(),
    );

    // 匿名化時に検出された園児IDを使用（AI出力に依存しない確実な紐付け）
    const linkedChildIds = matchedChildIds;

    // ルール質問の場合はルールチャットAPIへ転送
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
      // 高confidence + 安全語なし → 自動保存 + 取消トースト
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

    // Activity log: classify
    if (result) {
      recordActivity('classify', {
        inputText: text,
        intent: result.intent,
        confidence: result.confidence,
      });
    }
  };

  const confirmMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);

    if (message?.result) {
      // 園児追加の場合
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
          emergencyContact: {
            name: '',
            phone: '',
            relationship: '',
          },
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

      // 職員追加の場合
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

    // Activity log: confirm
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
  };

  const editMessage = (messageId: string, newIntent: IntentResult['intent']) => {
    const existing = messages.find(m => m.id === messageId);
    recordActivity('classify_edit', {
      messageId,
      oldIntent: existing?.result?.intent ?? 'unknown',
      newIntent,
    });

    setMessages(prev =>
      prev.map(msg => {
        if (msg.id !== messageId || !msg.result) return msg;
        return {
          ...msg,
          result: { ...msg.result, intent: newIntent },
        };
      })
    );
  };

  const cancelMessage = (messageId: string) => {
    recordActivity('classify_cancel', { messageId });
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const markForRecord = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, isMarkedForRecord: !msg.isMarkedForRecord }
          : msg
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        messages,
        addMessage,
        confirmMessage,
        editMessage,
        cancelMessage,
        markForRecord,
        isProcessing,
        sidebarCollapsed,
        children: childrenData,
        staff: staffData,
        addChild: addChildToStore,
        addStaff: addStaffToStore,
        rules,
        addRule,
        updateRule,
        deleteRule,
        ruleChatMessages,
        addRuleChatMessage,
        clearRuleChat,
        attendance: attendanceData,
        setAttendance: setAttendanceData,
        updateAttendance,
        settings: settingsData,
        updateSettings: setSettingsData,
        shiftPatterns,
        setShiftPatterns,
        shiftAssignments,
        setShiftAssignments,
        staffAttendance: staffAttendanceData,
        setStaffAttendance: setStaffAttendanceData,
        updateStaffAttendance,
        currentStaffId,
        setCurrentStaffId,
        currentUserRole,
        addToast,
      }}
    >
      <div className="flex min-h-screen bg-background">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className={`flex-1 pb-32 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          {!demoBannerDismissed && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-sm text-amber-800">
              <span>デモモード — データはブラウザに保存されます。本番環境ではありません</span>
              <button
                onClick={() => {
                  setDemoBannerDismissed(true);
                  sessionStorage.setItem('kidsnote_demo_dismissed', '1');
                }}
                className="ml-4 text-amber-600 hover:text-amber-900 font-bold"
                aria-label="閉じる"
              >
                &times;
              </button>
            </div>
          )}
          {children}
        </main>
        <FloatingPopup sidebarCollapsed={sidebarCollapsed} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <SmartInput onSubmit={addMessage} isProcessing={isProcessing} sidebarCollapsed={sidebarCollapsed} />
      </div>
    </AppContext.Provider>
  );
}
