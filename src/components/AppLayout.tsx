'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
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
import { recordActivity } from '@/lib/activityLog';
import { useHydration } from '@/hooks/useHydration';
import { useMessageController } from '@/hooks/useMessageController';

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
  /** ログイン用アカウントが作成済みか */
  accountCreated?: boolean;
  /** アカウントのメールアドレス（emailと同一の場合もある） */
  accountEmail?: string;
}

interface AppContextType {
  messages: InputMessage[];
  addMessage: (content: string, attachments?: Attachment[], options?: { emergency?: boolean }) => Promise<void>;
  confirmMessage: (id: string) => void;
  editMessage: (id: string, newIntent: IntentResult['intent']) => void;
  cancelMessage: (id: string) => void;
  markForRecord: (id: string) => void;
  isProcessing: boolean;
  sidebarCollapsed: boolean;
  children: ChildWithGrowth[];
  staff: Staff[];
  addChild: (child: ChildWithGrowth) => void;
  updateChild: (child: ChildWithGrowth) => void;
  removeChild: (id: string) => void;
  fiscalYear: number;
  setFiscalYear: (y: number) => void;
  addStaff: (staff: Staff) => void;
  updateStaff: (staff: Staff) => void;
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
  pendingAiRule: { sourceMessageId: string; draft: Partial<Rule> } | null;
  setPendingAiRule: (value: { sourceMessageId: string; draft: Partial<Rule> } | null) => void;
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
    staffData, setStaffData,
    rules, setRules,
    attendanceData, setAttendanceData,
    settingsData, setSettingsData,
    shiftPatterns, setShiftPatterns,
    shiftAssignments, setShiftAssignments,
    staffAttendanceData, setStaffAttendanceData,
    currentStaffId, setCurrentStaffId,
    currentUserRole,
    fiscalYear, setFiscalYear,
    calendarEvents, setCalendarEvents,
    supportAssignments, setSupportAssignments,
    curriculumPlans, setCurriculumPlans,
    dailyReflections, setDailyReflections,
    childDailyReflections, setChildDailyReflections,
    newYearSetup, setNewYearSetup,
  } = useHydration();

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
  const [ruleChatMessages, setRuleChatMessages] = useState<RuleChatMessage[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [pendingAiRule, setPendingAiRule] = useState<{ sourceMessageId: string; draft: Partial<Rule> } | null>(null);

  const addChildToStore = (child: ChildWithGrowth) => {
    setChildrenData(prev => [...prev, child]);
    auditCreate('child', child.id, { name: `${child.lastName} ${child.firstName}` });
  };

  const updateChildInStore = (child: ChildWithGrowth) => {
    setChildrenData(prev => prev.map(c => c.id === child.id ? child : c));
    auditUpdate('child', child.id, { name: `${child.lastName} ${child.firstName}` });
  };

  const removeChildFromStore = (id: string) => {
    setChildrenData(prev => prev.filter(c => c.id !== id));
    auditDelete('child', id);
  };

  const addStaffToStore = (staff: Staff) => {
    setStaffData(prev => [...prev, staff]);
    auditCreate('staff', staff.id, { name: `${staff.lastName} ${staff.firstName}` });
  };

  const updateStaffInStore = (staff: Staff) => {
    setStaffData(prev => prev.map(s => s.id === staff.id ? staff : s));
    auditUpdate('staff', staff.id, { name: `${staff.lastName} ${staff.firstName}` });
  };

  const { isProcessing, addMessage, confirmMessage, editMessage, cancelMessage, markForRecord } =
    useMessageController({
      messages,
      setMessages,
      childrenData,
      staffData,
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
        children: childrenData,
        staff: staffData,
        addChild: addChildToStore,
        updateChild: updateChildInStore,
        removeChild: removeChildFromStore,
        fiscalYear,
        setFiscalYear,
        addStaff: addStaffToStore,
        updateStaff: updateStaffInStore,
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
        <main className={`flex-1 ${isLoginPage ? '' : 'pb-32'} transition-all duration-300 ${isLoginPage ? '' : sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
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
          {children}
        </main>
        {!isLoginPage && <FloatingPopup sidebarCollapsed={sidebarCollapsed} />}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <ConfirmDialogContainer pending={confirmPending} onResolve={resolveConfirm} />
        {pendingAiRule && (
          <RuleModal
            rule={pendingAiRule.draft}
            aiSuggested
            onSave={(payload: RuleSavePayload) => {
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
              addToast({ type: 'success', message: `ルール「${newRule.title}」を追加しました` });
              setPendingAiRule(null);
            }}
            onClose={() => setPendingAiRule(null)}
          />
        )}
        {!isLoginPage && <SmartInput onSubmit={addMessage} isProcessing={isProcessing} sidebarCollapsed={sidebarCollapsed} selectedChildName={selectedChildId ? (() => { const c = childrenData.find(ch => ch.id === selectedChildId); return c ? `${c.lastNameKanji || c.lastName} ${c.firstNameKanji || c.firstName}`.trim() : null; })() : null} onError={(msg) => addToast({ type: 'error', message: msg })} />}
      </div>
    </AppContext.Provider>
  );
}
