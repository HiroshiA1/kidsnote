'use client';

import { useState, useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { SmartInput, Attachment } from './SmartInput';
import { IntentResult, InputMessage } from '@/types/intent';
import { Rule, RuleChatMessage } from '@/types/rule';
import { ChildWithGrowth } from '@/lib/childrenStore';
import { AttendanceRecord } from '@/types/document';
import { SchoolSettings } from '@/types/settings';
import { ShiftPattern, ShiftAssignment, StaffAttendanceRecord } from '@/types/staffAttendance';
import { CalendarEvent, SupportAssignment } from '@/types/calendar';
import { CurriculumPlan, DailyReflection, ChildDailyReflection } from '@/types/carePlan';
import { NewYearSetup } from '@/types/newYearSetup';
import { FloatingPopup } from './FloatingPopup';
import { AppRole } from '@/lib/supabase/auth';
import { auditCreate, auditUpdate, auditDelete } from '@/lib/audit';
import { ToastContainer, useToast, ToastMessage } from './Toast';
import { ConfirmDialogContainer, useConfirm, ConfirmOptions } from './ConfirmDialog';
import { RuleModal, RuleSavePayload } from './RuleModal';
import { Breadcrumbs } from './Breadcrumbs';
import { CalendarEventModal } from './CalendarEventModal';
import { getJstDateString } from '@/lib/localDate';
import { recordActivity } from '@/lib/activityLog';
import { useHydration, staffRoleMap } from '@/hooks/useHydration';
import { useMessageController } from '@/hooks/useMessageController';
import { useSupabaseStaff } from '@/hooks/useSupabaseStaff';

// 職員型
export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  classAssignment?: string;
  email?: string;
  phone?: string;
  hireDate: Date;
  qualifications: string[];
  /**
   * ログイン用アカウント(Supabase auth user + memberships 行)の有無。
   * API 側で memberships の存在 join で判定して返すので、UI 型では真実値に一致する。
   * ※旧フィールド `accountCreated` / `accountEmail` は local 書き換えで嘘表示が起きていたため廃止。
   *    アカウントのメールアドレスは `email` を ログインID と同一運用する前提で staff.email に寄せる。
   */
  hasAccount?: boolean;
  /** 退職日時。`undefined` なら在職中。園児の archivedAt と同じ思想 */
  archivedAt?: Date;
  /** 退職理由 (任意)。退職処理時に管理者が自由入力 */
  archiveReason?: string;
}

/** staff データの取得状態。ログイン状態・Supabase 接続状況に応じて画面描画を分岐させるため Context に公開する */
export type StaffStatus = 'loading' | 'ready' | 'error' | 'unauthenticated';

/** サイドバーの配置。利き手に応じて個人別に記憶する */
export type SidebarPosition = 'left' | 'right';

