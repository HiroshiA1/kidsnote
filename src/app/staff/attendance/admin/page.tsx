'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/components/AppLayout';
import {
    StaffAttendanceRecord,
    staffAttendanceStatusColors,
    getDaysInMonth,
    getDayName,
    isWeekend,
} from '@/types/staffAttendance';

export default function AdminAttendancePage() {
    const { staff, staffAttendance, shiftPatterns, shiftAssignments, updateStaffAttendance } = useApp();

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    const daysInMonth = getDaysInMonth(year, month);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const patternMap = useMemo(() => {
        const map = new Map<string, typeof shiftPatterns[0]>();
        shiftPatterns.forEach(p => map.set(p.id, p));
        return map;
    }, [shiftPatterns]);

    // 全職員の出勤レコードマップ: `${staffId}-${day}` -> record
    const attendanceMap = useMemo(() => {
        const map = new Map<string, StaffAttendanceRecord>();
        staffAttendance
            .filter(a => a.year === year && a.month === month)
            .forEach(a => map.set(`${a.staffId}-${a.day}`, a));
        return map;
    }, [staffAttendance, year, month]);

    // シフト割当マップ
    const shiftAssignmentMap = useMemo(() => {
        const map = new Map<string, string>();
        shiftAssignments
            .filter(a => a.year === year && a.month === month)
            .forEach(a => map.set(`${a.staffId}-${a.day}`, a.patternId));
        return map;
    }, [shiftAssignments, year, month]);

    const prevMonth = () => {
        if (month === 1) { setYear(y => y - 1); setMonth(12); }
        else { setMonth(m => m - 1); }
    };
    const nextMonth = () => {
        if (month === 12) { setYear(y => y + 1); setMonth(1); }
        else { setMonth(m => m + 1); }
    };

    // 確認トグル
    const toggleConfirm = (record: StaffAttendanceRecord) => {
        updateStaffAttendance({ ...record, confirmedByAdmin: !record.confirmedByAdmin });
    };

    // 職員ごとの集計
    const getStaffSummary = (staffId: string) => {
        const records = staffAttendance.filter(
            a => a.staffId === staffId && a.year === year && a.month === month
        );
        return {
            total: records.length,
            出勤: records.filter(r => r.status === '出勤').length,
            遅刻: records.filter(r => r.status === '遅刻').length,
            早退: records.filter(r => r.status === '早退').length,
            欠勤: records.filter(r => r.status === '欠勤').length,
            有給: records.filter(r => r.status === '有給').length,
            confirmed: records.filter(r => r.confirmedByAdmin).length,
        };
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen">
            <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20 print:hidden">
                <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-headline">出勤簿（管理者）</h1>
                        <p className="text-sm text-paragraph/60 mt-0.5">全職員の出勤状況確認・印刷</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrint} className="px-4 py-2 bg-button text-white text-sm rounded-lg hover:bg-button/90 transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            印刷
                        </button>
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

            {/* 印刷用ヘッダー */}
            <div className="hidden print:block px-6 py-4 border-b">
                <h1 className="text-xl font-bold text-center">出勤簿 {year}年{month}月</h1>
            </div>

            <main className="max-w-[1400px] mx-auto px-6 py-6">
                {/* マトリクス表 */}
                <div className="overflow-x-auto rounded-xl border border-secondary/20 bg-surface shadow-sm print:shadow-none print:border">
                    <table className="w-full text-sm border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-secondary/10 print:bg-gray-100">
                                <th className="sticky left-0 z-[5] bg-secondary/10 print:bg-gray-100 px-3 py-2 text-left border-r border-secondary/20 min-w-[100px]">
                                    職員
                                </th>
                                {days.map(day => {
                                    const dayName = getDayName(year, month, day);
                                    const weekend = isWeekend(year, month, day);
                                    return (
                                        <th
                                            key={day}
                                            className={`px-0.5 py-1 text-center border-r border-secondary/10 min-w-[32px] ${weekend ? 'bg-red-50/50' : ''
                                                }`}
                                        >
                                            <div className="text-[10px] font-medium">{day}</div>
                                            <div className={`text-[9px] ${weekend ? 'text-red-400' : 'text-paragraph/40'}`}>{dayName}</div>
                                        </th>
                                    );
                                })}
                                <th className="px-2 py-2 text-center border-l-2 border-secondary/30 text-xs min-w-[60px]">出勤</th>
                                <th className="px-2 py-2 text-center text-xs min-w-[40px]">遅</th>
                                <th className="px-2 py-2 text-center text-xs min-w-[40px]">欠</th>
                                <th className="px-2 py-2 text-center text-xs min-w-[40px]">有</th>
                                <th className="px-2 py-2 text-center text-xs min-w-[40px] print:hidden">✓</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map(s => {
                                const summary = getStaffSummary(s.id);
                                return (
                                    <tr key={s.id} className="hover:bg-secondary/5 border-t border-secondary/10">
                                        <td className="sticky left-0 z-[5] bg-surface px-2 py-1.5 border-r border-secondary/20">
                                            <div className="font-medium text-headline text-xs">{s.lastName} {s.firstName}</div>
                                            <div className="text-[10px] text-paragraph/50">{s.role}</div>
                                        </td>
                                        {days.map(day => {
                                            const key = `${s.id}-${day}`;
                                            const record = attendanceMap.get(key);
                                            const shiftPatternId = shiftAssignmentMap.get(key);
                                            const shiftPattern = shiftPatternId ? patternMap.get(shiftPatternId) : undefined;
                                            const weekend = isWeekend(year, month, day);

                                            // シフトとの差異検出
                                            const hasMismatch = record && shiftPattern && (
                                                (record.status === '遅刻' || record.status === '早退' || record.status === '欠勤') &&
                                                shiftPattern.name !== '公休'
                                            );

                                            return (
                                                <td
                                                    key={day}
                                                    className={`px-0 py-0.5 text-center border-r border-secondary/10 ${weekend && !record ? 'bg-red-50/30' : ''
                                                        } ${hasMismatch ? 'bg-yellow-50' : ''}`}
                                                    title={record ? `${record.status} ${record.checkInTime || ''}〜${record.checkOutTime || ''} ${record.note || ''}` : shiftPattern ? `予定: ${shiftPattern.name}` : ''}
                                                >
                                                    {record ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className={`text-[9px] px-0.5 rounded ${staffAttendanceStatusColors[record.status]}`}>
                                                                {record.status.slice(0, 1)}
                                                            </span>
                                                            {record.checkInTime && (
                                                                <span className="text-[8px] text-paragraph/40 leading-tight">{record.checkInTime}</span>
                                                            )}
                                                            {record.confirmedByAdmin && (
                                                                <span className="text-[8px] text-green-500 print:hidden">✓</span>
                                                            )}
                                                        </div>
                                                    ) : shiftPattern ? (
                                                        <div className="text-[9px] text-paragraph/30" style={{ color: shiftPattern.color }}>
                                                            {shiftPattern.name.slice(0, 1)}
                                                        </div>
                                                    ) : null}
                                                </td>
                                            );
                                        })}
                                        <td className="px-2 py-1 text-center border-l-2 border-secondary/30 font-medium text-xs">{summary.出勤}</td>
                                        <td className="px-2 py-1 text-center text-xs text-yellow-600">{summary.遅刻 || ''}</td>
                                        <td className="px-2 py-1 text-center text-xs text-red-500">{summary.欠勤 || ''}</td>
                                        <td className="px-2 py-1 text-center text-xs text-blue-500">{summary.有給 || ''}</td>
                                        <td className="px-2 py-1 text-center text-xs print:hidden">
                                            <span className="text-paragraph/50">{summary.confirmed}/{summary.total}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* 詳細セクション: 未確認レコード */}
                <div className="mt-6 print:hidden">
                    <h3 className="font-bold text-headline mb-3">未確認の出勤記録</h3>
                    {(() => {
                        const unconfirmed = staffAttendance.filter(
                            a => a.year === year && a.month === month && !a.confirmedByAdmin
                        );
                        if (unconfirmed.length === 0) {
                            return <p className="text-sm text-paragraph/50">すべて確認済みです 🎉</p>;
                        }
                        return (
                            <div className="space-y-2">
                                {unconfirmed.map(record => {
                                    const s = staff.find(st => st.id === record.staffId);
                                    return (
                                        <div key={`${record.staffId}-${record.day}`} className="flex items-center justify-between bg-surface rounded-lg border border-secondary/20 px-4 py-2.5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-headline">{s?.lastName} {s?.firstName}</span>
                                                <span className="text-xs text-paragraph/60">{month}/{record.day}（{getDayName(year, month, record.day)}）</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${staffAttendanceStatusColors[record.status]}`}>
                                                    {record.status}
                                                </span>
                                                {record.checkInTime && (
                                                    <span className="text-xs text-paragraph/50">{record.checkInTime}〜{record.checkOutTime}</span>
                                                )}
                                                {record.note && (
                                                    <span className="text-xs text-paragraph/40">({record.note})</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => toggleConfirm(record)}
                                                className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-lg hover:bg-green-100 transition-colors"
                                            >
                                                確認
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            </main>

            {/* 印刷用スタイル */}
            <style jsx global>{`
        @media print {
          body { font-size: 10px; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          main { padding: 0.5rem !important; }
          table { font-size: 9px; }
        }
      `}</style>
        </div>
    );
}
