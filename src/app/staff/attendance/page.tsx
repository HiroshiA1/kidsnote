'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/components/AppLayout';
import {
    StaffAttendanceRecord,
    StaffAttendanceStatus,
    allStaffAttendanceStatuses,
    staffAttendanceStatusColors,
    createAttendanceFromShift,
    getDaysInMonth,
    getDayName,
    isWeekend,
} from '@/types/staffAttendance';
import Link from 'next/link';

export default function AttendancePage() {
    const {
        staff,
        currentStaffId,
        setCurrentStaffId,
        staffAttendance,
        updateStaffAttendance,
        shiftPatterns,
        shiftAssignments,
    } = useApp();

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [editingDay, setEditingDay] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<StaffAttendanceRecord | null>(null);

    const currentStaff = staff.find(s => s.id === currentStaffId);
    const daysInMonth = getDaysInMonth(year, month);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // シフトパターンマップ
    const patternMap = useMemo(() => {
        const map = new Map<string, typeof shiftPatterns[0]>();
        shiftPatterns.forEach(p => map.set(p.id, p));
        return map;
    }, [shiftPatterns]);

    // 当月の出勤レコードマップ
    const attendanceMap = useMemo(() => {
        if (!currentStaffId) return new Map<number, StaffAttendanceRecord>();
        const map = new Map<number, StaffAttendanceRecord>();
        staffAttendance
            .filter(a => a.staffId === currentStaffId && a.year === year && a.month === month)
            .forEach(a => map.set(a.day, a));
        return map;
    }, [staffAttendance, currentStaffId, year, month]);

    // 当月のシフト割当マップ
    const shiftMap = useMemo(() => {
        if (!currentStaffId) return new Map<number, string>();
        const map = new Map<number, string>();
        shiftAssignments
            .filter(a => a.staffId === currentStaffId && a.year === year && a.month === month)
            .forEach(a => map.set(a.day, a.patternId));
        return map;
    }, [shiftAssignments, currentStaffId, year, month]);

    const prevMonth = () => {
        if (month === 1) { setYear(y => y - 1); setMonth(12); }
        else { setMonth(m => m - 1); }
        setEditingDay(null);
    };
    const nextMonth = () => {
        if (month === 12) { setYear(y => y + 1); setMonth(1); }
        else { setMonth(m => m + 1); }
        setEditingDay(null);
    };

    // 日付クリック → 編集開始
    const handleDayClick = (day: number) => {
        if (!currentStaffId) return;
        setEditingDay(day);

        const existing = attendanceMap.get(day);
        if (existing) {
            setEditForm({ ...existing });
        } else {
            // シフトから自動セット
            const patternId = shiftMap.get(day);
            const pattern = patternId ? patternMap.get(patternId) : undefined;
            setEditForm(createAttendanceFromShift(currentStaffId, year, month, day, pattern));
        }
    };

    const saveForm = () => {
        if (!editForm) return;
        updateStaffAttendance(editForm);
        setEditingDay(null);
        setEditForm(null);
    };

    const cancelEdit = () => {
        setEditingDay(null);
        setEditForm(null);
    };

    // 月次集計
    const summary = useMemo(() => {
        const records = Array.from(attendanceMap.values());
        return {
            出勤: records.filter(r => r.status === '出勤').length,
            遅刻: records.filter(r => r.status === '遅刻').length,
            早退: records.filter(r => r.status === '早退').length,
            欠勤: records.filter(r => r.status === '欠勤').length,
            有給: records.filter(r => r.status === '有給').length,
            特休: records.filter(r => r.status === '特休').length,
            公休: records.filter(r => r.status === '公休').length,
        };
    }, [attendanceMap]);

    return (
        <div className="min-h-screen">
            <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-headline">出勤簿</h1>
                        <p className="text-sm text-paragraph/60 mt-0.5">個人の出退勤記録</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={prevMonth} className="p-2 hover:bg-secondary/20 rounded-lg transition-colors">
                            <svg className="w-5 h-5 text-paragraph" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-lg font-bold text-headline min-w-[120px] text-center">
                            {year}年{month}月
                        </span>
                        <button onClick={nextMonth} className="p-2 hover:bg-secondary/20 rounded-lg transition-colors">
                            <svg className="w-5 h-5 text-paragraph" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-6">
                {/* 職員セレクター */}
                <div className="mb-6 bg-surface rounded-xl p-4 shadow-sm border border-secondary/20">
                    <label className="block text-xs font-medium text-paragraph/70 mb-2">ログイン職員</label>
                    <select
                        value={currentStaffId || ''}
                        onChange={e => setCurrentStaffId(e.target.value || null)}
                        className="w-full px-4 py-2.5 bg-surface border border-secondary/30 rounded-lg text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
                    >
                        <option value="">職員を選択してください</option>
                        {staff.map(s => (
                            <option key={s.id} value={s.id}>{s.lastName} {s.firstName}（{s.role}）</option>
                        ))}
                    </select>
                </div>

                {!currentStaffId ? (
                    <div className="text-center py-20 text-paragraph/50">
                        <div className="w-16 h-16 mx-auto mb-4 bg-secondary/30 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-paragraph/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium mb-1">職員が選択されていません</p>
                        <p className="text-sm">上のセレクターからログイン職員を選択してください</p>
                    </div>
                ) : (
                    <>
                        {/* 管理者リンク */}
                        {(currentStaff?.role === '園長' || currentStaff?.role === '主任') && (
                            <div className="mb-4">
                                <Link href="/staff/attendance/admin" className="inline-flex items-center gap-2 px-4 py-2 bg-button/10 text-button text-sm rounded-lg hover:bg-button/20 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    管理者ビュー（全職員の出勤簿）
                                </Link>
                            </div>
                        )}

                        {/* カレンダー */}
                        <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                            <div className="grid grid-cols-7 bg-secondary/10">
                                {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                                    <div key={d} className={`py-2 text-center text-xs font-medium ${i === 0 || i === 6 ? 'text-red-400' : 'text-paragraph/60'}`}>
                                        {d}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7">
                                {/* 月初の空白セル */}
                                {Array.from({ length: new Date(year, month - 1, 1).getDay() }, (_, i) => (
                                    <div key={`empty-${i}`} className="border-t border-r border-secondary/10 min-h-[80px]" />
                                ))}

                                {days.map(day => {
                                    const record = attendanceMap.get(day);
                                    const patternId = shiftMap.get(day);
                                    const pattern = patternId ? patternMap.get(patternId) : undefined;
                                    const weekend = isWeekend(year, month, day);
                                    const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
                                    const isEditing = editingDay === day;

                                    return (
                                        <div
                                            key={day}
                                            onClick={() => !isEditing && handleDayClick(day)}
                                            className={`border-t border-r border-secondary/10 min-h-[80px] p-1.5 cursor-pointer hover:bg-button/5 transition-colors relative ${weekend ? 'bg-red-50/30' : ''
                                                } ${isEditing ? 'ring-2 ring-button/50 z-10' : ''}`}
                                        >
                                            <div className={`text-xs font-medium mb-1 ${isToday ? 'bg-button text-white w-5 h-5 rounded-full flex items-center justify-center' :
                                                    weekend ? 'text-red-400' : 'text-paragraph/70'
                                                }`}>
                                                {day}
                                            </div>

                                            {/* シフト予定 */}
                                            {pattern && (
                                                <div className="text-[10px] px-1 py-0.5 rounded mb-0.5" style={{ backgroundColor: pattern.color + '20', color: pattern.color }}>
                                                    {pattern.name}
                                                </div>
                                            )}

                                            {/* 出勤レコード */}
                                            {record && (
                                                <div className={`text-[10px] px-1 py-0.5 rounded ${staffAttendanceStatusColors[record.status]}`}>
                                                    {record.status}
                                                    {record.checkInTime && (
                                                        <span className="ml-0.5">{record.checkInTime}〜{record.checkOutTime}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 編集フォーム */}
                        {editingDay !== null && editForm && (
                            <div className="mt-4 bg-surface rounded-xl p-5 shadow-sm border border-button/30">
                                <h3 className="font-bold text-headline mb-3">
                                    {month}/{editingDay}（{getDayName(year, month, editingDay)}）の出勤記録
                                </h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-medium text-paragraph/70 mb-1">ステータス</label>
                                        <select
                                            value={editForm.status}
                                            onChange={e => setEditForm({ ...editForm, status: e.target.value as StaffAttendanceStatus })}
                                            className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
                                        >
                                            {allStaffAttendanceStatuses.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-paragraph/70 mb-1">備考</label>
                                        <input
                                            type="text"
                                            value={editForm.note || ''}
                                            onChange={e => setEditForm({ ...editForm, note: e.target.value })}
                                            placeholder="遅刻理由等"
                                            className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-paragraph/70 mb-1">出勤時刻</label>
                                        <input
                                            type="time"
                                            value={editForm.checkInTime}
                                            onChange={e => setEditForm({ ...editForm, checkInTime: e.target.value })}
                                            className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-paragraph/70 mb-1">退勤時刻</label>
                                        <input
                                            type="time"
                                            value={editForm.checkOutTime}
                                            onChange={e => setEditForm({ ...editForm, checkOutTime: e.target.value })}
                                            className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
                                        />
                                    </div>
                                </div>

                                {/* シフトからの自動セット表示 */}
                                {(() => {
                                    const patternId = shiftMap.get(editingDay);
                                    const pattern = patternId ? patternMap.get(patternId) : undefined;
                                    if (!pattern) return null;
                                    return (
                                        <div className="text-xs text-paragraph/50 mb-3 flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pattern.color }} />
                                            シフト予定: {pattern.name}（{pattern.startTime}〜{pattern.endTime}）→ 打刻時間に自動反映済み
                                        </div>
                                    );
                                })()}

                                <div className="flex gap-2 justify-end">
                                    <button onClick={cancelEdit} className="px-4 py-2 text-sm text-paragraph/70 hover:text-paragraph transition-colors">
                                        キャンセル
                                    </button>
                                    <button onClick={saveForm} className="px-6 py-2 bg-button text-white text-sm rounded-lg hover:bg-button/90 transition-colors">
                                        保存
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 月次集計 */}
                        <div className="mt-6 bg-surface rounded-xl p-5 shadow-sm border border-secondary/20">
                            <h3 className="font-bold text-headline mb-3">{month}月の集計</h3>
                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                                {(Object.entries(summary) as [StaffAttendanceStatus, number][]).map(([status, count]) => (
                                    <div key={status} className="text-center">
                                        <div className={`text-2xl font-bold ${count > 0 ? 'text-headline' : 'text-paragraph/30'}`}>{count}</div>
                                        <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${staffAttendanceStatusColors[status]}`}>{status}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
