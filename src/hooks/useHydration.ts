import { useState, useEffect } from 'react';
import { saveToStorage, loadFromStorage, loadFromStorageAsync, STORAGE_KEYS } from '@/lib/storage';
import { ChildWithGrowth, initialChildren } from '@/lib/childrenStore';
import { Rule } from '@/types/rule';
import { AttendanceRecord } from '@/types/document';
import { SchoolSettings, defaultSchoolSettings, defaultClasses } from '@/types/settings';
import { ShiftPattern, ShiftAssignment, StaffAttendanceRecord } from '@/types/staffAttendance';
import { sampleRules } from '@/lib/sampleRules';
import { InputMessage } from '@/types/intent';
import { AppRole } from '@/lib/supabase/auth';
import { getCurrentFiscalYear } from '@/lib/fiscalYear';
import { CalendarEvent, SupportAssignment, DEFAULT_CALENDAR_CATEGORIES } from '@/types/calendar';
import { DEFAULT_RULE_CATEGORIES } from '@/types/rule';
import { CurriculumPlan, DailyReflection, ChildDailyReflection } from '@/types/carePlan';
import { NewYearSetup } from '@/types/newYearSetup';

/**
 * 日本語 staff.role → Supabase app_role のマップ。
 * 本格的には memberships.role を直接使うべきだが、現状はこのマップで代用。
 * AppLayout 側の currentUserRole 導出でも使うので export する。
 */
export const staffRoleMap: Record<string, AppRole> = {
  '園長': 'admin',
  '主任': 'manager',
  '担任': 'teacher',
  '副担任': 'teacher',
  'パート': 'part_time',
};

export function useHydration() {
  const [messages, setMessages] = useState<InputMessage[]>([]);
  const [childrenData, setChildrenData] = useState<ChildWithGrowth[]>(initialChildren);
  // staff は Supabase canonical に一元化したため、local hydration 対象から外す。
  // AppLayout 側の useSupabaseStaff が取得を担う。
  const [rules, setRules] = useState<Rule[]>(sampleRules);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [settingsData, setSettingsData] = useState<SchoolSettings>(defaultSchoolSettings);
  const [shiftPatterns, setShiftPatterns] = useState<ShiftPattern[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([]);
  const [staffAttendanceData, setStaffAttendanceData] = useState<StaffAttendanceRecord[]>([]);
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  // currentUserRole は Supabase staff 取得後に AppLayout 側で導出する
  const [fiscalYear, setFiscalYear] = useState<number>(getCurrentFiscalYear());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [supportAssignments, setSupportAssignments] = useState<SupportAssignment[]>([]);
  const [curriculumPlans, setCurriculumPlans] = useState<CurriculumPlan[]>([]);
  const [dailyReflections, setDailyReflections] = useState<DailyReflection[]>([]);
  const [childDailyReflections, setChildDailyReflections] = useState<ChildDailyReflection[]>([]);
  const [newYearSetup, setNewYearSetup] = useState<NewYearSetup | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    const hydrateAsync = async () => {
      const [loadedMessages, loadedChildren, loadedAttendance, loadedStaffAttendance] = await Promise.all([
        loadFromStorageAsync<InputMessage[]>(STORAGE_KEYS.messages),
        loadFromStorageAsync<ChildWithGrowth[]>(STORAGE_KEYS.children),
        loadFromStorageAsync<AttendanceRecord[]>(STORAGE_KEYS.attendance),
        loadFromStorageAsync<StaffAttendanceRecord[]>(STORAGE_KEYS.staffAttendance),
      ]);

      setMessages(loadedMessages ?? []);
      setChildrenData(loadedChildren ?? initialChildren);
      setAttendanceData(loadedAttendance ?? []);
      setStaffAttendanceData(loadedStaffAttendance ?? []);

      setRules(loadFromStorage<Rule[]>(STORAGE_KEYS.rules) ?? sampleRules);
      const loadedSettings = loadFromStorage<SchoolSettings>(STORAGE_KEYS.settings) ?? defaultSchoolSettings;
      setSettingsData({ ...loadedSettings, classes: loadedSettings.classes ?? defaultClasses, calendarCategories: loadedSettings.calendarCategories ?? DEFAULT_CALENDAR_CATEGORIES, ruleCategories: loadedSettings.ruleCategories ?? DEFAULT_RULE_CATEGORIES });
      setShiftPatterns(loadFromStorage<ShiftPattern[]>(STORAGE_KEYS.shiftPatterns) ?? []);
      setShiftAssignments(loadFromStorage<ShiftAssignment[]>(STORAGE_KEYS.shiftAssignments) ?? []);
      setCalendarEvents(loadFromStorage<CalendarEvent[]>(STORAGE_KEYS.calendarEvents) ?? []);
      setSupportAssignments(loadFromStorage<SupportAssignment[]>(STORAGE_KEYS.supportAssignments) ?? []);
      setCurriculumPlans(loadFromStorage<CurriculumPlan[]>(STORAGE_KEYS.curriculumPlans) ?? []);
      setDailyReflections(loadFromStorage<DailyReflection[]>(STORAGE_KEYS.dailyReflections) ?? []);
      setChildDailyReflections(loadFromStorage<ChildDailyReflection[]>(STORAGE_KEYS.childDailyReflections) ?? []);
      setNewYearSetup(loadFromStorage<NewYearSetup>(STORAGE_KEYS.newYearSetup) ?? null);

      const savedStaffId = loadFromStorage<string>(STORAGE_KEYS.currentStaffId) ?? null;
      setCurrentStaffId(savedStaffId);
      // currentUserRole の導出は AppLayout 側で Supabase staff 取得後に行う
      const savedFy = loadFromStorage<number>(STORAGE_KEYS.fiscalYear);
      if (typeof savedFy === 'number') setFiscalYear(savedFy);
      setHydrated(true);
    };
    hydrateAsync();
  }, []);

  // Persist state changes to localStorage (only after hydration)
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.messages, messages); }, [messages, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.children, childrenData); }, [childrenData, hydrated]);
  // staff は Supabase canonical のため localStorage には保存しない
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.rules, rules); }, [rules, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.attendance, attendanceData); }, [attendanceData, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.settings, settingsData); }, [settingsData, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.shiftPatterns, shiftPatterns); }, [shiftPatterns, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.shiftAssignments, shiftAssignments); }, [shiftAssignments, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.staffAttendance, staffAttendanceData); }, [staffAttendanceData, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.fiscalYear, fiscalYear); }, [fiscalYear, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.calendarEvents, calendarEvents); }, [calendarEvents, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.supportAssignments, supportAssignments); }, [supportAssignments, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.curriculumPlans, curriculumPlans); }, [curriculumPlans, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.dailyReflections, dailyReflections); }, [dailyReflections, hydrated]);
  useEffect(() => { if (hydrated) saveToStorage(STORAGE_KEYS.childDailyReflections, childDailyReflections); }, [childDailyReflections, hydrated]);
  useEffect(() => { if (hydrated && newYearSetup) saveToStorage(STORAGE_KEYS.newYearSetup, newYearSetup); }, [newYearSetup, hydrated]);
  useEffect(() => {
    if (hydrated) {
      saveToStorage(STORAGE_KEYS.currentStaffId, currentStaffId);
    }
  }, [currentStaffId, hydrated]);

  return {
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
    hydrated,
  };
}
