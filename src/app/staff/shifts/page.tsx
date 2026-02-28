'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '@/components/AppLayout';
import { getDaysInMonth, getDayName, isWeekend } from '@/types/staffAttendance';
import Link from 'next/link';

// 最低配置基準（簡易版: 全体で必要な最低人数）
const MIN_STAFF_PER_DAY = 5;
// 預かり保育の時間帯
const EXTENDED_CARE_LABEL = '預かり';

interface SubstituteRequest {
  id: string;
  date: number; // day of month
  originalStaffId: string;
  reason: string;
  substituteStaffId?: string;
  status: 'open' | 'assigned' | 'cancelled';
}

export default function ShiftSchedulePage() {
    const { staff, shiftPatterns, shiftAssignments, setShiftAssignments } = useApp();
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [popover, setPopover] = useState<{ staffId: string; day: number; x: number; y: number } | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [showAlerts, setShowAlerts] = useState(true);
    const [substituteRequests, setSubstituteRequests] = useState<SubstituteRequest[]>([]);
    const [showSubstituteModal, setShowSubstituteModal] = useState<{ day: number; staffId: string } | null>(null);
    const [substituteForm, setSubstituteForm] = useState({ reason: '', substituteId: '' });

    const daysInMonth = getDaysInMonth(year, month);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const assignmentMap = useMemo(() => {
        const map = new Map<string, string>();
        shiftAssignments
            .filter(a => a.year === year && a.month === month)
            .forEach(a => map.set(`${a.staffId}-${a.day}`, a.patternId));
        return map;
    }, [shiftAssignments, year, month]);

    const patternMap = useMemo(() => {
        const map = new Map<string, typeof shiftPatterns[0]>();
        shiftPatterns.forEach(p => map.set(p.id, p));
        return map;
    }, [shiftPatterns]);

    // 日ごとの配置人数
    const dailyStaffCount = useMemo(() => {
        const counts = new Map<number, number>();
        for (const day of days) {
            let count = 0;
            for (const s of staff) {
                const key = `${s.id}-${day}`;
                if (assignmentMap.has(key)) count++;
            }
            counts.set(day, count);
        }
        return counts;
    }, [days, staff, assignmentMap]);

    // 人員不足の日
    const understaffedDays = useMemo(() => {
        return days.filter(day => {
            if (isWeekend(year, month, day)) return false;
            const count = dailyStaffCount.get(day) ?? 0;
            return count < MIN_STAFF_PER_DAY && count > 0; // 0は休日の可能性
        });
    }, [days, dailyStaffCount, year, month]);

    // 預かり保育パターンの検出
    const extendedCarePattern = useMemo(() => {
        return shiftPatterns.find(p =>
            p.name.includes('預かり') || p.name.includes('延長') ||
            (parseInt(p.endTime) >= 18)
        );
    }, [shiftPatterns]);

    // 預かり保育カバー状況
    const extendedCareDays = useMemo(() => {
        if (!extendedCarePattern) return new Set<number>();
        const covered = new Set<number>();
        for (const day of days) {
            if (isWeekend(year, month, day)) continue;
            for (const s of staff) {
                const patternId = assignmentMap.get(`${s.id}-${day}`);
                if (patternId === extendedCarePattern.id) {
                    covered.add(day);
                    break;
                }
            }
        }
        return covered;
    }, [days, staff, assignmentMap, extendedCarePattern, year, month]);

    const uncoveredExtendedDays = useMemo(() => {
        if (!extendedCarePattern) return [];
        return days.filter(day => !isWeekend(year, month, day) && !extendedCareDays.has(day));
    }, [days, extendedCareDays, extendedCarePattern, year, month]);

    // 代替要員リクエスト（今月分）
    const monthRequests = substituteRequests.filter(r => r.status !== 'cancelled');
    const openRequests = monthRequests.filter(r => r.status === 'open');

    const handleCellClick = (staffId: string, day: number, e: React.MouseEvent) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setPopover({ staffId, day, x: rect.left, y: rect.bottom + 4 });
    };

    const assignPattern = (patternId: string | null) => {
        if (!popover) return;
        const { staffId, day } = popover;

        const filtered = shiftAssignments.filter(
            a => !(a.staffId === staffId && a.year === year && a.month === month && a.day === day)
        );
        if (patternId) {
            filtered.push({ staffId, year, month, day, patternId });
        }
        setShiftAssignments(filtered);
        setPopover(null);
    };

    const prevMonth = () => {
        if (month === 1) { setYear(y => y - 1); setMonth(12); }
        else { setMonth(m => m - 1); }
    };
    const nextMonth = () => {
        if (month === 12) { setYear(y => y + 1); setMonth(1); }
        else { setMonth(m => m + 1); }
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setPopover(null);
            }
        };
        if (popover) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [popover]);

    const getPatternCount = (staffId: string, patternId: string) => {
        return shiftAssignments.filter(
            a => a.staffId === staffId && a.year === year && a.month === month && a.patternId === patternId
        ).length;
    };

    const getStaffName = (id: string) => {
        const s = staff.find(s => s.id === id);
        return s ? `${s.lastName} ${s.firstName}` : '';
    };

    // 代替要員リクエスト
    const openSubstituteModal = (day: number, staffId: string) => {
        setSubstituteForm({ reason: '', substituteId: '' });
        setShowSubstituteModal({ day, staffId });
    };

    const submitSubstituteRequest = () => {
        if (!showSubstituteModal || !substituteForm.reason) return;
        const req: SubstituteRequest = {
            id: `sub-${Date.now()}`,
            date: showSubstituteModal.day,
            originalStaffId: showSubstituteModal.staffId,
            reason: substituteForm.reason,
            substituteStaffId: substituteForm.substituteId || undefined,
            status: substituteForm.substituteId ? 'assigned' : 'open',
        };
        setSubstituteRequests(prev => [...prev, req]);

        // 代替要員が指定された場合、自動でシフトを割り当て
        if (substituteForm.substituteId) {
            const originalPattern = assignmentMap.get(`${showSubstituteModal.staffId}-${showSubstituteModal.day}`);
            if (originalPattern) {
                const filtered = shiftAssignments.filter(
                    a => !(a.staffId === showSubstituteModal.staffId && a.year === year && a.month === month && a.day === showSubstituteModal.day)
                );
                filtered.push({
                    staffId: substituteForm.substituteId,
                    year, month,
                    day: showSubstituteModal.day,
                    patternId: originalPattern,
                });
                setShiftAssignments(filtered);
            }
        }

        setShowSubstituteModal(null);
    };

    // その日にシフトが入っていない職員（代替候補）
    const getAvailableStaff = (day: number, excludeId: string) => {
        return staff.filter(s => {
            if (s.id === excludeId) return false;
            return !assignmentMap.has(`${s.id}-${day}`);
        });
    };

    const hasAlerts = understaffedDays.length > 0 || uncoveredExtendedDays.length > 0 || openRequests.length > 0;

    return (
        <div className="min-h-screen">
            <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
                <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-headline">シフト管理</h1>
                        <p className="text-sm text-paragraph/60 mt-0.5">月間シフト表の作成・編集</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {hasAlerts && (
                            <button
                                onClick={() => setShowAlerts(!showAlerts)}
                                className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                                    showAlerts ? 'bg-alert/10 text-alert' : 'bg-secondary/20 text-paragraph/60'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                アラート ({understaffedDays.length + uncoveredExtendedDays.length + openRequests.length})
                            </button>
                        )}
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

            <main className="max-w-[1400px] mx-auto px-6 py-6">
                {/* アラートパネル */}
                {showAlerts && hasAlerts && (
                    <div className="mb-4 space-y-2">
                        {understaffedDays.length > 0 && (
                            <div className="flex items-start gap-3 p-3 bg-alert/10 border border-alert/20 rounded-lg">
                                <svg className="w-5 h-5 text-alert flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                <div>
                                    <div className="text-sm font-medium text-alert">人員不足（最低{MIN_STAFF_PER_DAY}名）</div>
                                    <div className="text-xs text-paragraph/70 mt-0.5">
                                        {understaffedDays.map(d => `${d}日(${dailyStaffCount.get(d)}名)`).join('、')}
                                    </div>
                                </div>
                            </div>
                        )}
                        {uncoveredExtendedDays.length > 0 && extendedCarePattern && (
                            <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <div className="text-sm font-medium text-orange-600">{EXTENDED_CARE_LABEL}保育 未配置</div>
                                    <div className="text-xs text-paragraph/70 mt-0.5">
                                        {uncoveredExtendedDays.slice(0, 10).map(d => `${d}日`).join('、')}
                                        {uncoveredExtendedDays.length > 10 && ` 他${uncoveredExtendedDays.length - 10}日`}
                                    </div>
                                </div>
                            </div>
                        )}
                        {openRequests.length > 0 && (
                            <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                                <div>
                                    <div className="text-sm font-medium text-purple-600">代替要員未定</div>
                                    <div className="text-xs text-paragraph/70 mt-0.5">
                                        {openRequests.map(r => `${r.date}日 ${getStaffName(r.originalStaffId)}（${r.reason}）`).join('、')}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 凡例 */}
                <div className="flex flex-wrap gap-3 mb-4 items-center">
                    <span className="text-xs text-paragraph/60 font-medium">凡例:</span>
                    {shiftPatterns.map(p => (
                        <div key={p.id} className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-xs text-paragraph">{p.name}（{p.startTime}〜{p.endTime}）</span>
                        </div>
                    ))}
                    {shiftPatterns.length === 0 && (
                        <Link href="/settings" className="text-xs text-button hover:underline">
                            設定画面でシフトパターンを作成してください →
                        </Link>
                    )}
                </div>

                {/* シフト表 */}
                <div className="overflow-x-auto rounded-xl border border-secondary/20 bg-surface shadow-sm">
                    <table className="w-full text-sm border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-secondary/10">
                                <th className="sticky left-0 z-[5] bg-secondary/10 px-3 py-2 text-left border-r border-secondary/20 min-w-[120px]">
                                    職員
                                </th>
                                {days.map(day => {
                                    const dayName = getDayName(year, month, day);
                                    const weekend = isWeekend(year, month, day);
                                    const count = dailyStaffCount.get(day) ?? 0;
                                    const understaffed = !weekend && count > 0 && count < MIN_STAFF_PER_DAY;

                                    return (
                                        <th
                                            key={day}
                                            className={`px-1 py-2 text-center border-r border-secondary/10 min-w-[40px] ${
                                                understaffed ? 'bg-alert/10' : weekend ? 'bg-red-50/50' : ''
                                            }`}
                                        >
                                            <div className="text-xs font-medium">{day}</div>
                                            <div className={`text-[10px] ${weekend ? 'text-red-400' : 'text-paragraph/40'}`}>{dayName}</div>
                                            {!weekend && (
                                                <div className={`text-[9px] mt-0.5 ${understaffed ? 'text-alert font-bold' : 'text-paragraph/30'}`}>
                                                    {count}名
                                                </div>
                                            )}
                                        </th>
                                    );
                                })}
                                {shiftPatterns.length > 0 && (
                                    <th className="px-2 py-2 text-center border-l-2 border-secondary/30 min-w-[80px]">集計</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map(s => (
                                <tr key={s.id} className="hover:bg-secondary/5 border-t border-secondary/10">
                                    <td className="sticky left-0 z-[5] bg-surface px-3 py-2 border-r border-secondary/20">
                                        <div className="font-medium text-headline text-xs">{s.lastName} {s.firstName}</div>
                                        <div className="text-[10px] text-paragraph/50">{s.role}</div>
                                    </td>
                                    {days.map(day => {
                                        const key = `${s.id}-${day}`;
                                        const patternId = assignmentMap.get(key);
                                        const pattern = patternId ? patternMap.get(patternId) : undefined;
                                        const weekend = isWeekend(year, month, day);
                                        const hasSubRequest = monthRequests.some(
                                            r => r.date === day && r.originalStaffId === s.id
                                        );

                                        return (
                                            <td
                                                key={day}
                                                onClick={(e) => handleCellClick(s.id, day, e)}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    if (pattern) openSubstituteModal(day, s.id);
                                                }}
                                                className={`px-0.5 py-1 text-center border-r border-secondary/10 cursor-pointer hover:bg-button/5 transition-colors relative ${
                                                    weekend && !pattern ? 'bg-red-50/30' : ''
                                                }`}
                                                title={pattern ? `${pattern.name} - 右クリックで代替要員申請` : ''}
                                            >
                                                {pattern && (
                                                    <div
                                                        className="mx-auto rounded px-1 py-0.5 text-[10px] font-medium text-white leading-tight"
                                                        style={{ backgroundColor: pattern.color }}
                                                    >
                                                        {pattern.name.slice(0, 2)}
                                                    </div>
                                                )}
                                                {hasSubRequest && (
                                                    <div className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-full" title="代替要員リクエストあり" />
                                                )}
                                            </td>
                                        );
                                    })}
                                    {shiftPatterns.length > 0 && (
                                        <td className="px-2 py-1 border-l-2 border-secondary/30">
                                            <div className="flex flex-wrap gap-1 justify-center">
                                                {shiftPatterns.map(p => {
                                                    const count = getPatternCount(s.id, p.id);
                                                    if (count === 0) return null;
                                                    return (
                                                        <span key={p.id} className="text-[10px] font-medium px-1 rounded" style={{ backgroundColor: p.color + '30', color: p.color }}>
                                                            {p.name.slice(0, 1)}{count}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ポップオーバー */}
                {popover && (
                    <div
                        ref={popoverRef}
                        className="fixed z-50 bg-surface rounded-xl shadow-lg border border-secondary/20 p-2 min-w-[180px]"
                        style={{ left: Math.min(popover.x, window.innerWidth - 200), top: popover.y }}
                    >
                        <div className="text-xs text-paragraph/50 px-2 py-1 mb-1">
                            {month}/{popover.day} のシフト
                        </div>
                        {shiftPatterns.map(p => (
                            <button
                                key={p.id}
                                onClick={() => assignPattern(p.id)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-headline hover:bg-secondary/10 rounded-lg transition-colors"
                            >
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                                <span>{p.name}</span>
                                <span className="text-xs text-paragraph/50 ml-auto">{p.startTime}〜{p.endTime}</span>
                            </button>
                        ))}
                        <hr className="my-1 border-secondary/20" />
                        <button
                            onClick={() => {
                                openSubstituteModal(popover.day, popover.staffId);
                                setPopover(null);
                            }}
                            className="w-full text-left px-2 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                            代替要員を申請
                        </button>
                        <button
                            onClick={() => assignPattern(null)}
                            className="w-full text-left px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            クリア
                        </button>
                    </div>
                )}
            </main>

            {/* 代替要員申請モーダル */}
            {showSubstituteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowSubstituteModal(null)}>
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-headline mb-1">代替要員の申請</h3>
                        <p className="text-sm text-paragraph/60 mb-4">
                            {month}月{showSubstituteModal.day}日 - {getStaffName(showSubstituteModal.staffId)}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-paragraph/80 mb-1">理由 *</label>
                                <select
                                    value={substituteForm.reason}
                                    onChange={e => setSubstituteForm(f => ({ ...f, reason: e.target.value }))}
                                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                >
                                    <option value="">選択してください</option>
                                    <option value="体調不良">体調不良</option>
                                    <option value="家庭の事情">家庭の事情</option>
                                    <option value="研修参加">研修参加</option>
                                    <option value="有給休暇">有給休暇</option>
                                    <option value="その他">その他</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-paragraph/80 mb-1">代替要員（任意）</label>
                                <select
                                    value={substituteForm.substituteId}
                                    onChange={e => setSubstituteForm(f => ({ ...f, substituteId: e.target.value }))}
                                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                >
                                    <option value="">未定（後で割り当て）</option>
                                    {getAvailableStaff(showSubstituteModal.day, showSubstituteModal.staffId).map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.lastName} {s.firstName}（{s.role}）
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-paragraph/50 mt-1">
                                    この日にシフトが入っていない職員が表示されます
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowSubstituteModal(null)}
                                className="px-4 py-2 text-sm text-paragraph/70 hover:bg-secondary/20 rounded-lg transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={submitSubstituteRequest}
                                disabled={!substituteForm.reason}
                                className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-40"
                            >
                                申請する
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
