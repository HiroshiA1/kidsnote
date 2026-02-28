'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/components/AppLayout';
import { isWeekend } from '@/types/staffAttendance';
import { defaultClasses } from '@/types/settings';

// ===== 型定義 =====
type AbsenceReason = '体調不良' | '家庭の事情' | '有給休暇' | '研修参加' | '忌引' | 'その他';
type AlertStatus = 'open' | 'assigned' | 'resolved';

interface AbsenceAlert {
    id: string;
    staffId: string;
    date: string;         // YYYY-MM-DD
    reason: AbsenceReason;
    reportedAt: Date;
    substituteId?: string;
    status: AlertStatus;
    note?: string;
}

interface ClassCoverage {
    classId: string;
    requiredStaff: number;    // 最低配置人数
    assignedStaffIds: string[];
}

// ===== サンプル =====
const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().split('T')[0];

const SAMPLE_ALERTS: AbsenceAlert[] = [
    {
        id: 'abs-1',
        staffId: '',    // will be filled dynamically
        date: todayStr,
        reason: '体調不良',
        reportedAt: new Date(today.getTime() - 2 * 3600000),
        status: 'open',
        note: '発熱のため当日連絡',
    },
];

// ===== ユーティリティ =====
function formatDate(d: string) {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });
}

const REASON_COLORS: Record<AbsenceReason, string> = {
    '体調不良': 'bg-red-100 text-red-600',
    '家庭の事情': 'bg-purple-100 text-purple-600',
    '有給休暇': 'bg-blue-100 text-blue-600',
    '研修参加': 'bg-green-100 text-green-600',
    '忌引': 'bg-gray-100 text-gray-600',
    'その他': 'bg-secondary/20 text-paragraph/70',
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; color: string; bg: string }> = {
    open: { label: '代替未定', color: 'text-red-600', bg: 'bg-red-100' },
    assigned: { label: '代替確定', color: 'text-blue-600', bg: 'bg-blue-100' },
    resolved: { label: '解決済み', color: 'text-green-600', bg: 'bg-green-100' },
};

