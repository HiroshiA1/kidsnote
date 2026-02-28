'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppLayout';
import { AttendanceStatus, attendanceStatusLabels } from '@/types/document';

const statusCycle: AttendanceStatus[] = ['○', '×', '△', '▽', '-'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

export default function AttendancePage() {
  const { children, attendance, updateAttendance } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [classFilter, setClassFilter] = useState<string>('all');

  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const classNames = useMemo(() => {
    const set = new Set(children.map(c => c.className));
    return Array.from(set).sort();
  }, [children]);

  const filteredChildren = useMemo(() => {
    if (classFilter === 'all') return children;
    return children.filter(c => c.className === classFilter);
  }, [children, classFilter]);

  const getStatus = (childId: string, day: number): AttendanceStatus | null => {
    const record = attendance.find(
      r => r.childId === childId && r.year === year && r.month === month && r.day === day
    );
    return record?.status ?? null;
  };

  const handleCellClick = (childId: string, day: number) => {
    const current = getStatus(childId, day);
    const currentIdx = current ? statusCycle.indexOf(current) : -1;
    const nextIdx = (currentIdx + 1) % statusCycle.length;
    updateAttendance({
      childId,
      year,
      month,
      day,
      status: statusCycle[nextIdx],
    });
  };

  const getMonthSummary = (childId: string) => {
    const records = attendance.filter(
      r => r.childId === childId && r.year === year && r.month === month
    );
    const present = records.filter(r => r.status === '○').length;
    const absent = records.filter(r => r.status === '×').length;
    return { present, absent };
  };

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const statusColors: Record<AttendanceStatus, string> = {
    '○': 'text-green-600 bg-green-50',
    '×': 'text-red-600 bg-red-50',
    '△': 'text-yellow-600 bg-yellow-50',
    '▽': 'text-blue-600 bg-blue-50',
    '-': 'text-gray-400 bg-gray-50',
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/documents" className="text-paragraph/60 hover:text-paragraph transition-colors text-sm">
              ← 書類一覧
            </Link>
            <h1 className="text-xl font-bold text-headline">出席簿</h1>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="px-3 py-1.5 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
            >
              <option value="all">全クラス</option>
              {classNames.map(cn => (
                <option key={cn} value={cn}>{cn}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary/20 transition-colors">
                <svg className="w-5 h-5 text-paragraph" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-medium text-headline min-w-[100px] text-center">
                {year}年{month}月
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary/20 transition-colors">
                <svg className="w-5 h-5 text-paragraph" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4">
        {/* 凡例 */}
        <div className="flex items-center gap-4 mb-4 text-xs text-paragraph/70">
          {statusCycle.map(s => (
            <span key={s} className="flex items-center gap-1">
              <span className={`w-6 h-6 flex items-center justify-center rounded text-sm font-medium ${statusColors[s]}`}>{s}</span>
              {attendanceStatusLabels[s]}
            </span>
          ))}
          <span className="text-paragraph/40 ml-2">セルクリックで切替</span>
        </div>

        {/* テーブル */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-secondary/10">
                <th className="sticky left-0 z-10 bg-secondary/10 px-3 py-2 text-left font-medium text-headline border border-secondary/20 min-w-[120px]">
                  園児名
                </th>
                {days.map(day => {
                  const dow = getDayOfWeek(year, month, day);
                  const isWeekend = dow === 0 || dow === 6;
                  return (
                    <th
                      key={day}
                      className={`px-1 py-2 text-center font-medium border border-secondary/20 min-w-[32px] ${
                        isWeekend ? 'bg-red-50/50 text-red-400' : 'text-headline'
                      }`}
                    >
                      <div className="text-xs">{day}</div>
                      <div className="text-[10px] text-paragraph/40">{dayNames[dow]}</div>
                    </th>
                  );
                })}
                <th className="px-2 py-2 text-center font-medium text-headline border border-secondary/20 min-w-[50px]">出席</th>
                <th className="px-2 py-2 text-center font-medium text-headline border border-secondary/20 min-w-[50px]">欠席</th>
              </tr>
            </thead>
            <tbody>
              {filteredChildren.map(child => {
                const summary = getMonthSummary(child.id);
                return (
                  <tr key={child.id} className="hover:bg-secondary/5">
                    <td className="sticky left-0 z-10 bg-surface px-3 py-2 text-headline font-medium border border-secondary/20 whitespace-nowrap">
                      {child.lastNameKanji || child.lastName} {child.firstNameKanji || child.firstName}
                    </td>
                    {days.map(day => {
                      const status = getStatus(child.id, day);
                      const dow = getDayOfWeek(year, month, day);
                      const isWeekend = dow === 0 || dow === 6;
                      return (
                        <td
                          key={day}
                          onClick={() => handleCellClick(child.id, day)}
                          className={`px-1 py-1 text-center border border-secondary/20 cursor-pointer hover:bg-button/10 transition-colors ${
                            isWeekend ? 'bg-red-50/30' : ''
                          }`}
                        >
                          {status && (
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium ${statusColors[status]}`}>
                              {status}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-center border border-secondary/20 font-medium text-green-600">
                      {summary.present}
                    </td>
                    <td className="px-2 py-2 text-center border border-secondary/20 font-medium text-red-600">
                      {summary.absent}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredChildren.length === 0 && (
          <div className="text-center py-12 text-paragraph/50">
            <p>園児データがありません</p>
          </div>
        )}
      </main>
    </div>
  );
}
