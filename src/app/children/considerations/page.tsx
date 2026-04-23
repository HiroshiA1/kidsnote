'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppLayout';
import { ChildWithGrowth } from '@/lib/childrenStore';

// ===== 型定義 =====
type ConsiderationCategory =
    | 'allergy'       // アレルギー
    | 'medical'       // 医療・健康
    | 'support'       // 個別支援ニーズ
    | 'family'        // 家庭環境
    | 'behavior'      // 行動特性
    | 'diet'          // 食事制限
    | 'other';        // その他

type Visibility = 'staff_only' | 'guardians_allowed';
type Priority = 'high' | 'medium' | 'low';

interface Consideration {
    id: string;
    childId: string;
    category: ConsiderationCategory;
    title: string;
    detail: string;
    priority: Priority;
    visibility: Visibility;
    startDate?: string;   // YYYY-MM-DD
    reviewDate?: string;  // 見直し予定日
    updatedAt: Date;
    updatedBy: string;
}

// ===== カテゴリ設定 =====
const CATEGORY_CONFIG: Record<ConsiderationCategory, { label: string; emoji: string; color: string; bg: string }> = {
    allergy: { label: 'アレルギー', emoji: '🚨', color: 'text-red-600', bg: 'bg-red-50    border-red-200' },
    medical: { label: '医療・健康', emoji: '🏥', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
    support: { label: '個別支援', emoji: '🤝', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
    family: { label: '家庭環境', emoji: '🏠', color: 'text-blue-600', bg: 'bg-blue-50   border-blue-200' },
    behavior: { label: '行動特性', emoji: '💡', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
    diet: { label: '食事制限', emoji: '🍽️', color: 'text-green-600', bg: 'bg-green-50  border-green-200' },
    other: { label: 'その他', emoji: '📋', color: 'text-gray-600', bg: 'bg-gray-50   border-gray-200' },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
    high: { label: '要注意', color: 'text-red-600', bg: 'bg-red-100' },
    medium: { label: '注意', color: 'text-orange-600', bg: 'bg-orange-100' },
    low: { label: '参考', color: 'text-gray-600', bg: 'bg-gray-100' },
};

// ===== サンプルデータ生成 =====
function generateSampleConsiderations(children: ChildWithGrowth[]): Consideration[] {
    const samples: Consideration[] = [];
    const now = new Date();

    children.slice(0, 5).forEach((child, i) => {
        // アレルギー -> 既存のallergiesから
        child.allergies.forEach((allergy, ai) => {
            samples.push({
                id: `allergy-${child.id}-${ai}`,
                childId: child.id,
                category: 'allergy',
                title: `${allergy}アレルギー`,
                detail: `${allergy}を含む食品は除去してください。接触にも注意が必要です。エピペン処方あり（保健室保管）。`,
                priority: 'high',
                visibility: 'staff_only',
                startDate: '2024-04-01',
                reviewDate: '2026-04-01',
                updatedAt: new Date(now.getTime() - i * 86400000),
                updatedBy: '田中 先生',
            });
        });

        // 個別支援
        if (i === 0) {
            samples.push({
                id: `support-${child.id}`,
                childId: child.id,
                category: 'support',
                title: '言語発達の遅れ',
                detail: '語彙の習得が同年齢より遅め。コミュニケーション支援士と連携中。絵カードを使った視覚的なコミュニケーションが有効。',
                priority: 'medium',
                visibility: 'staff_only',
                startDate: '2025-06-01',
                reviewDate: '2026-03-31',
                updatedAt: new Date(now.getTime() - 2 * 86400000),
                updatedBy: '佐藤 先生',
            });
        }

        if (i === 1) {
            samples.push({
                id: `medical-${child.id}`,
                childId: child.id,
                category: 'medical',
                title: '喘息（軽症）',
                detail: '運動負荷や気温変化で発作が起こることがある。吸入薬を所持。激しい運動後は休憩を促す。主治医：こども病院 鈴木医師。',
                priority: 'high',
                visibility: 'staff_only',
                startDate: '2024-09-01',
                updatedAt: new Date(now.getTime() - 5 * 86400000),
                updatedBy: '山田 先生',
            });
        }

        if (i === 2) {
            samples.push({
                id: `family-${child.id}`,
                childId: child.id,
                category: 'family',
                title: '両親離婚・親権者について',
                detail: '母親が親権者。父親は面会禁止の裁判所命令あり。お迎えは母親・祖母のみ許可。父親が来園した場合は即座に園長へ連絡。',
                priority: 'high',
                visibility: 'staff_only',
                startDate: '2025-01-15',
                updatedAt: new Date(now.getTime() - 10 * 86400000),
                updatedBy: '園長',
            });
            samples.push({
                id: `behavior-${child.id}`,
                childId: child.id,
                category: 'behavior',
                title: '感覚過敏（聴覚）',
                detail: '急な大きな音に対して強いストレス反応を示す。運動会・発表会など大音量のイベント前に事前説明をする。耳栓の使用も許可済。',
                priority: 'medium',
                visibility: 'staff_only',
                reviewDate: '2026-06-01',
                updatedAt: new Date(now.getTime() - 3 * 86400000),
                updatedBy: '田中 先生',
            });
        }

        if (i === 3) {
            samples.push({
                id: `diet-${child.id}`,
                childId: child.id,
                category: 'diet',
                title: '宗教上の食事制限（ハラール）',
                detail: '豚肉・豚由来食品は禁止。アルコール成分のある調味料も不可。給食メニュー確認済み（栄養士と連携）。代替食を提供。',
                priority: 'medium',
                visibility: 'guardians_allowed',
                startDate: '2024-04-01',
                updatedAt: new Date(now.getTime() - 30 * 86400000),
                updatedBy: '給食担当',
            });
        }
    });

    return samples;
}

// ===== 編集モーダル =====
function ConsiderationModal({
    consideration,
    childName,
    onClose,
    onSave,
    onDelete,
    staffName,
}: {
    consideration: Consideration | null;
    childName: string;
    onClose: () => void;
    onSave: (c: Consideration) => void;
    onDelete?: (id: string) => void;
    staffName: string;
}) {
    const isNew = !consideration;
    const [form, setForm] = useState<Omit<Consideration, 'id' | 'updatedAt' | 'updatedBy'>>({
        childId: consideration?.childId ?? '',
        category: consideration?.category ?? 'allergy',
        title: consideration?.title ?? '',
        detail: consideration?.detail ?? '',
        priority: consideration?.priority ?? 'medium',
        visibility: consideration?.visibility ?? 'staff_only',
        startDate: consideration?.startDate ?? '',
        reviewDate: consideration?.reviewDate ?? '',
    });

    const handleSave = () => {
        if (!form.title) return;
        onSave({
            ...form,
            id: consideration?.id ?? `c-${Date.now()}`,
            updatedAt: new Date(),
            updatedBy: staffName,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50" />
            <div
                className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-surface px-6 pt-6 pb-4 border-b border-secondary/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-headline">
                                {isNew ? '配慮事項を追加' : '配慮事項を編集'}
                            </h2>
                            <p className="text-sm text-paragraph/60 mt-0.5">{childName}</p>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-secondary/20 rounded-lg text-paragraph/60 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* カテゴリ */}
                    <div>
                        <label className="block text-sm font-medium text-paragraph/80 mb-2">カテゴリ</label>
                        <div className="grid grid-cols-4 gap-1.5">
                            {(Object.entries(CATEGORY_CONFIG) as [ConsiderationCategory, typeof CATEGORY_CONFIG[ConsiderationCategory]][]).map(([key, cfg]) => (
                                <button
                                    key={key}
                                    onClick={() => setForm(f => ({ ...f, category: key }))}
                                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-xs transition-colors ${form.category === key
                                            ? 'bg-button text-white'
                                            : 'bg-secondary/20 text-paragraph/70 hover:bg-secondary/30'
                                        }`}
                                >
                                    <span className="text-lg leading-none">{cfg.emoji}</span>
                                    <span>{cfg.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* タイトル */}
                    <div>
                        <label className="block text-sm font-medium text-paragraph/80 mb-1">タイトル *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="例: 卵アレルギー、感覚過敏（聴覚）など"
                            className="w-full px-3 py-2 border border-secondary/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-button/40"
                            autoFocus
                        />
                    </div>

                    {/* 詳細 */}
                    <div>
                        <label className="block text-sm font-medium text-paragraph/80 mb-1">詳細・対応方針</label>
                        <textarea
                            value={form.detail}
                            onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
                            rows={4}
                            placeholder="具体的な対応方法、注意事項、関係機関との連携内容など..."
                            className="w-full px-3 py-2 border border-secondary/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-button/40 resize-none"
                        />
                    </div>

                    {/* 優先度・公開範囲 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-paragraph/80 mb-2">重要度</label>
                            <div className="flex flex-col gap-1">
                                {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, cfg]) => (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="priority"
                                            checked={form.priority === key}
                                            onChange={() => setForm(f => ({ ...f, priority: key }))}
                                            className="accent-button"
                                        />
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-paragraph/80 mb-2">公開範囲</label>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        checked={form.visibility === 'staff_only'}
                                        onChange={() => setForm(f => ({ ...f, visibility: 'staff_only' }))}
                                        className="accent-button mt-0.5"
                                    />
                                    <div>
                                        <p className="text-xs font-medium text-paragraph">職員のみ</p>
                                        <p className="text-xs text-paragraph/50">保護者には非表示</p>
                                    </div>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        checked={form.visibility === 'guardians_allowed'}
                                        onChange={() => setForm(f => ({ ...f, visibility: 'guardians_allowed' }))}
                                        className="accent-button mt-0.5"
                                    />
                                    <div>
                                        <p className="text-xs font-medium text-paragraph">保護者にも公開</p>
                                        <p className="text-xs text-paragraph/50">連絡帳等で共有</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 日程 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-paragraph/80 mb-1">開始日</label>
                            <input
                                type="date"
                                value={form.startDate ?? ''}
                                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-secondary/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-button/40"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-paragraph/80 mb-1">見直し予定日</label>
                            <input
                                type="date"
                                value={form.reviewDate ?? ''}
                                onChange={e => setForm(f => ({ ...f, reviewDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-secondary/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-button/40"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 px-6 py-4 border-t border-secondary/20">
                    {!isNew && onDelete && (
                        <button
                            onClick={() => { onDelete(consideration!.id); onClose(); }}
                            className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                            削除
                        </button>
                    )}
                    <div className="flex-1" />
                    <button onClick={onClose} className="px-4 py-2.5 text-sm text-paragraph/60 hover:bg-secondary/20 rounded-xl transition-colors">
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!form.title}
                        className="px-6 py-2.5 bg-button text-white rounded-xl font-medium hover:bg-button/90 transition-colors text-sm disabled:opacity-40"
                    >
                        {isNew ? '追加する' : '保存する'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===== メインページ =====
export default function ConsiderationsPage() {
    const { children: childrenData, staff } = useApp();
    const staffName = staff.length > 0 ? `${staff[0].lastName} ${staff[0].firstName}` : '職員';

    const [considerations, setConsiderations] = useState<Consideration[]>(() =>
        generateSampleConsiderations(childrenData)
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<ConsiderationCategory | 'all'>('all');
    const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
    const [filterClass, setFilterClass] = useState('all');
    const [viewMode, setViewMode] = useState<'by-child' | 'by-category'>('by-child');
    const [showModal, setShowModal] = useState<{
        mode: 'add';
        childId: string;
    } | {
        mode: 'edit';
        consideration: Consideration;
    } | null>(null);

    // クラス一覧 — 退園済み園児は含めない
    const classes = useMemo(() => {
        return [...new Set(childrenData.filter(c => !c.archivedAt).map(c => c.className))].sort();
    }, [childrenData]);

    // 各 childId → child のマップ(過去の consideration で archived 園児が紐付いていても
    // 名前解決できるよう、マップ自体は archived 含む全園児を保持)
    const childMap = useMemo(() => {
        const m = new Map<string, ChildWithGrowth>();
        childrenData.forEach(c => m.set(c.id, c));
        return m;
    }, [childrenData]);

    const getChildName = (id: string) => {
        const c = childMap.get(id);
        return c ? `${c.lastName} ${c.firstName}` : '不明';
    };

    const getChildNameKanji = (id: string) => {
        const c = childMap.get(id);
        if (!c) return '';
        return `${c.lastNameKanji ?? c.lastName} ${c.firstNameKanji ?? c.firstName}`;
    };

    const getChildClass = (id: string) => childMap.get(id)?.className ?? '';

    // フィルタリング
    const filtered = useMemo(() => {
        return considerations.filter(c => {
            if (filterCategory !== 'all' && c.category !== filterCategory) return false;
            if (filterPriority !== 'all' && c.priority !== filterPriority) return false;
            const cls = getChildClass(c.childId);
            if (filterClass !== 'all' && cls !== filterClass) return false;
            if (searchQuery) {
                const name = getChildName(c.childId) + getChildNameKanji(c.childId);
                const text = name + c.title + c.detail;
                if (!text.includes(searchQuery)) return false;
            }
            return true;
        }).sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }, [considerations, filterCategory, filterPriority, filterClass, searchQuery]);

    // 園児ごとにグループ化
    const byChild = useMemo(() => {
        const map = new Map<string, Consideration[]>();
        filtered.forEach(c => {
            if (!map.has(c.childId)) map.set(c.childId, []);
            map.get(c.childId)!.push(c);
        });
        return map;
    }, [filtered]);

    // カテゴリごとにグループ化
    const byCategory = useMemo(() => {
        const map = new Map<ConsiderationCategory, Consideration[]>();
        filtered.forEach(c => {
            if (!map.has(c.category)) map.set(c.category, []);
            map.get(c.category)!.push(c);
        });
        return map;
    }, [filtered]);

    const handleSave = (c: Consideration) => {
        setConsiderations(prev => {
            const idx = prev.findIndex(x => x.id === c.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = c;
                return next;
            }
            return [c, ...prev];
        });
    };

    const handleDelete = (id: string) => {
        setConsiderations(prev => prev.filter(c => c.id !== id));
    };

    // サマリー
    const highCount = considerations.filter(c => c.priority === 'high').length;
    const reviewSoonCount = considerations.filter(c => {
        if (!c.reviewDate) return false;
        const diff = new Date(c.reviewDate).getTime() - Date.now();
        return diff > 0 && diff < 30 * 86400000; // 30日以内
    }).length;

    // 配慮事項カード
    const ConsiderationCard = ({ c, showChild = true }: { c: Consideration; showChild?: boolean }) => {
        const cat = CATEGORY_CONFIG[c.category];
        const pri = PRIORITY_CONFIG[c.priority];
        const isReviewSoon = c.reviewDate && (new Date(c.reviewDate).getTime() - Date.now()) < 30 * 86400000 && new Date(c.reviewDate).getTime() > Date.now();

        return (
            <div
                className={`border rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all ${cat.bg}`}
                onClick={() => setShowModal({ mode: 'edit', consideration: c })}
            >
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg leading-none">{cat.emoji}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pri.bg} ${pri.color}`}>{pri.label}</span>
                        <span className={`text-xs font-medium ${cat.color}`}>{cat.label}</span>
                        {c.visibility === 'staff_only' && (
                            <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">職員のみ</span>
                        )}
                    </div>
                    {isReviewSoon && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full whitespace-nowrap flex-shrink-0">
                            ⏰ 見直し間近
                        </span>
                    )}
                </div>

                {showChild && (
                    <Link
                        href={`/children/${c.childId}`}
                        onClick={e => e.stopPropagation()}
                        className="text-sm font-bold text-headline hover:text-button transition-colors"
                    >
                        {getChildNameKanji(c.childId)}
                        <span className="text-xs text-paragraph/50 ml-1 font-normal">{getChildClass(c.childId)}</span>
                    </Link>
                )}

                <h3 className="text-sm font-semibold text-headline mt-1 mb-1">{c.title}</h3>
                <p className="text-xs text-paragraph/70 line-clamp-2">{c.detail}</p>

                <div className="flex items-center gap-3 mt-2 text-xs text-paragraph/50">
                    {c.startDate && <span>開始: {c.startDate}</span>}
                    {c.reviewDate && <span>見直し: {c.reviewDate}</span>}
                    <span className="ml-auto">更新: {c.updatedBy}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen">
            {/* ヘッダー */}
            <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-headline">配慮事項管理</h1>
                            {highCount > 0 && (
                                <span className="px-2.5 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                                    🚨 要注意 {highCount}件
                                </span>
                            )}
                            {reviewSoonCount > 0 && (
                                <span className="px-2.5 py-1 bg-purple-100 text-purple-600 text-xs rounded-full font-medium">
                                    ⏰ 見直し間近 {reviewSoonCount}件
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* 表示切替 */}
                            <div className="flex border border-secondary/30 rounded-lg overflow-hidden text-xs">
                                <button
                                    onClick={() => setViewMode('by-child')}
                                    className={`px-3 py-1.5 transition-colors ${viewMode === 'by-child' ? 'bg-button text-white' : 'text-paragraph/60 hover:bg-secondary/20'}`}
                                >
                                    園児別
                                </button>
                                <button
                                    onClick={() => setViewMode('by-category')}
                                    className={`px-3 py-1.5 transition-colors ${viewMode === 'by-category' ? 'bg-button text-white' : 'text-paragraph/60 hover:bg-secondary/20'}`}
                                >
                                    種別別
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* フィルター */}
                    <div className="flex flex-wrap gap-2 items-center">
                        {/* 検索 */}
                        <div className="relative flex-1 min-w-[180px]">
                            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-paragraph/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="名前・内容で検索..."
                                className="w-full pl-8 pr-3 py-1.5 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40"
                            />
                        </div>

                        <select
                            value={filterClass}
                            onChange={e => setFilterClass(e.target.value)}
                            className="px-3 py-1.5 rounded-lg text-sm border border-secondary/30 bg-surface focus:outline-none"
                        >
                            <option value="all">全クラス</option>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value as ConsiderationCategory | 'all')}
                            className="px-3 py-1.5 rounded-lg text-sm border border-secondary/30 bg-surface focus:outline-none"
                        >
                            <option value="all">全カテゴリ</option>
                            {(Object.entries(CATEGORY_CONFIG) as [ConsiderationCategory, typeof CATEGORY_CONFIG[ConsiderationCategory]][]).map(([k, v]) => (
                                <option key={k} value={k}>{v.emoji} {v.label}</option>
                            ))}
                        </select>

                        <select
                            value={filterPriority}
                            onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
                            className="px-3 py-1.5 rounded-lg text-sm border border-secondary/30 bg-surface focus:outline-none"
                        >
                            <option value="all">全重要度</option>
                            {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>

                        <span className="text-xs text-paragraph/50">{filtered.length}件</span>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-6">
                {/* ===== 統計バー ===== */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {[
                        { label: '全件', value: considerations.length, color: 'text-paragraph', bg: 'bg-secondary/10' },
                        { label: '要注意', value: highCount, color: 'text-red-600', bg: 'bg-red-50' },
                        { label: '見直し間近', value: reviewSoonCount, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: '対象園児', value: new Set(considerations.map(c => c.childId)).size, color: 'text-blue-600', bg: 'bg-blue-50' },
                    ].map(stat => (
                        <div key={stat.label} className={`${stat.bg} rounded-xl p-4 text-center`}>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-paragraph/60 mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* ===== 園児別表示 ===== */}
                {viewMode === 'by-child' && (
                    <div className="space-y-6">
                        {byChild.size === 0 && (
                            <div className="text-center py-20 bg-surface rounded-2xl border border-secondary/20">
                                <div className="text-4xl mb-3">📋</div>
                                <h3 className="font-medium text-headline mb-1">配慮事項がありません</h3>
                                <p className="text-sm text-paragraph/60">条件を変えて検索してください</p>
                            </div>
                        )}
                        {[...byChild.entries()].map(([childId, items]) => {
                            const child = childMap.get(childId);
                            if (!child) return null;
                            return (
                                <div key={childId} className="bg-surface rounded-2xl shadow-sm border border-secondary/20 overflow-hidden">
                                    {/* 園児ヘッダー */}
                                    <div className="flex items-center justify-between px-5 py-4 bg-secondary/5 border-b border-secondary/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-button/10 flex items-center justify-center font-bold text-button">
                                                {child.lastName.charAt(0)}
                                            </div>
                                            <div>
                                                <Link href={`/children/${childId}`} className="font-bold text-headline hover:text-button transition-colors">
                                                    {getChildNameKanji(childId)}
                                                </Link>
                                                <p className="text-xs text-paragraph/60">{child.className} · {child.grade}</p>
                                            </div>
                                            {items.some(i => i.priority === 'high') && (
                                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">要注意あり</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setShowModal({ mode: 'add', childId })}
                                            className="text-xs px-3 py-1.5 bg-button/10 text-button hover:bg-button/20 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                            追加
                                        </button>
                                    </div>

                                    {/* 配慮事項一覧 */}
                                    <div className="p-4 grid gap-3 sm:grid-cols-2">
                                        {items.map(c => (
                                            <ConsiderationCard key={c.id} c={c} showChild={false} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ===== カテゴリ別表示 ===== */}
                {viewMode === 'by-category' && (
                    <div className="space-y-6">
                        {byCategory.size === 0 && (
                            <div className="text-center py-20 bg-surface rounded-2xl border border-secondary/20">
                                <div className="text-4xl mb-3">📋</div>
                                <h3 className="font-medium text-headline mb-1">配慮事項がありません</h3>
                                <p className="text-sm text-paragraph/60">条件を変えて検索してください</p>
                            </div>
                        )}
                        {(Object.keys(CATEGORY_CONFIG) as ConsiderationCategory[])
                            .filter(cat => byCategory.has(cat))
                            .map(cat => {
                                const items = byCategory.get(cat)!;
                                const cfg = CATEGORY_CONFIG[cat];
                                return (
                                    <div key={cat} className="bg-surface rounded-2xl shadow-sm border border-secondary/20 overflow-hidden">
                                        <div className={`flex items-center gap-3 px-5 py-3 border-b border-secondary/10 ${cfg.bg}`}>
                                            <span className="text-xl">{cfg.emoji}</span>
                                            <span className={`font-bold ${cfg.color}`}>{cfg.label}</span>
                                            <span className="text-xs text-paragraph/50 ml-1">{items.length}件</span>
                                        </div>
                                        <div className="p-4 grid gap-3 sm:grid-cols-2">
                                            {items.map(c => (
                                                <ConsiderationCard key={c.id} c={c} showChild={true} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                )}
            </main>

            {/* 編集・追加モーダル */}
            {showModal && (
                <ConsiderationModal
                    consideration={
                        showModal.mode === 'edit'
                            ? showModal.consideration
                            : { id: '', childId: showModal.childId, category: 'allergy', title: '', detail: '', priority: 'medium', visibility: 'staff_only', updatedAt: new Date(), updatedBy: staffName }
                    }
                    childName={getChildNameKanji(
                        showModal.mode === 'edit' ? showModal.consideration.childId : showModal.childId
                    )}
                    onClose={() => setShowModal(null)}
                    onSave={handleSave}
                    onDelete={showModal.mode === 'edit' ? handleDelete : undefined}
                    staffName={staffName}
                />
            )}
        </div>
    );
}
