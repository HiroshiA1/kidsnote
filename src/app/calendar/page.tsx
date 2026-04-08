'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/components/AppLayout';
import { CalendarEventModal } from '@/components/CalendarEventModal';
import { CalendarEvent, CATEGORY_COLORS } from '@/types/calendar';

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(year: number, month: number): Date[] {
  // month: 0-11
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0=Sun
  const start = new Date(year, month, 1 - startOffset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return days;
}

export default function CalendarPage() {
  const { calendarEvents, fiscalYear, staff, settings } = useApp();
  const today = new Date();
  const [cursor, setCursor] = useState<{ year: number; month: number }>({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(today));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const grid = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of calendarEvents) {
      (map[ev.date] ??= []).push(ev);
    }
    // sort by time within day
    for (const k in map) {
      map[k].sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
    }
    return map;
  }, [calendarEvents]);

  const dayEvents = eventsByDate[selectedDate] ?? [];

  const prevMonth = () => {
    setCursor(c => {
      const m = c.month - 1;
      return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m };
    });
  };
  const nextMonth = () => {
    setCursor(c => {
      const m = c.month + 1;
      return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m };
    });
  };
  const goToday = () => {
    const t = new Date();
    setCursor({ year: t.getFullYear(), month: t.getMonth() });
    setSelectedDate(toDateKey(t));
  };

  const openCreate = (date: string) => {
    setEditingEvent(null);
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

  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-headline">カレンダー</h1>
            <p className="text-xs text-paragraph/50">{fiscalYear}年度・内部用</p>
          </div>
          <button
            onClick={() => openCreate(selectedDate)}
            className="px-4 py-2 bg-button text-white rounded-lg text-sm font-medium hover:opacity-90"
          >
            + 予定を追加
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* 月ビュー */}
        <section className="bg-surface rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="px-2 py-1 rounded hover:bg-secondary/20">‹</button>
              <h2 className="text-lg font-bold text-headline">
                {cursor.year}年{cursor.month + 1}月
              </h2>
              <button onClick={nextMonth} className="px-2 py-1 rounded hover:bg-secondary/20">›</button>
            </div>
            <button onClick={goToday} className="text-xs px-2 py-1 rounded border border-secondary/30 hover:bg-secondary/20">
              今日
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-secondary/20 border border-secondary/20 rounded-lg overflow-hidden">
            {weekdays.map((w, i) => (
              <div key={w} className={`bg-surface text-center text-xs font-medium py-2 ${i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-paragraph/70'}`}>
                {w}
              </div>
            ))}
            {grid.map((d, idx) => {
              const key = toDateKey(d);
              const inMonth = d.getMonth() === cursor.month;
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
        event={editingEvent}
      />
    </div>
  );
}