// ===== 欠席登録モーダル =====
function AbsenceModal({ onClose, onSave, staffList, existingAlerts }: {
    onClose: () => void;
    onSave: (alert: AbsenceAlert) => void;
    staffList: { id: string; name: string; role: string }[];
    existingAlerts: AbsenceAlert[];
}) {
    const [staffId, setStaffId] = useState('');
    const [date, setDate] = useState(todayStr);
    const [reason, setReason] = useState<AbsenceReason>('体調不良');
    const [note, setNote] = useState('');

    const alreadyAbsent = existingAlerts.some(
        a => a.staffId === staffId && a.date === date && a.status !== 'resolved'
    );

    const handleSave = () => {
        if (!staffId) return;
        onSave({
            id: `abs-${Date.now()}`,
            staffId,
            date,
            reason,
            reportedAt: new Date(),
            status: 'open',
            note: note || undefined,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="px-6 pt-6 pb-4 border-b border-secondary/20">
                    <h2 className="text-lg font-bold text-headline">欠席・不在の登録</h2>
                    <p className="text-sm text-paragraph/60 mt-0.5">代替要員アラートが自動で発行されます</p>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-paragraph/80 mb-1">職員 *</label>
                        <select
                            value={staffId}
                            onChange={e => setStaffId(e.target.value)}
                            className="w-full px-3 py-2 border border-secondary/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-button/40"
                            autoFocus
                        >
                            <option value="">選択してください</option>
                            {staffList.map(s => (
                                <option key={s.id} value={s.id}>{s.name}（{s.role}）</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-paragraph/80 mb-1">対象日 *</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full px-3 py-2 border border-secondary/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-button/40"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-paragraph/80 mb-2">理由</label>
                        <div className="flex flex-wrap gap-2">
                            {(Object.keys(REASON_COLORS) as AbsenceReason[]).map(r => (
                                <button
                                    key={r}
                                    onClick={() => setReason(r)}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${reason === r ? 'bg-button text-white' : 'bg-secondary/20 text-paragraph/70 hover:bg-secondary/30'
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-paragraph/80 mb-1">備考</label>
                        <input
                            type="text"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="発熱のため当日連絡、など"
                            className="w-full px-3 py-2 border border-secondary/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-button/40"
                        />
                    </div>

                    {alreadyAbsent && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-600">
                            ⚠ この職員はすでにこの日に欠席登録されています
                        </div>
                    )}

                    <div className="p-3 bg-button/5 border border-button/20 rounded-xl text-xs text-button">
                        ✓ 登録後、管理者に自動アラートが通知されます
                    </div>
                </div>

                <div className="flex gap-2 px-6 py-4 border-t border-secondary/20">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm text-paragraph/60 hover:bg-secondary/20 rounded-xl transition-colors">
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!staffId || alreadyAbsent}
                        className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors text-sm disabled:opacity-40"
                    >
                        🔔 欠席を登録してアラート発行
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===== 代替要員割り当てモーダル =====
function SubstituteModal({ alert, staffList, onClose, onAssign, onResolve }: {
    alert: AbsenceAlert;
    staffList: { id: string; name: string; role: string }[];
    onClose: () => void;
    onAssign: (alertId: string, substituteId: string) => void;
    onResolve: (alertId: string) => void;
}) {
    const [substituteId, setSubstituteId] = useState(alert.substituteId ?? '');

    const absentStaff = staffList.find(s => s.id === alert.staffId);
    const substituteStaff = staffList.find(s => s.id === alert.substituteId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="px-6 pt-6 pb-4 border-b border-secondary/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl">
                            🚨
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-headline">代替要員の割り当て</h2>
                            <p className="text-sm text-paragraph/60">{formatDate(alert.date)} — {absentStaff?.name}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* 欠席情報 */}
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REASON_COLORS[alert.reason]}`}>{alert.reason}</span>
                            <span className="text-xs text-paragraph/60">報告: {alert.reportedAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {alert.note && <p className="text-sm text-paragraph/80">{alert.note}</p>}
                    </div>

                    {/* 現在の代替要員 */}
                    {substituteStaff && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-xs text-blue-600 font-medium mb-1">現在の代替要員</p>
                            <p className="text-sm font-medium text-blue-700">{substituteStaff.name}（{substituteStaff.role}）</p>
                        </div>
                    )}

                    {/* 代替要員選択 */}
                    {alert.status !== 'resolved' && (
                        <div>
                            <label className="block text-sm font-medium text-paragraph/80 mb-2">
                                代替要員を割り当て
                            </label>
                            <select
                                value={substituteId}
                                onChange={e => setSubstituteId(e.target.value)}
                                className="w-full px-3 py-2 border border-secondary/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-button/40"
                            >
                                <option value="">選択してください</option>
                                {staffList
                                    .filter(s => s.id !== alert.staffId)
                                    .map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}（{s.role}）{s.id === alert.substituteId ? ' ← 現在' : ''}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 px-6 py-4 border-t border-secondary/20">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm text-paragraph/60 hover:bg-secondary/20 rounded-xl transition-colors">
                        閉じる
                    </button>
                    {alert.status !== 'resolved' && (
                        <>
                            <button
                                onClick={() => { if (substituteId) onAssign(alert.id, substituteId); onClose(); }}
                                disabled={!substituteId}
                                className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors text-sm disabled:opacity-40"
                            >
                                代替要員を確定
                            </button>
                            <button
                                onClick={() => { onResolve(alert.id); onClose(); }}
                                className="px-4 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors text-sm"
                            >
                                解決済みにする
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ===== メインページ =====
export default function CoveragePage() {
    const { staff, shiftAssignments, shiftPatterns, settings } = useApp();
    const classes = settings.classes ?? defaultClasses;

    const staffList = staff.map(s => ({
        id: s.id,
        name: `${s.lastName} ${s.firstName}`,
        role: s.role,
    }));

    // 初期サンプルデータに最初の職員IDを入れる
    const [alerts, setAlerts] = useState<AbsenceAlert[]>(() => {
        if (staff.length === 0) return [];
        return SAMPLE_ALERTS.map(a => ({ ...a, staffId: a.staffId || staff[0].id }));
    });

    const [showAbsenceModal, setShowAbsenceModal] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<AbsenceAlert | null>(null);
    const [viewDate, setViewDate] = useState(todayStr);
    const [filterStatus, setFilterStatus] = useState<AlertStatus | 'all'>('all');

    // 当日のシフト配置状況
    const vd = new Date(viewDate + 'T00:00:00');
    const viewYear = vd.getFullYear();
    const viewMonth = vd.getMonth() + 1;
    const viewDay = vd.getDate();

    const dayAssignments = useMemo(() => {
        return shiftAssignments.filter(
            a => a.year === viewYear && a.month === viewMonth && a.day === viewDay
        );
    }, [shiftAssignments, viewYear, viewMonth, viewDay]);

    // その日の欠席者
    const dateAlerts = alerts.filter(a => a.date === viewDate && a.status !== 'resolved');
    const absentStaffIds = new Set(dateAlerts.map(a => a.staffId));

    // 実際に出勤している職員（欠席者を除外）
    const presentStaffIds = dayAssignments
        .filter(a => !absentStaffIds.has(a.staffId))
        .map(a => a.staffId);

    // クラスごとのカバレッジ（簡易: クラス数で均等割り）
    const coveragePerClass = useMemo((): ClassCoverage[] => {
        return classes.map(cls => {
            // 各クラスの必要人数（学齢により異なる、ここでは簡易版）
            const required = cls.grade === '年少' ? 3 : cls.grade === '年中' ? 2 : 2;
            // シフト表にそのクラス情報がないため、presentStaffIds の中から割り当て（均等分配の模擬）
            const idx = classes.indexOf(cls);
            const sliceSize = Math.ceil(presentStaffIds.length / classes.length);
            const assignedIds = presentStaffIds.slice(idx * sliceSize, (idx + 1) * sliceSize);
            return {
                classId: cls.id,
                requiredStaff: required,
                assignedStaffIds: assignedIds,
            };
        });
    }, [classes, presentStaffIds]);

    // アラート一覧（フィルター）
    const filteredAlerts = alerts
        .filter(a => filterStatus === 'all' || a.status === filterStatus)
        .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());

    // 未解決アラート数
    const openCount = alerts.filter(a => a.status === 'open').length;
    const assignedCount = alerts.filter(a => a.status === 'assigned').length;

    const handleAssign = (alertId: string, substituteId: string) => {
        setAlerts(prev => prev.map(a =>
            a.id === alertId ? { ...a, substituteId, status: 'assigned' } : a
        ));
    };

    const handleResolve = (alertId: string) => {
        setAlerts(prev => prev.map(a =>
            a.id === alertId ? { ...a, status: 'resolved' } : a
        ));
    };

    const isWeekendDay = isWeekend(viewYear, viewMonth, viewDay);
    const getStaffName = (id: string) => staffList.find(s => s.id === id)?.name ?? id;
    const getClassName = (id: string) => classes.find(c => c.id === id)?.name ?? id;
    const getClassColor = (id: string) => classes.find(c => c.id === id)?.color ?? '#888';
    const getClassGrade = (id: string) => classes.find(c => c.id === id)?.grade ?? '';

    return (
        <div className="min-h-screen">
            {/* ヘッダー */}
            <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-headline">配置管理・代替要員</h1>
                            <div className="flex gap-2">
                                {openCount > 0 && (
                                    <span className="px-2.5 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium animate-pulse">
                                        🚨 未対応 {openCount}件
                                    </span>
                                )}
                                {assignedCount > 0 && (
                                    <span className="px-2.5 py-1 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">
                                        ✓ 代替確定 {assignedCount}件
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAbsenceModal(true)}
                            className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008zm9.303-3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 4.878c.866-1.5 3.032-1.5 3.898 0L21.303 16.876z" />
                            </svg>
                            欠席を登録
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
                {/* ===== 当日配置状況 ===== */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold text-headline">📋 当日の配置確認</h2>
                        <input
                            type="date"
                            value={viewDate}
                            onChange={e => setViewDate(e.target.value)}
                            className="px-3 py-1.5 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40"
                        />
                    </div>

                    {isWeekendDay ? (
                        <div className="p-6 text-center bg-secondary/10 rounded-2xl">
                            <p className="text-paragraph/60">📅 この日は土日のため休園です</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {coveragePerClass.map(coverage => {
                                const cls = classes.find(c => c.id === coverage.classId)!;
                                if (!cls) return null;
                                const sufficient = coverage.assignedStaffIds.length >= coverage.requiredStaff;
                                const absentInClass = coverage.assignedStaffIds.filter(id => absentStaffIds.has(id));
                                const ratio = Math.min(coverage.assignedStaffIds.length / coverage.requiredStaff, 1);

                                return (
                                    <div
                                        key={coverage.classId}
                                        className={`bg-surface rounded-xl shadow-sm border-l-4 p-4 ${sufficient ? 'border-green-400' : 'border-red-400'
                                            }`}
                                        style={{ borderLeftColor: sufficient ? undefined : undefined }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: getClassColor(coverage.classId) }}
                                                />
                                                <span className="font-medium text-sm text-headline">{getClassName(coverage.classId)}</span>
                                                <span className="text-xs text-paragraph/50">{getClassGrade(coverage.classId)}</span>
                                            </div>
                                            <span className={`text-xs font-bold ${sufficient ? 'text-green-600' : 'text-red-600'}`}>
                                                {coverage.assignedStaffIds.length}/{coverage.requiredStaff}名
                                            </span>
                                        </div>

                                        {/* プログレスバー */}
                                        <div className="h-1.5 bg-secondary/20 rounded-full mb-2">
                                            <div
                                                className={`h-full rounded-full transition-all ${sufficient ? 'bg-green-400' : 'bg-red-400'}`}
                                                style={{ width: `${ratio * 100}%` }}
                                            />
                                        </div>

                                        {/* 配置職員 */}
                                        {coverage.assignedStaffIds.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {coverage.assignedStaffIds.map(id => (
                                                    <span
                                                        key={id}
                                                        className={`text-xs px-2 py-0.5 rounded-full ${absentStaffIds.has(id)
                                                                ? 'bg-red-100 text-red-500 line-through'
                                                                : 'bg-secondary/20 text-paragraph/70'
                                                            }`}
                                                    >
                                                        {getStaffName(id)}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-paragraph/40 italic">シフト未設定</p>
                                        )}

                                        {!sufficient && (
                                            <div className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                                </svg>
                                                人員不足（あと{coverage.requiredStaff - coverage.assignedStaffIds.length}名必要）
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 欠席者サマリー */}
                    {dateAlerts.length > 0 && (
                        <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm font-medium text-red-600 mb-2">🚨 {formatDate(viewDate)} の欠席者</p>
                            <div className="flex flex-wrap gap-2">
                                {dateAlerts.map(a => {
                                    const sc = STATUS_CONFIG[a.status];
                                    return (
                                        <div key={a.id} className="flex items-center gap-2 text-sm">
                                            <span className="font-medium text-red-700">{getStaffName(a.staffId)}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${REASON_COLORS[a.reason]}`}>{a.reason}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                                            {a.substituteId && (
                                                <span className="text-xs text-blue-600">→ {getStaffName(a.substituteId)}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </section>

                {/* ===== アラート一覧 ===== */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold text-headline">🔔 欠席アラート一覧</h2>
                        <div className="flex gap-1">
                            {(['all', 'open', 'assigned', 'resolved'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filterStatus === s
                                            ? s === 'open' ? 'bg-red-500 text-white'
                                                : s === 'assigned' ? 'bg-blue-500 text-white'
                                                    : s === 'resolved' ? 'bg-green-500 text-white'
                                                        : 'bg-button text-white'
                                            : 'bg-secondary/20 text-paragraph/70 hover:bg-secondary/30'
                                        }`}
                                >
                                    {s === 'all' ? 'すべて' : STATUS_CONFIG[s as AlertStatus].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredAlerts.length === 0 ? (
                        <div className="text-center py-16 bg-surface rounded-2xl border border-secondary/20">
                            <div className="text-4xl mb-3">✅</div>
                            <h3 className="font-medium text-headline mb-1">欠席アラートはありません</h3>
                            <p className="text-sm text-paragraph/60">全職員が予定通り出勤しています</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredAlerts.map(alert => {
                                const sc = STATUS_CONFIG[alert.status];
                                const substitute = staffList.find(s => s.id === alert.substituteId);
                                return (
                                    <div
                                        key={alert.id}
                                        className={`bg-surface rounded-xl shadow-sm border-l-4 p-4 cursor-pointer hover:shadow-md transition-all ${alert.status === 'open' ? 'border-red-400' :
                                                alert.status === 'assigned' ? 'border-blue-400' : 'border-green-400'
                                            }`}
                                        onClick={() => alert.status !== 'resolved' && setSelectedAlert(alert)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color}`}>
                                                        {sc.label}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${REASON_COLORS[alert.reason]}`}>
                                                        {alert.reason}
                                                    </span>
                                                    <span className="text-xs text-paragraph/50">{formatDate(alert.date)}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-headline">{getStaffName(alert.staffId)}</span>
                                                    {alert.status === 'open' && (
                                                        <span className="text-xs font-bold text-red-500 animate-pulse">→ 代替要員未定！</span>
                                                    )}
                                                    {substitute && (
                                                        <span className="text-sm text-blue-600">→ 代替: {substitute.name}</span>
                                                    )}
                                                </div>

                                                {alert.note && (
                                                    <p className="text-xs text-paragraph/60 mt-1">{alert.note}</p>
                                                )}
                                            </div>

                                            <div className="text-right flex-shrink-0">
                                                <p className="text-xs text-paragraph/50">
                                                    {alert.reportedAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 報告
                                                </p>
                                                {alert.status !== 'resolved' && (
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setSelectedAlert(alert); }}
                                                        className={`mt-1 text-xs px-3 py-1 rounded-lg transition-colors ${alert.status === 'open'
                                                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                            }`}
                                                    >
                                                        {alert.status === 'open' ? '代替を割り当て →' : '変更する'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ===== 統計サマリー ===== */}
                <section className="grid grid-cols-3 gap-4">
                    {[
                        { label: '今月の欠席', value: alerts.length, color: 'text-paragraph', bg: 'bg-secondary/10' },
                        { label: '代替未対応', value: openCount, color: 'text-red-600', bg: 'bg-red-50' },
                        { label: '代替対応済み', value: alerts.length - openCount, color: 'text-green-600', bg: 'bg-green-50' },
                    ].map(stat => (
                        <div key={stat.label} className={`${stat.bg} rounded-xl p-4 text-center`}>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-paragraph/60 mt-1">{stat.label}</p>
                        </div>
                    ))}
                </section>
            </main>

            {/* 欠席登録モーダル */}
            {showAbsenceModal && (
                <AbsenceModal
                    onClose={() => setShowAbsenceModal(false)}
                    onSave={alert => setAlerts(prev => [alert, ...prev])}
                    staffList={staffList}
                    existingAlerts={alerts}
                />
            )}

            {/* 代替要員割り当てモーダル */}
            {selectedAlert && (
                <SubstituteModal
                    alert={selectedAlert}
                    staffList={staffList}
                    onClose={() => setSelectedAlert(null)}
                    onAssign={handleAssign}
                    onResolve={handleResolve}
                />
            )}
        </div>
    );
}
