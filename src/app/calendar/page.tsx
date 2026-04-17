'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '@/components/AppLayout';
import { CalendarEventModal } from '@/components/CalendarEventModal';
import { SupportAssignmentModal } from '@/components/SupportAssignmentModal';
import { CalendarEvent, SupportAssignment, CATEGORY_COLORS } from '@/types/calendar';
import { GoogleCalendarConnect } from '@/components/GoogleCalendarConnect';

// 時間軸設定
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 20;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT_PX = 24; // 30分 = 24px
const TOTAL_SLOTS = (DAY_END_HOUR - DAY_START_HOUR) * (60 / SLOT_MINUTES);
const HOURS_TOTAL_PX = TOTAL_SLOTS * SLOT_HEIGHT_PX;

function parseHM(hm: string | undefined): number | null {
  if (!hm) return null;
  const [h, m] = hm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function minutesToY(minutes: number): number {
  const startMin = DAY_START_HOUR * 60;
  return ((minutes - startMin) / SLOT_MINUTES) * SLOT_HEIGHT_PX;
}

function yToTimeString(y: number): string {
  const rawMin = DAY_START_HOUR * 60 + Math.round(y / SLOT_HEIGHT_PX) * SLOT_MINUTES;
  const clamped = Math.max(DAY_START_HOUR * 60, Math.min(DAY_END_HOUR * 60 - SLOT_MINUTES, rawMin));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const start = new Date(year, month, 1 - startOffset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return days;
}

function buildWeekGrid(ref: Date): Date[] {
  const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - ref.getDay());
  return Array.from({ length: 7 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  );
}

type ViewMode = 'month' | 'week' | 'day';

const weekdayNames = ['日', '月', '火', '水', '木', '金', '土'];

export default function CalendarPage() {
  const { calendarEvents, supportAssignments, fiscalYear, staff, settings } = useApp();
  const today = new Date();
  const [view, setView] = useState<ViewMode>('month');
  const [cursor, setCursor] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(today));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [presetTime, setPresetTime] = useState<string | null>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<SupportAssignment | null>(null);

  const monthGrid = useMemo(() => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const weekGrid = useMemo(() => buildWeekGrid(cursor), [cursor]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of calendarEvents) {
      (map[ev.date] ??= []).push(ev);
    }
    for (const k in map) {
      map[k].sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
    }
    return map;
  }, [calendarEvents]);

  const assignmentsByDate = useMemo(() => {
    const map: Record<string, SupportAssignment[]> = {};
    for (const a of supportAssignments) {
      (map[a.date] ??= []).push(a);
    }
    return map;
  }, [supportAssignments]);

  const dayEvents = eventsByDate[selectedDate] ?? [];

  const shift = (delta: number) => {
    setCursor(c => {
      if (view === 'month') return new Date(c.getFullYear(), c.getMonth() + delta, 1);
      if (view === 'week') return new Date(c.getFullYear(), c.getMonth(), c.getDate() + delta * 7);
      return new Date(c.getFullYear(), c.getMonth(), c.getDate() + delta);
    });
  };
  const goToday = () => {
    const t = new Date();
    setCursor(t);
    setSelectedDate(toDateKey(t));
  };

  const headerLabel = (() => {
    if (view === 'month') return `${cursor.getFullYear()}年${cursor.getMonth() + 1}月`;
    if (view === 'week') {
      const s = weekGrid[0];
      const e = weekGrid[6];
      return `${s.getFullYear()}年${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`;
    }
    // day
    const dow = weekdayNames[cursor.getDay()];
    return `${cursor.getFullYear()}年${cursor.getMonth() + 1}月${cursor.getDate()}日(${dow})`;
  })();

  const openCreate = (date: string) => {
    setEditingEvent(null);
    setPresetTime(null);
    setSelectedDate(date);
    setModalOpen(true);
  };
  const openEdit = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setModalOpen(true);
  };

  const classMap = Object.fromEntries((settings.classes ?? []).map(c => [c.id, c.name]));
  const staffMap = Object.fromEntries(staff.map(s => [s.id, `${s.lastName} ${s.firstName}`]));

  const scopeLabel = (ev: CalendarEvent): string => {
    switch (ev.visibilityScope) {
      case 'all_staff': return '全職員';
      case 'class': return (ev.targetClassIds ?? []).map(id => classMap[id] ?? id).join('・') || 'クラス';
      case 'staff': return (ev.targetStaffIds ?? []).map(id => staffMap[id] ?? id).join('・') || '職員';
      case 'children_related': return `園児 ${(ev.targetChildIds ?? []).length}名`;
    }
  };

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-headline">カレンダー</h1>
            <p className="text-xs text-paragraph/50">{fiscalYear}年度・内部用</p>
          </div>
          <div className="flex items-center gap-2">
            <GoogleCalendarConnect />
            <button
              onClick={() => openCreate(selectedDate)}
              className="px-4 py-2 bg-button text-white rounded-lg text-sm font-medium hover:opacity-90"
            >
              + 予定を追加
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="bg-surface rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button onClick={() => shift(-1)} className="px-2 py-1 rounded hover:bg-secondary/20">‹</button>
              <h2 className="text-lg font-bold text-headline">{headerLabel}</h2>
              <button onClick={() => shift(1)} className="px-2 py-1 rounded hover:bg-secondary/20">›</button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-secondary/30 overflow-hidden text-xs">
                <button onClick={() => setView('month')} className={`px-3 py-1 ${view === 'month' ? 'bg-button text-white' : 'hover:bg-secondary/20'}`}>月</button>
                <button onClick={() => setView('week')} className={`px-3 py-1 ${view === 'week' ? 'bg-button text-white' : 'hover:bg-secondary/20'}`}>週</button>
                <button onClick={() => setView('day')} className={`px-3 py-1 ${view === 'day' ? 'bg-button text-white' : 'hover:bg-secondary/20'}`}>日</button>
              </div>
              <button onClick={goToday} className="text-xs px-2 py-1 rounded border border-secondary/30 hover:bg-secondary/20">
                今日
              </button>
            </div>
          </div>

          {view === 'month' ? (
            <div className="grid grid-cols-7 gap-px bg-secondary/20 border border-secondary/20 rounded-lg overflow-hidden">
              {weekdayNames.map((w, i) => (
                <div key={w} className={`bg-surface text-center text-xs font-medium py-2 ${i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-paragraph/70'}`}>
                  {w}
                </div>
              ))}
              {monthGrid.map((d, idx) => {
                const key = toDateKey(d);
                const inMonth = d.getMonth() === cursor.getMonth();
                const isToday = toDateKey(new Date()) === key;
                const isSelected = selectedDate === key;
                const evs = eventsByDate[key] ?? [];
                const dayOfWeek = d.getDay();
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(key)}
                    onDoubleClick={() => openCreate(key)}
                    className={`bg-surface min-h-[88px] p-1.5 text-left transition-colors ${
                      inMonth ? '' : 'opacity-40'
                    } ${isSelected ? 'ring-2 ring-button ring-inset' : 'hover:bg-secondary/10'}`}
                  >
                    <div className={`text-xs font-medium ${
                      isToday ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-button text-white' :
                      dayOfWeek === 0 ? 'text-red-600' :
                      dayOfWeek === 6 ? 'text-blue-600' :
                      'text-paragraph'
                    }`}>
                      {d.getDate()}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {evs.slice(0, 3).map(ev => {
                        const c = CATEGORY_COLORS[ev.category];
                        return (
                          <div
                            key={ev.id}
                            className={`text-[10px] truncate px-1 py-0.5 rounded ${c.bg} ${c.text} ${ev.status === 'cancelled' ? 'line-through opacity-60' : ''}`}
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                      {evs.length > 3 && (
                        <div className="text-[10px] text-paragraph/60">+{evs.length - 3}件</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : view === 'week' ? (
            <WeekTimelineView
              weekGrid={weekGrid}
              eventsByDate={eventsByDate}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onOpenEdit={openEdit}
              onCreateAt={(date, time) => {
                setEditingEvent(null);
                setSelectedDate(date);
                setPresetTime(time);
                setModalOpen(true);
              }}
            />
          ) : (
            <DayTimelineView
              dateKey={toDateKey(cursor)}
              events={eventsByDate[toDateKey(cursor)] ?? []}
              assignments={assignmentsByDate[toDateKey(cursor)] ?? []}
              staffMap={staffMap}
              classMap={classMap}
              onOpenEdit={openEdit}
              onOpenAssignment={(a) => { setEditingAssignment(a); setSupportModalOpen(true); }}
              onCreateAt={(time) => {
                setEditingEvent(null);
                setSelectedDate(toDateKey(cursor));
                setPresetTime(time);
                setModalOpen(true);
              }}
              onAddAssignment={() => { setEditingAssignment(null); setSupportModalOpen(true); }}
            />
          )}

          {/* カテゴリ凡例 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(CATEGORY_COLORS).map(([cat, c]) => (
              <span key={cat} className="inline-flex items-center gap-1 text-[10px] text-paragraph/70">
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />{cat}
              </span>
            ))}
          </div>
        </section>

        {/* 日詳細 */}
        <aside className="bg-surface rounded-xl p-4 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-headline">
              {selectedDate.replace(/-/g, '/')}
            </h3>
            <button
              onClick={() => openCreate(selectedDate)}
              className="text-xs px-2 py-1 rounded border border-secondary/30 hover:bg-secondary/20"
            >
              +追加
            </button>
          </div>

          {dayEvents.length === 0 ? (
            <p className="text-xs text-paragraph/50 py-6 text-center">予定はありません</p>
          ) : (
            <div className="space-y-2">
              {dayEvents.map(ev => {
                const c = CATEGORY_COLORS[ev.category];
                return (
                  <button
                    key={ev.id}
                    onClick={() => openEdit(ev)}
                    className="w-full text-left border border-secondary/20 rounded-lg p-3 hover:bg-secondary/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}>{ev.category}</span>
                      {ev.status === 'cancelled' && <span className="text-[10px] text-alert">中止</span>}
                      {ev.status === 'done' && <span className="text-[10px] text-paragraph/50">完了</span>}
                    </div>
                    <div className={`text-sm font-medium text-headline ${ev.status === 'cancelled' ? 'line-through opacity-60' : ''}`}>
                      {ev.title}
                    </div>
                    <div className="text-[11px] text-paragraph/60 mt-1 space-y-0.5">
                      {!ev.allDay && (ev.startTime || ev.endTime) && (
                        <div>{ev.startTime ?? ''}{ev.endTime ? ` - ${ev.endTime}` : ''}</div>
                      )}
                      {ev.location && <div>📍 {ev.location}</div>}
                      <div>👥 {scopeLabel(ev)}</div>
                      {ev.ownerStaffId && staffMap[ev.ownerStaffId] && (
                        <div>担当: {staffMap[ev.ownerStaffId]}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>
      </main>

      <CalendarEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialDate={selectedDate}
        initialStartTime={presetTime ?? undefined}
        event={editingEvent}
      />

      <SupportAssignmentModal
        open={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        initialDate={view === 'day' ? toDateKey(cursor) : selectedDate}
        assignment={editingAssignment}
      />
    </div>
  );
}

/** 日ビュー（時間軸付き・1カラム） */
function DayTimelineView({
  dateKey,
  events,
  assignments,
  staffMap,
  classMap,
  onOpenEdit,
  onOpenAssignment,
  onCreateAt,
  onAddAssignment,
}: {
  dateKey: string;
  events: CalendarEvent[];
  assignments: SupportAssignment[];
  staffMap: Record<string, string>;
  classMap: Record<string, string>;
  onOpenEdit: (ev: CalendarEvent) => void;
  onOpenAssignment: (a: SupportAssignment) => void;
  onCreateAt: (time: string) => void;
  onAddAssignment: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayKey = toDateKey(new Date());
  const isToday = todayKey === dateKey;
  const [nowMin, setNowMin] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = minutesToY(8 * 60) - 20;
    }
    const id = setInterval(() => {
      const n = new Date();
      setNowMin(n.getHours() * 60 + n.getMinutes());
    }, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const allDay = events.filter(e => e.allDay || !e.startTime);
  const timed = events.filter(e => !e.allDay && e.startTime);

  // 重なり処理
  const sorted = [...timed].sort((a, b) => (parseHM(a.startTime) ?? 0) - (parseHM(b.startTime) ?? 0));
  const groups: CalendarEvent[][] = [];
  for (const ev of sorted) {
    const start = parseHM(ev.startTime) ?? 0;
    const end = parseHM(ev.endTime) ?? start + 30;
    let placed = false;
    for (const g of groups) {
      const lastEnd = Math.max(...g.map(x => parseHM(x.endTime) ?? (parseHM(x.startTime) ?? 0) + 30));
      const firstStart = Math.min(...g.map(x => parseHM(x.startTime) ?? 0));
      if (start < lastEnd && end > firstStart) {
        g.push(ev);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push([ev]);
  }
  const positions = new Map<string, { col: number; colSpan: number }>();
  for (const g of groups) {
    g.forEach((ev, i) => positions.set(ev.id, { col: i, colSpan: g.length }));
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const time = yToTimeString(y);
    onCreateAt(time);
  };

  return (
    <div className="border border-secondary/20 rounded-lg overflow-hidden">
      {/* ヘッダー: 補助配置追加ボタン */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-secondary/20">
        <span className="text-sm font-medium text-headline">タイムライン</span>
        <button
          onClick={onAddAssignment}
          className="text-xs px-3 py-1 rounded border border-secondary/30 hover:bg-secondary/20 text-paragraph"
        >
          + 補助配置を追加
        </button>
      </div>

      {/* 終日イベント行 */}
      {allDay.length > 0 && (
        <div className="px-4 py-2 border-b border-secondary/20 space-y-1">
          <div className="text-[9px] text-paragraph/50">終日</div>
          {allDay.map(ev => {
            const c = CATEGORY_COLORS[ev.category];
            return (
              <button
                key={ev.id}
                onClick={() => onOpenEdit(ev)}
                className={`block w-full text-left text-xs px-2 py-1 rounded ${c.bg} ${c.text} ${ev.status === 'cancelled' ? 'line-through opacity-60' : ''}`}
              >
                {ev.title}
              </button>
            );
          })}
        </div>
      )}

      {/* 時間軸本体 */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '600px' }}>
        <div className="grid relative" style={{ gridTemplateColumns: '48px 1fr 160px', height: `${HOURS_TOTAL_PX}px` }}>
          {/* 時刻ラベル列 */}
          <div className="relative">
            {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => {
              const h = DAY_START_HOUR + i;
              return (
                <div
                  key={h}
                  className="absolute right-1 text-[10px] text-paragraph/50 -translate-y-1/2"
                  style={{ top: `${minutesToY(h * 60)}px` }}
                >
                  {h}:00
                </div>
              );
            })}
          </div>

          {/* イベント列 */}
          <div
            className={`relative border-l border-secondary/20 cursor-crosshair ${isToday ? 'bg-button/5' : ''}`}
            onClick={handleTimelineClick}
          >
            {/* グリッド線 */}
            {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
              <div
                key={i}
                className={`absolute left-0 right-0 ${i % 2 === 0 ? 'border-t border-secondary/20' : 'border-t border-secondary/10'}`}
                style={{ top: `${i * SLOT_HEIGHT_PX}px` }}
              />
            ))}
            {/* 現在時刻線 */}
            {isToday && nowMin >= DAY_START_HOUR * 60 && nowMin <= DAY_END_HOUR * 60 && (
              <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${minutesToY(nowMin)}px` }}>
                <div className="h-px bg-red-500" />
                <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
              </div>
            )}
            {/* イベントブロック */}
            {timed.map(ev => {
              const start = parseHM(ev.startTime);
              if (start === null) return null;
              const end = parseHM(ev.endTime) ?? start + 30;
              const top = Math.max(0, minutesToY(start));
              const height = Math.max(SLOT_HEIGHT_PX - 2, minutesToY(end) - minutesToY(start) - 2);
              const pos = positions.get(ev.id) ?? { col: 0, colSpan: 1 };
              const widthPct = 100 / pos.colSpan;
              const leftPct = widthPct * pos.col;
              const c = CATEGORY_COLORS[ev.category];
              return (
                <button
                  key={ev.id}
                  onClick={(e) => { e.stopPropagation(); onOpenEdit(ev); }}
                  className={`absolute overflow-hidden rounded px-1.5 py-0.5 text-left text-[11px] shadow-sm ${c.bg} ${c.text} border border-white ${ev.status === 'cancelled' ? 'line-through opacity-60' : ''}`}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: `calc(${leftPct}% + 2px)`,
                    width: `calc(${widthPct}% - 4px)`,
                    zIndex: 10,
                  }}
                  title={`${ev.startTime ?? ''}${ev.endTime ? '-' + ev.endTime : ''} ${ev.title}`}
                >
                  <div className="font-medium truncate">{ev.startTime} {ev.title}</div>
                  {height > 30 && ev.location && <div className="truncate opacity-75">{ev.location}</div>}
                </button>
              );
            })}
          </div>

          {/* 補助教諭配置レーン */}
          <div className="relative border-l border-secondary/20 bg-amber-50/30">
            {/* ヘッダーラベル */}
            <div className="absolute top-0 left-0 right-0 text-[9px] text-amber-700 font-medium px-1 py-0.5 bg-amber-100/50 border-b border-amber-200/50 z-10">
              補助配置
            </div>
            {/* グリッド線 */}
            {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
              <div
                key={i}
                className={`absolute left-0 right-0 ${i % 2 === 0 ? 'border-t border-amber-200/40' : 'border-t border-amber-100/40'}`}
                style={{ top: `${i * SLOT_HEIGHT_PX}px` }}
              />
            ))}
            {/* 配置ブロック */}
            {assignments.map(a => {
              const start = parseHM(a.startTime);
              const end = parseHM(a.endTime);
              if (start === null || end === null) return null;
              const top = Math.max(0, minutesToY(start));
              const height = Math.max(SLOT_HEIGHT_PX - 2, minutesToY(end) - minutesToY(start) - 2);
              return (
                <button
                  key={a.id}
                  onClick={() => onOpenAssignment(a)}
                  className="absolute left-1 right-1 bg-amber-200/80 border border-amber-400/60 rounded px-1.5 py-0.5 text-left text-[10px] text-amber-900 shadow-sm hover:bg-amber-300/80 transition-colors overflow-hidden"
                  style={{ top: `${top}px`, height: `${height}px`, zIndex: 10 }}
                  title={`${a.startTime}-${a.endTime} ${staffMap[a.staffId] ?? '?'} → ${classMap[a.targetClassId] ?? '?'}`}
                >
                  <div className="font-medium truncate">{staffMap[a.staffId] ?? '?'}</div>
                  <div className="truncate opacity-75">→ {classMap[a.targetClassId] ?? '?'}</div>
                  {height > 36 && a.taskDescription && <div className="truncate opacity-60">{a.taskDescription}</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 週ビュー（時間軸付き） */
function WeekTimelineView({
  weekGrid,
  eventsByDate,
  selectedDate,
  onSelectDate,
  onOpenEdit,
  onCreateAt,
}: {
  weekGrid: Date[];
  eventsByDate: Record<string, CalendarEvent[]>;
  selectedDate: string;
  onSelectDate: (d: string) => void;
  onOpenEdit: (ev: CalendarEvent) => void;
  onCreateAt: (date: string, time: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [nowMin, setNowMin] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = minutesToY(8 * 60) - 20;
    }
    const id = setInterval(() => {
      const n = new Date();
      setNowMin(n.getHours() * 60 + n.getMinutes());
    }, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const todayKey = toDateKey(new Date());

  const splitEvents = (dateKey: string) => {
    const evs = eventsByDate[dateKey] ?? [];
    const allDay: CalendarEvent[] = [];
    const timed: CalendarEvent[] = [];
    for (const e of evs) {
      if (e.allDay || !e.startTime) allDay.push(e);
      else timed.push(e);
    }
    return { allDay, timed };
  };

  const maxAllDay = Math.max(1, ...weekGrid.map(d => splitEvents(toDateKey(d)).allDay.length));

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>, dateKey: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const time = yToTimeString(y);
    onCreateAt(dateKey, time);
  };

  return (
    <div className="border border-secondary/20 rounded-lg overflow-hidden">
      {/* ヘッダー: 曜日 */}
      <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
        <div className="bg-surface border-b border-secondary/20" />
        {weekGrid.map((d, i) => {
          const key = toDateKey(d);
          const isToday = todayKey === key;
          const isSelected = selectedDate === key;
          const dow = d.getDay();
          return (
            <button
              key={i}
              onClick={() => onSelectDate(key)}
              className={`bg-surface border-b border-l border-secondary/20 py-2 text-center transition-colors ${
                isSelected ? 'bg-button/10' : 'hover:bg-secondary/10'
              }`}
            >
              <div className={`text-[10px] ${dow === 0 ? 'text-red-600' : dow === 6 ? 'text-blue-600' : 'text-paragraph/60'}`}>
                {weekdayNames[dow]}
              </div>
              <div className={`text-sm font-bold ${
                isToday ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-button text-white mt-0.5' : 'text-headline'
              }`}>
                {d.getDate()}
              </div>
            </button>
          );
        })}
      </div>

      {/* 終日イベント行 */}
      <div
        className="grid border-b border-secondary/20"
        style={{ gridTemplateColumns: '48px repeat(7, 1fr)', minHeight: `${Math.max(maxAllDay, 1) * 20 + 8}px` }}
      >
        <div className="text-[9px] text-paragraph/50 text-right pr-1 pt-1">終日</div>
        {weekGrid.map((d, i) => {
          const key = toDateKey(d);
          const { allDay } = splitEvents(key);
          return (
            <div key={i} className="border-l border-secondary/20 p-0.5 space-y-0.5">
              {allDay.map(ev => {
                const c = CATEGORY_COLORS[ev.category];
                return (
                  <button
                    key={ev.id}
                    onClick={() => onOpenEdit(ev)}
                    className={`block w-full text-left text-[10px] px-1 py-0.5 rounded truncate ${c.bg} ${c.text} ${ev.status === 'cancelled' ? 'line-through opacity-60' : ''}`}
                    title={ev.title}
                  >
                    {ev.title}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* 時間軸本体 */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '560px' }}>
        <div className="grid relative" style={{ gridTemplateColumns: '48px repeat(7, 1fr)', height: `${HOURS_TOTAL_PX}px` }}>
          {/* 時刻ラベル列 */}
          <div className="relative">
            {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => {
              const h = DAY_START_HOUR + i;
              return (
                <div
                  key={h}
                  className="absolute right-1 text-[10px] text-paragraph/50 -translate-y-1/2"
                  style={{ top: `${minutesToY(h * 60)}px` }}
                >
                  {h}:00
                </div>
              );
            })}
          </div>

          {/* 各曜日カラム */}
          {weekGrid.map((d, dayIdx) => {
            const key = toDateKey(d);
            const isToday = todayKey === key;
            const { timed } = splitEvents(key);
            const sorted = [...timed].sort((a, b) => (parseHM(a.startTime) ?? 0) - (parseHM(b.startTime) ?? 0));
            const groups: CalendarEvent[][] = [];
            for (const ev of sorted) {
              const start = parseHM(ev.startTime) ?? 0;
              const end = parseHM(ev.endTime) ?? start + 30;
              let placed = false;
              for (const g of groups) {
                const lastEnd = Math.max(...g.map(x => parseHM(x.endTime) ?? (parseHM(x.startTime) ?? 0) + 30));
                const firstStart = Math.min(...g.map(x => parseHM(x.startTime) ?? 0));
                if (start < lastEnd && end > firstStart) {
                  g.push(ev);
                  placed = true;
                  break;
                }
              }
              if (!placed) groups.push([ev]);
            }
            const positions = new Map<string, { col: number; colSpan: number }>();
            for (const g of groups) {
              g.forEach((ev, i) => positions.set(ev.id, { col: i, colSpan: g.length }));
            }

            return (
              <div
                key={dayIdx}
                className={`relative border-l border-secondary/20 cursor-crosshair ${isToday ? 'bg-button/5' : ''}`}
                onClick={(e) => handleTimelineClick(e, key)}
              >
                {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
                  <div
                    key={i}
                    className={`absolute left-0 right-0 ${i % 2 === 0 ? 'border-t border-secondary/20' : 'border-t border-secondary/10'}`}
                    style={{ top: `${i * SLOT_HEIGHT_PX}px` }}
                  />
                ))}
                {isToday && nowMin >= DAY_START_HOUR * 60 && nowMin <= DAY_END_HOUR * 60 && (
                  <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${minutesToY(nowMin)}px` }}>
                    <div className="h-px bg-red-500" />
                    <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                  </div>
                )}
                {timed.map(ev => {
                  const start = parseHM(ev.startTime);
                  if (start === null) return null;
                  const end = parseHM(ev.endTime) ?? start + 30;
                  const top = Math.max(0, minutesToY(start));
                  const height = Math.max(SLOT_HEIGHT_PX - 2, minutesToY(end) - minutesToY(start) - 2);
                  const pos = positions.get(ev.id) ?? { col: 0, colSpan: 1 };
                  const widthPct = 100 / pos.colSpan;
                  const leftPct = widthPct * pos.col;
                  const c = CATEGORY_COLORS[ev.category];
                  return (
                    <button
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); onOpenEdit(ev); }}
                      className={`absolute overflow-hidden rounded px-1 py-0.5 text-left text-[10px] shadow-sm ${c.bg} ${c.text} border border-white ${ev.status === 'cancelled' ? 'line-through opacity-60' : ''}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                        zIndex: 10,
                      }}
                      title={`${ev.startTime ?? ''}${ev.endTime ? '-' + ev.endTime : ''} ${ev.title}`}
                    >
                      <div className="font-medium truncate">{ev.startTime} {ev.title}</div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