interface AppContextType {
  messages: InputMessage[];
  addMessage: (content: string, attachments?: Attachment[], options?: { emergency?: boolean }) => Promise<void>;
  confirmMessage: (id: string) => void;
  editMessage: (id: string, newIntent: IntentResult['intent']) => void;
  cancelMessage: (id: string) => void;
  markForRecord: (id: string) => void;
  isProcessing: boolean;
  sidebarCollapsed: boolean;
  /** サイドバーの配置 (左/右)。スタッフ別 localStorage に永続化 */
  sidebarPosition: SidebarPosition;
  setSidebarPosition: (pos: SidebarPosition) => void;
  children: ChildWithGrowth[];
  /**
   * canonical staff リスト。Supabase が唯一の source of truth。
   * loading / unauthenticated / error 時は空配列を返す(他画面での null チェック不要)。
   * staff 画面自体は `staffStatus` を参照して loading/error/unauthenticated を描画分岐する。
   */
  staff: Staff[];
  /** staff 取得状態 */
  staffStatus: StaffStatus;
  /** staff 再取得 (StaffCreateModal 等、mutation 成功後に呼ぶ) */
  refetchStaff: () => Promise<void>;
  addChild: (child: ChildWithGrowth) => void;
  updateChild: (child: ChildWithGrowth) => void;
  /** 物理削除(復元不可)。管理者のみ。通常操作は archiveChild を推奨 */
  removeChild: (id: string) => void;
  /** 退園(ソフト削除)。archivedAt をセット、復元可能 */
  archiveChild: (id: string, reason?: string) => void;
  /** 退園取消(復元)。archivedAt をクリア */
  restoreChild: (id: string) => void;
  fiscalYear: number;
  setFiscalYear: (y: number) => void;
  /**
   * PATCH /api/staff/[id] を呼び、成功時に local state を差し替える。
   * 失敗時は例外を throw するので呼び出し側で toast 等を出す。
   */
  updateStaff: (staff: Staff) => Promise<void>;
  /**
   * 既存 staff に auth user + membership を後付けで作成する。
   * 成功時に refetchStaff で hasAccount を最新化。失敗時は例外を throw。
   */
  createStaffAccount: (staffId: string, email: string, password: string) => Promise<void>;
  /**
   * スタッフの退職処理 (ソフト削除)。membership 削除 + archived_at セット。
   * 失敗時は例外を throw。成功時は refetch して在職リストから外す。
   */
  archiveStaff: (staffId: string, reason?: string) => Promise<void>;
  /**
   * 退職処理の取り消し (archived_at クリア)。
   * 失敗時は例外を throw。
   */
  restoreStaff: (staffId: string) => Promise<void>;
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => void;
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
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
  /** AI提案ルールの編集モーダルを開くためのstate(FloatingPopupがセット、AppLayoutがレンダリング) */
  pendingAiRule: { sourceMessageId: string; draft: Partial<Rule>; updateTargetId?: string } | null;
  setPendingAiRule: (value: { sourceMessageId: string; draft: Partial<Rule>; updateTargetId?: string } | null) => void;
  /** AI提案予定の編集モーダルを開くためのstate */
  pendingAiCalendarEvent: { sourceMessageId: string; draft: Partial<CalendarEvent> } | null;
  setPendingAiCalendarEvent: (value: { sourceMessageId: string; draft: Partial<CalendarEvent> } | null) => void;
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: CalendarEvent) => void;
  updateCalendarEvent: (event: CalendarEvent) => void;
  deleteCalendarEvent: (id: string) => void;
  supportAssignments: SupportAssignment[];
  addSupportAssignment: (assignment: SupportAssignment) => void;
  updateSupportAssignment: (assignment: SupportAssignment) => void;
  deleteSupportAssignment: (id: string) => void;
  curriculumPlans: CurriculumPlan[];
  addCurriculumPlan: (plan: CurriculumPlan) => void;
  updateCurriculumPlan: (plan: CurriculumPlan) => void;
  deleteCurriculumPlan: (id: string) => void;
  dailyReflections: DailyReflection[];
  addDailyReflection: (r: DailyReflection) => void;
  updateDailyReflection: (r: DailyReflection) => void;
  childDailyReflections: ChildDailyReflection[];
  addChildDailyReflection: (r: ChildDailyReflection) => void;
  updateChildDailyReflection: (r: ChildDailyReflection) => void;
  newYearSetup: NewYearSetup | null;
  setNewYearSetup: (setup: NewYearSetup | null) => void;
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
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { toasts, addToast, dismissToast } = useToast();
  const { openConfirm, pending: confirmPending, resolveConfirm } = useConfirm();

  const {
    messages, setMessages,
    childrenData, setChildrenData,
    rules, setRules,
    attendanceData, setAttendanceData,
    settingsData, setSettingsData,
    shiftPatterns, setShiftPatterns,
    shiftAssignments, setShiftAssignments,
    staffAttendanceData, setStaffAttendanceData,
    currentStaffId, setCurrentStaffId,
    fiscalYear, setFiscalYear,
    calendarEvents, setCalendarEvents,
    supportAssignments, setSupportAssignments,
    curriculumPlans, setCurriculumPlans,
    dailyReflections, setDailyReflections,
    childDailyReflections, setChildDailyReflections,
    newYearSetup, setNewYearSetup,
  } = useHydration();

  // staff は Supabase canonical。画面は staffStatus で描画分岐する
  const { staff: supabaseStaff, status: staffStatus, refetch: refetchStaff } = useSupabaseStaff();

  // currentUserRole は Supabase staff 取得後に currentStaffId から導出する。
  // currentStaffId が Supabase に存在しなければ null にクリアして stale 値を残さない。
  const [currentUserRole, setCurrentUserRole] = useState<AppRole | null>(null);
  useEffect(() => {
    if (staffStatus !== 'ready' || !supabaseStaff) {
      return; // 取得前は role 不定
    }
    if (!currentStaffId) {
      setCurrentUserRole(null);
      return;
    }
    const self = supabaseStaff.find(s => s.id === currentStaffId);
    if (!self) {
      // DB 側で staff が消えた/異組織の staffId が localStorage に残っている
      setCurrentStaffId(null);
      setCurrentUserRole(null);
      return;
    }
    setCurrentUserRole(staffRoleMap[self.role] ?? 'teacher');
  }, [staffStatus, supabaseStaff, currentStaffId, setCurrentStaffId]);

  const addCalendarEvent = (event: CalendarEvent) => {
    setCalendarEvents(prev => [...prev, event]);
    auditCreate('calendar_event', event.id, { title: event.title });
  };
  const updateCalendarEvent = (event: CalendarEvent) => {
    setCalendarEvents(prev => prev.map(e => e.id === event.id ? event : e));
    auditUpdate('calendar_event', event.id, { title: event.title });
  };
  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
    auditDelete('calendar_event', id);
  };

  const addSupportAssignment = (assignment: SupportAssignment) => {
    setSupportAssignments(prev => [...prev, assignment]);
    auditCreate('support_assignment', assignment.id, { staffId: assignment.staffId });
  };
  const updateSupportAssignment = (assignment: SupportAssignment) => {
    setSupportAssignments(prev => prev.map(a => a.id === assignment.id ? assignment : a));
    auditUpdate('support_assignment', assignment.id, { staffId: assignment.staffId });
  };
  const deleteSupportAssignment = (id: string) => {
    setSupportAssignments(prev => prev.filter(a => a.id !== id));
    auditDelete('support_assignment', id);
  };

  const addCurriculumPlan = (plan: CurriculumPlan) => {
    setCurriculumPlans(prev => [...prev, plan]);
    auditCreate('curriculum_plan', plan.id, { title: plan.title });
  };
  const updateCurriculumPlan = (plan: CurriculumPlan) => {
    setCurriculumPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
    auditUpdate('curriculum_plan', plan.id, { title: plan.title });
  };
  const deleteCurriculumPlan = (id: string) => {
    setCurriculumPlans(prev => prev.filter(p => p.id !== id));
    auditDelete('curriculum_plan', id);
  };

  const addDailyReflection = (r: DailyReflection) => {
    setDailyReflections(prev => [...prev, r]);
  };
  const updateDailyReflection = (r: DailyReflection) => {
    setDailyReflections(prev => prev.map(x => x.id === r.id ? r : x));
  };

  const addChildDailyReflection = (r: ChildDailyReflection) => {
    setChildDailyReflections(prev => [...prev, r]);
  };
  const updateChildDailyReflection = (r: ChildDailyReflection) => {
    setChildDailyReflections(prev => prev.map(x => x.id === r.id ? r : x));
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // クライアント初回 render から正しい配置を出すため、pre-hydration script が設定した
  // <html data-sidebar> を lazy init で読み取る。SSR 上は 'left' を返し、
  // mismatch するのは保存済み右配置ユーザーのみ (pre-hydration script で data-sidebar は既に right)。
  const [sidebarPosition, setSidebarPositionState] = useState<SidebarPosition>(() => {
    if (typeof document === 'undefined') return 'left';
    return document.documentElement.getAttribute('data-sidebar') === 'right' ? 'right' : 'left';
  });

  // スタッフ別キー。staffId が無い場合(未ログイン等)は共有キー 'default' を使う
  const sidebarPositionKey = useCallback((staffId: string | null) => {
    return `kidsnote:sidebar-position:${staffId ?? 'default'}`;
  }, []);

  // currentStaffId が変わるたび (= スタッフ切替) に保存値を読み直す。
  // data-sidebar 属性も同期し、CSS/デバッグで位置を識別できるようにする。
  // 失敗時も data-sidebar と state を揃える(stale な属性が残らないようにする)。
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let next: SidebarPosition = 'left';
    try {
      const raw = window.localStorage.getItem(sidebarPositionKey(currentStaffId));
      if (raw === 'right') next = 'right';
      else if (raw !== 'left') {
        // staff 別キーが無いときのフォールバック
        const fallback = window.localStorage.getItem(sidebarPositionKey(null));
        if (fallback === 'right') next = 'right';
      }
    } catch {
      next = 'left';
    }
    setSidebarPositionState(next);
    document.documentElement.setAttribute('data-sidebar', next);
  }, [currentStaffId, sidebarPositionKey]);

  const setSidebarPosition = useCallback(
    (pos: SidebarPosition) => {
      setSidebarPositionState(pos);
      try {
        window.localStorage.setItem(sidebarPositionKey(currentStaffId), pos);
      } catch {
        // localStorage 失敗は UI 上は無視 (state 更新のみ)
      }
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-sidebar', pos);
      }
    },
    [currentStaffId, sidebarPositionKey],
  );

  const [ruleChatMessages, setRuleChatMessages] = useState<RuleChatMessage[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [pendingAiRule, setPendingAiRule] = useState<{ sourceMessageId: string; draft: Partial<Rule>; updateTargetId?: string } | null>(null);
  const [pendingAiCalendarEvent, setPendingAiCalendarEvent] = useState<{ sourceMessageId: string; draft: Partial<CalendarEvent> } | null>(null);

  const addChildToStore = (child: ChildWithGrowth) => {
    setChildrenData(prev => [...prev, child]);
    auditCreate('child', child.id, { name: `${child.lastName} ${child.firstName}` });
  };

  const updateChildInStore = (child: ChildWithGrowth) => {
    setChildrenData(prev => prev.map(c => c.id === child.id ? child : c));
    auditUpdate('child', child.id, { name: `${child.lastName} ${child.firstName}` });
  };

  /** 物理削除(復元不可)。管理者のみ使用を想定、通常は archiveChild を使う */
  const removeChildFromStore = (id: string) => {
    setChildrenData(prev => prev.filter(c => c.id !== id));
    auditDelete('child', id);
  };

  /** 退園(アーカイブ)。archivedAt をセットするだけでデータ自体は保持 */
  const archiveChild = (id: string, reason?: string) => {
    setChildrenData(prev =>
      prev.map(c =>
        c.id === id ? { ...c, archivedAt: new Date(), archiveReason: reason, updatedAt: new Date() } : c,
      ),
    );
    auditUpdate('child', id, { action: 'archive', reason: reason ?? null });
  };

  /** 復元(退園取消)。archivedAt を消す */
  const restoreChild = (id: string) => {
    setChildrenData(prev =>
      prev.map(c => {
        if (c.id !== id) return c;
        // undefined を入れるとオブジェクトに残るため、copy から外す
        const { archivedAt: _archivedAt, archiveReason: _reason, ...rest } = c;
        void _archivedAt;
        void _reason;
        return { ...rest, updatedAt: new Date() } as ChildWithGrowth;
      }),
    );
    auditUpdate('child', id, { action: 'restore' });
  };

  /**
   * AI 経由の staff 追加 (add_staff intent) は一旦無効化。
   * Supabase staff 一元化の移行期間中、local state への擬似追加はデータ整合性を
   * 壊すため行わない。正規ルートは職員一覧の StaffCreateModal (auth+membership 含む)。
   */
  const addStaffToStore = useCallback(
    (staff: Staff) => {
      addToast({
        type: 'error',
        message: `AI経由のスタッフ追加(${staff.lastName} ${staff.firstName})は現在停止中です。職員一覧から手動で追加してください。`,
      });
    },
    [addToast],
  );

  /** POST /api/staff/[id]/account 経由で既存 staff にアカウントを後付けする */
  const createStaffAccount = useCallback(
    async (staffId: string, email: string, password: string) => {
      const res = await fetch(`/api/staff/${staffId}/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? 'アカウント作成に失敗しました');
      }
      await refetchStaff();
      auditCreate('staff_account', staffId, { email });
    },
    [refetchStaff],
  );

  /** DELETE /api/staff/[id] 経由でスタッフを退職処理 (ソフト削除) */
  const archiveStaff = useCallback(
    async (staffId: string, reason?: string) => {
      const res = await fetch(`/api/staff/${staffId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason ?? null }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? '退職処理に失敗しました');
      }
      await refetchStaff();
      auditUpdate('staff', staffId, { action: 'archive', reason: reason ?? null });
    },
    [refetchStaff],
  );

  /** POST /api/staff/[id]/restore 経由で退職処理を取り消す */
  const restoreStaff = useCallback(
    async (staffId: string) => {
      const res = await fetch(`/api/staff/${staffId}/restore`, { method: 'POST' });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? '復職処理に失敗しました');
      }
      await refetchStaff();
      auditUpdate('staff', staffId, { action: 'restore' });
    },
    [refetchStaff],
  );

  /** PATCH /api/staff/[id] 経由で staff を更新し、成功で refetch する */
  const updateStaff = useCallback(
    async (staff: Staff) => {
      const hireDateStr = staff.hireDate
        ? new Date(staff.hireDate).toISOString().slice(0, 10)
        : null;
      const res = await fetch(`/api/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: staff.firstName,
          lastName: staff.lastName,
          role: staff.role,
          classAssignment: staff.classAssignment ?? null,
          email: staff.email ?? null,
          phone: staff.phone ?? null,
          hireDate: hireDateStr,
          qualifications: staff.qualifications,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? '更新に失敗しました');
      }
      await refetchStaff();
      auditUpdate('staff', staff.id, { name: `${staff.lastName} ${staff.firstName}` });
    },
    [refetchStaff],
  );

  const { isProcessing, addMessage, confirmMessage, editMessage, cancelMessage, markForRecord } =
    useMessageController({
      messages,
      setMessages,
      childrenData,
      // staff 取得前 (loading/unauthenticated/error) は空配列扱い。名前マッチ用の補助データのため支障なし
      staffData: supabaseStaff ?? [],
      rules,
      addChildToStore,
      addStaffToStore,
      addToast,
      selectedChildId,
    });

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
    if (message.role === 'assistant') {
      const lastUserMsg = ruleChatMessages.filter(m => m.role === 'user').pop();
      recordActivity('rule_chat', {
        question: lastUserMsg?.content ?? '',
        answer: message.content,
        referencedRuleIds: message.referencedRuleIds,
      });
    }
  };

  const clearRuleChat = () => setRuleChatMessages([]);

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
        sidebarPosition,
        setSidebarPosition,
        children: childrenData,
        // loading 中は空配列 fallback。staff 画面は staffStatus で明示的に分岐する。
        staff: supabaseStaff ?? [],
        staffStatus,
        refetchStaff,
        addChild: addChildToStore,
        updateChild: updateChildInStore,
        removeChild: removeChildFromStore,
        archiveChild,
        restoreChild,
        fiscalYear,
        setFiscalYear,
        updateStaff,
        createStaffAccount,
        archiveStaff,
        restoreStaff,
        selectedChildId,
        setSelectedChildId,
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
        openConfirm,
        pendingAiRule,
        setPendingAiRule,
        pendingAiCalendarEvent,
        setPendingAiCalendarEvent,
        calendarEvents,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        supportAssignments,
        addSupportAssignment,
        updateSupportAssignment,
        deleteSupportAssignment,
        curriculumPlans,
        addCurriculumPlan,
        updateCurriculumPlan,
        deleteCurriculumPlan,
        dailyReflections,
        addDailyReflection,
        updateDailyReflection,
        childDailyReflections,
        addChildDailyReflection,
        updateChildDailyReflection,
        newYearSetup,
        setNewYearSetup,
      }}
    >
      <div className="flex min-h-screen bg-background">
        {!isLoginPage && (
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />
        )}
        <main
          className={`flex-1 ${isLoginPage ? '' : 'pb-32'} transition-all duration-300 ${
            isLoginPage
              ? ''
              : sidebarPosition === 'right'
                ? sidebarCollapsed
                  ? 'md:mr-16'
                  : 'md:mr-64'
                : sidebarCollapsed
                  ? 'md:ml-16'
                  : 'md:ml-64'
          }`}
        >
          {/* モバイルヘッダー（ハンバーガー） */}
          {!isLoginPage && (
            <div className="flex items-center gap-3 px-3 py-2 bg-surface border-b border-secondary/20 md:hidden">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-secondary/20 text-paragraph"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="w-7 h-7 bg-gradient-to-br from-button to-tertiary rounded-lg flex items-center justify-center text-white text-xs font-bold">
                K
              </span>
              <span className="text-sm font-bold text-headline">KidsNote</span>
            </div>
          )}
          {!isLoginPage && <Breadcrumbs />}
          {children}
        </main>
        {!isLoginPage && <FloatingPopup />}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <ConfirmDialogContainer pending={confirmPending} onResolve={resolveConfirm} />
        {pendingAiRule && (
          <RuleModal
            rule={pendingAiRule.updateTargetId ? { id: pendingAiRule.updateTargetId, ...pendingAiRule.draft } : pendingAiRule.draft}
            aiSuggested
            onSave={(payload: RuleSavePayload) => {
              if (pendingAiRule.updateTargetId) {
                // 更新パス
                const existing = rules.find(r => r.id === pendingAiRule.updateTargetId);
                if (existing) {
                  updateRule({
                    ...existing,
                    title: payload.title,
                    content: payload.content,
                    category: payload.category,
                    updatedAt: new Date(),
                  });
                  confirmMessage(pendingAiRule.sourceMessageId);
                  recordActivity('ai_update_rule_saved', {
                    sourceMessageId: pendingAiRule.sourceMessageId,
                    ruleId: existing.id,
                    ruleTitle: payload.title,
                    category: payload.category,
                  });
                  addToast({ type: 'success', message: `ルール「${payload.title}」を更新しました` });
                }
              } else {
                // 新規追加パス
                const newRule: Rule = {
                  id: `rule-${Date.now()}`,
                  title: payload.title,
                  content: payload.content,
                  category: payload.category,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                addRule(newRule);
                confirmMessage(pendingAiRule.sourceMessageId);
                recordActivity('ai_add_rule_saved', {
                  sourceMessageId: pendingAiRule.sourceMessageId,
                  ruleId: newRule.id,
                  ruleTitle: newRule.title,
                  category: newRule.category,
                });
                addToast({ type: 'success', message: `ルール「${newRule.title}」を追加しました` });
              }
              setPendingAiRule(null);
            }}
            onClose={() => setPendingAiRule(null)}
          />
        )}
        {pendingAiCalendarEvent && (
          <CalendarEventModal
            open={true}
            onClose={() => setPendingAiCalendarEvent(null)}
            initialDate={pendingAiCalendarEvent.draft.date}
            initialStartTime={pendingAiCalendarEvent.draft.startTime}
            event={{
              id: `evt_pending_${pendingAiCalendarEvent.sourceMessageId}`,
              title: pendingAiCalendarEvent.draft.title ?? '',
              date: pendingAiCalendarEvent.draft.date ?? getJstDateString(),
              allDay: pendingAiCalendarEvent.draft.allDay ?? false,
              startTime: pendingAiCalendarEvent.draft.startTime,
              endTime: pendingAiCalendarEvent.draft.endTime,
              category: pendingAiCalendarEvent.draft.category ?? '行事',
              status: 'scheduled',
              visibilityScope: 'all_staff',
              fiscalYear,
              description: pendingAiCalendarEvent.draft.description,
              location: pendingAiCalendarEvent.draft.location,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }}
            aiSuggested
            aiSourceMessageId={pendingAiCalendarEvent.sourceMessageId}
            onAiSuggestionSaved={(savedEvent) => {
              confirmMessage(pendingAiCalendarEvent.sourceMessageId);
              recordActivity('ai_add_calendar_event_saved', {
                sourceMessageId: pendingAiCalendarEvent.sourceMessageId,
                eventId: savedEvent.id,
                title: savedEvent.title,
                date: savedEvent.date,
              });
              setPendingAiCalendarEvent(null);
            }}
          />
        )}
        {!isLoginPage && <SmartInput onSubmit={addMessage} isProcessing={isProcessing} sidebarCollapsed={sidebarCollapsed} sidebarPosition={sidebarPosition} selectedChildName={selectedChildId ? (() => { const c = childrenData.find(ch => ch.id === selectedChildId); return c ? `${c.lastNameKanji || c.lastName} ${c.firstNameKanji || c.firstName}`.trim() : null; })() : null} onError={(msg) => addToast({ type: 'error', message: msg })} />}
      </div>
    </AppContext.Provider>
  );
}
