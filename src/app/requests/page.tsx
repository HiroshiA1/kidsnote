'use client';

import { useState } from 'react';
import { useApp } from '@/components/AppLayout';

// ===== 型定義 =====
type RequestType = 'leave' | 'travel' | 'training' | 'supplies' | 'approval';
type RequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn';

interface BaseRequest {
    id: string;
    type: RequestType;
    status: RequestStatus;
    applicantId: string;
    applicantName: string;
    submittedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    approverId?: string;
    approverName?: string;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    comment?: string;
}

interface LeaveRequest extends BaseRequest {
    type: 'leave';
    leaveType: '年次有給' | '特別休暇' | '慶弔休暇' | '病気休暇' | 'その他';
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    substituteId?: string;
    substituteName?: string;
}

interface TravelRequest extends BaseRequest {
    type: 'travel';
    destination: string;
    purpose: string;
    travelDate: string;
    returnDate: string;
    transportation: string;
    fare: number;
    accommodation: number;
    meals: number;
    other: number;
    total: number;
    receiptsAttached: boolean;
}

interface TrainingRequest extends BaseRequest {
    type: 'training';
    trainingName: string;
    organizer: string;
    startDate: string;
    endDate: string;
    location: string;
    fee: number;
    purpose: string;
    substituteId?: string;
    substituteName?: string;
}

interface SuppliesRequest extends BaseRequest {
    type: 'supplies';
    items: { name: string; quantity: number; unitPrice: number; purpose: string }[];
    totalAmount: number;
    urgency: '通常' | '急ぎ' | '緊急';
    deliveryLocation: string;
}

interface ApprovalRequest extends BaseRequest {
    type: 'approval';
    title: string;
    category: string;
    amount?: number;
    content: string;
    background: string;
    effect: string;
}

type AnyRequest = LeaveRequest | TravelRequest | TrainingRequest | SuppliesRequest | ApprovalRequest;

// ===== 設定 =====
const TYPE_CONFIG: Record<RequestType, { label: string; color: string; bg: string; icon: string }> = {
    leave: { label: '有給休暇', color: 'text-blue-600', bg: 'bg-blue-100', icon: '🌴' },
    travel: { label: '出張旅費', color: 'text-amber-600', bg: 'bg-amber-100', icon: '✈️' },
    training: { label: '研修申請', color: 'text-purple-600', bg: 'bg-purple-100', icon: '📚' },
    supplies: { label: '備品購入', color: 'text-green-600', bg: 'bg-green-100', icon: '📦' },
    approval: { label: '稟議', color: 'text-red-600', bg: 'bg-red-100', icon: '📋' },
};

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bg: string }> = {
    draft: { label: '下書き', color: 'text-gray-600', bg: 'bg-gray-100' },
    pending: { label: '承認待ち', color: 'text-orange-600', bg: 'bg-orange-100' },
    approved: { label: '承認済み', color: 'text-green-600', bg: 'bg-green-100' },
    rejected: { label: '却下', color: 'text-red-600', bg: 'bg-red-100' },
    withdrawn: { label: '取り下げ', color: 'text-gray-400', bg: 'bg-gray-50' },
};

// ===== サンプルデータ =====
const sampleRequests: AnyRequest[] = [
    {
        id: 'req-1', type: 'leave', status: 'pending',
        applicantId: 'staff-1', applicantName: '鈴木 美咲',
        leaveType: '年次有給', startDate: '2026-02-25', endDate: '2026-02-25', days: 1,
        reason: '私用のため',
        createdAt: new Date('2026-02-20'), updatedAt: new Date('2026-02-20'),
        submittedAt: new Date('2026-02-20'),
    } as LeaveRequest,
    {
        id: 'req-2', type: 'travel', status: 'approved',
        applicantId: 'staff-2', applicantName: '田中 太郎',
        destination: '東京都新宿区', purpose: '保育研修会参加',
        travelDate: '2026-02-15', returnDate: '2026-02-15',
        transportation: '新幹線', fare: 12500, accommodation: 0, meals: 1500, other: 300, total: 14300,
        receiptsAttached: true,
        createdAt: new Date('2026-02-10'), updatedAt: new Date('2026-02-16'),
        submittedAt: new Date('2026-02-10'),
        approverName: '佐藤 花子', approvedAt: new Date('2026-02-16'),
    } as TravelRequest,
    {
        id: 'req-3', type: 'training', status: 'pending',
        applicantId: 'staff-3', applicantName: '山本 健太',
        trainingName: '特別支援保育研修', organizer: '市教育委員会',
        startDate: '2026-03-05', endDate: '2026-03-06', location: '市民ホール', fee: 3000,
        purpose: '特別支援が必要な園児への対応力向上のため',
        createdAt: new Date('2026-02-18'), updatedAt: new Date('2026-02-18'),
        submittedAt: new Date('2026-02-18'),
    } as TrainingRequest,
    {
        id: 'req-4', type: 'supplies', status: 'approved',
        applicantId: 'staff-1', applicantName: '鈴木 美咲',
        items: [
            { name: '画用紙（8枚切り）', quantity: 5, unitPrice: 550, purpose: '製作活動用' },
            { name: '水彩絵具セット', quantity: 3, unitPrice: 1200, purpose: 'さくら組製作用' },
        ],
        totalAmount: 6350, urgency: '通常', deliveryLocation: 'さくら組教室',
        createdAt: new Date('2026-02-12'), updatedAt: new Date('2026-02-14'),
        submittedAt: new Date('2026-02-12'),
        approverName: '佐藤 花子', approvedAt: new Date('2026-02-14'),
    } as SuppliesRequest,
    {
        id: 'req-5', type: 'approval', status: 'draft',
        applicantId: 'staff-2', applicantName: '田中 太郎',
        title: '園庭遊具の更新について', category: '設備投資',
        amount: 850000,
        content: 'ジャングルジムおよびすべり台の老朽化に伴い、新規設備への更新を申請します。',
        background: '現在の遊具は設置から15年が経過し、安全点検で要注意箇所が複数確認されました。',
        effect: '園児の安全確保、および保育環境の向上が期待されます。',
        createdAt: new Date('2026-02-19'), updatedAt: new Date('2026-02-19'),
    } as ApprovalRequest,
    {
        id: 'req-6', type: 'leave', status: 'rejected',
        applicantId: 'staff-3', applicantName: '山本 健太',
        leaveType: '年次有給', startDate: '2026-02-28', endDate: '2026-03-01', days: 2,
        reason: '私用のため',
        createdAt: new Date('2026-02-15'), updatedAt: new Date('2026-02-17'),
        submittedAt: new Date('2026-02-15'),
        approverName: '佐藤 花子', rejectedAt: new Date('2026-02-17'),
        rejectionReason: '月末締め処理のため、翌週以降での取得をお願いします。',
    } as LeaveRequest,
];

// ===== ユーティリティ =====
function formatDate(d: string | Date | undefined) {
    if (!d) return '-';
    const dt = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
    return dt.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatCurrency(n: number) { return n.toLocaleString('ja-JP') + '円'; }

// ===== 申請詳細コンポーネント =====
function RequestDetail({ req, onClose, onApprove, onReject, onWithdraw, currentUserName }: {
    req: AnyRequest;
    onClose: () => void;
    onApprove: (id: string, comment?: string) => void;
    onReject: (id: string, reason: string) => void;
    onWithdraw: (id: string) => void;
    currentUserName: string;
}) {
    const [actionMode, setActionMode] = useState<'none' | 'approve' | 'reject'>('none');
    const [comment, setComment] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const tc = TYPE_CONFIG[req.type];
    const sc = STATUS_CONFIG[req.status];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50" />
            <div
                className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* ヘッダー */}
                <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-secondary/20 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <span className={`text-2xl`}>{tc.icon}</span>
                        <div>
                            <h2 className="font-bold text-headline">{tc.label}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                                <span className="text-xs text-paragraph/60">{req.applicantName}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-secondary/20 rounded-lg text-paragraph/60 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* 申請内容 */}
                    {req.type === 'leave' && <LeaveDetail req={req as LeaveRequest} />}
                    {req.type === 'travel' && <TravelDetail req={req as TravelRequest} />}
                    {req.type === 'training' && <TrainingDetail req={req as TrainingRequest} />}
                    {req.type === 'supplies' && <SuppliesDetail req={req as SuppliesRequest} />}
                    {req.type === 'approval' && <ApprovalDetail req={req as ApprovalRequest} />}

                    {/* 却下理由 */}
                    {req.status === 'rejected' && req.rejectionReason && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-xs font-medium text-red-600 mb-1">却下理由</p>
                            <p className="text-sm text-red-700">{req.rejectionReason}</p>
                            <p className="text-xs text-red-400 mt-2">{req.approverName} • {formatDate(req.rejectedAt)}</p>
                        </div>
                    )}

                    {/* 承認コメント */}
                    {req.status === 'approved' && req.comment && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                            <p className="text-xs font-medium text-green-600 mb-1">承認コメント</p>
                            <p className="text-sm text-green-700">{req.comment}</p>
                            <p className="text-xs text-green-400 mt-2">{req.approverName} • {formatDate(req.approvedAt)}</p>
                        </div>
                    )}

                    {/* タイムライン */}
                    <div className="pt-2 border-t border-secondary/20">
                        <p className="text-xs font-medium text-paragraph/60 mb-3">申請の流れ</p>
                        <div className="space-y-2">
                            <TimelineItem label="作成" date={req.createdAt} done />
                            {req.submittedAt && <TimelineItem label="提出" date={req.submittedAt} done />}
                            {req.approvedAt && <TimelineItem label="承認" date={req.approvedAt} done color="text-green-600" />}
                            {req.rejectedAt && <TimelineItem label="却下" date={req.rejectedAt} done color="text-red-600" />}
                        </div>
                    </div>

                    {/* アクションボタン */}
                    {req.status === 'pending' && (
                        <div className="pt-2 border-t border-secondary/20 space-y-3">
                            {actionMode === 'none' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setActionMode('approve')}
                                        className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors text-sm"
                                    >
                                        ✓ 承認する
                                    </button>
                                    <button
                                        onClick={() => setActionMode('reject')}
                                        className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium hover:bg-red-100 transition-colors text-sm"
                                    >
                                        ✕ 却下する
                                    </button>
                                    {req.applicantName === currentUserName && (
                                        <button
                                            onClick={() => { onWithdraw(req.id); onClose(); }}
                                            className="px-4 py-2.5 bg-secondary/20 text-paragraph/60 rounded-xl font-medium hover:bg-secondary/30 transition-colors text-sm"
                                        >
                                            取り下げ
                                        </button>
                                    )}
                                </div>
                            )}
                            {actionMode === 'approve' && (
                                <div className="space-y-3">
                                    <textarea
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        rows={3}
                                        placeholder="コメント（任意）"
                                        className="w-full px-3 py-2 border border-secondary/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { onApprove(req.id, comment); onClose(); }}
                                            className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors text-sm"
                                        >
                                            承認を確定
                                        </button>
                                        <button onClick={() => setActionMode('none')} className="px-4 py-2.5 bg-secondary/20 text-paragraph/60 rounded-xl text-sm hover:bg-secondary/30 transition-colors">
                                            戻る
                                        </button>
                                    </div>
                                </div>
                            )}
                            {actionMode === 'reject' && (
                                <div className="space-y-3">
                                    <textarea
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        rows={3}
                                        placeholder="却下理由を入力（必須）"
                                        className="w-full px-3 py-2 border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { if (rejectReason.trim()) { onReject(req.id, rejectReason); onClose(); } }}
                                            disabled={!rejectReason.trim()}
                                            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors text-sm disabled:opacity-40"
                                        >
                                            却下を確定
                                        </button>
                                        <button onClick={() => setActionMode('none')} className="px-4 py-2.5 bg-secondary/20 text-paragraph/60 rounded-xl text-sm hover:bg-secondary/30 transition-colors">
                                            戻る
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {req.status === 'draft' && (
                        <div className="pt-2 border-t border-secondary/20">
                            <button
                                onClick={() => { onApprove(req.id); onClose(); }}
                                className="w-full py-2.5 bg-button text-white rounded-xl font-medium hover:opacity-90 transition-opacity text-sm"
                            >
                                提出する
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TimelineItem({ label, date, done, color = 'text-button' }: { label: string; date: Date | string; done?: boolean; color?: string }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-button/20' : 'bg-secondary/20'}`}>
                <span className={`w-2 h-2 rounded-full ${done ? 'bg-button' : 'bg-secondary/40'}`} />
            </div>
            <span className={`font-medium ${done ? color : 'text-paragraph/40'}`}>{label}</span>
            <span className="text-paragraph/50 text-xs">{formatDate(date)}</span>
        </div>
    );
}

// ----- 各申請タイプの詳細表示 -----
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex gap-4">
            <span className="text-xs text-paragraph/60 w-28 flex-shrink-0 pt-0.5">{label}</span>
            <span className="text-sm text-paragraph flex-1">{value}</span>
        </div>
    );
}

function LeaveDetail({ req }: { req: LeaveRequest }) {
    return (
        <div className="space-y-3">
            <DetailRow label="休暇種別" value={req.leaveType} />
            <DetailRow label="取得日" value={`${formatDate(req.startDate)} 〜 ${formatDate(req.endDate)}（${req.days}日）`} />
            <DetailRow label="取得理由" value={req.reason} />
            {req.substituteName && <DetailRow label="代替者" value={req.substituteName} />}
        </div>
    );
}

function TravelDetail({ req }: { req: TravelRequest }) {
    return (
        <div className="space-y-3">
            <DetailRow label="出張先" value={req.destination} />
            <DetailRow label="目的" value={req.purpose} />
            <DetailRow label="日程" value={`${formatDate(req.travelDate)} 〜 ${formatDate(req.returnDate)}`} />
            <DetailRow label="交通手段" value={req.transportation} />
            <div className="mt-4 p-4 bg-secondary/10 rounded-xl">
                <p className="text-xs font-medium text-paragraph/60 mb-3">費用内訳</p>
                <div className="space-y-2">
                    {req.fare > 0 && <div className="flex justify-between text-sm"><span className="text-paragraph/70">交通費</span><span>{formatCurrency(req.fare)}</span></div>}
                    {req.accommodation > 0 && <div className="flex justify-between text-sm"><span className="text-paragraph/70">宿泊費</span><span>{formatCurrency(req.accommodation)}</span></div>}
                    {req.meals > 0 && <div className="flex justify-between text-sm"><span className="text-paragraph/70">日当・食費</span><span>{formatCurrency(req.meals)}</span></div>}
                    {req.other > 0 && <div className="flex justify-between text-sm"><span className="text-paragraph/70">その他</span><span>{formatCurrency(req.other)}</span></div>}
                    <div className="flex justify-between font-bold pt-2 border-t border-secondary/30 text-sm">
                        <span>合計</span><span className="text-button">{formatCurrency(req.total)}</span>
                    </div>
                </div>
            </div>
            <DetailRow label="領収書" value={req.receiptsAttached ? '添付済み' : '未添付'} />
        </div>
    );
}

function TrainingDetail({ req }: { req: TrainingRequest }) {
    return (
        <div className="space-y-3">
            <DetailRow label="研修名" value={req.trainingName} />
            <DetailRow label="主催" value={req.organizer} />
            <DetailRow label="日程" value={`${formatDate(req.startDate)} 〜 ${formatDate(req.endDate)}`} />
            <DetailRow label="場所" value={req.location} />
            {req.fee > 0 && <DetailRow label="受講料" value={formatCurrency(req.fee)} />}
            <DetailRow label="受講目的" value={req.purpose} />
            {req.substituteName && <DetailRow label="代替者" value={req.substituteName} />}
        </div>
    );
}

function SuppliesDetail({ req }: { req: SuppliesRequest }) {
    return (
        <div className="space-y-3">
            <DetailRow label="緊急度" value={
                <span className={`text-xs px-2 py-0.5 rounded-full ${req.urgency === '緊急' ? 'bg-red-100 text-red-600' : req.urgency === '急ぎ' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                    {req.urgency}
                </span>
            } />
            <DetailRow label="お届け先" value={req.deliveryLocation} />
            <div className="mt-2">
                <p className="text-xs text-paragraph/60 mb-2">品目一覧</p>
                <div className="border border-secondary/20 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-secondary/10">
                            <tr>
                                <th className="text-left px-3 py-2 text-xs text-paragraph/60 font-medium">品名</th>
                                <th className="text-right px-3 py-2 text-xs text-paragraph/60 font-medium">数量</th>
                                <th className="text-right px-3 py-2 text-xs text-paragraph/60 font-medium">単価</th>
                                <th className="text-right px-3 py-2 text-xs text-paragraph/60 font-medium">小計</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/10">
                            {req.items.map((item, i) => (
                                <tr key={i}>
                                    <td className="px-3 py-2">
                                        <div>{item.name}</div>
                                        <div className="text-xs text-paragraph/50">{item.purpose}</div>
                                    </td>
                                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                </tr>
                            ))}
                            <tr className="bg-secondary/5">
                                <td colSpan={3} className="px-3 py-2 text-right font-bold text-sm">合計</td>
                                <td className="px-3 py-2 text-right font-bold text-button">{formatCurrency(req.totalAmount)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function ApprovalDetail({ req }: { req: ApprovalRequest }) {
    return (
        <div className="space-y-3">
            <DetailRow label="件名" value={req.title} />
            <DetailRow label="カテゴリ" value={req.category} />
            {req.amount !== undefined && <DetailRow label="金額" value={formatCurrency(req.amount)} />}
            <div>
                <p className="text-xs text-paragraph/60 mb-1">申請内容</p>
                <p className="text-sm text-paragraph bg-secondary/10 rounded-xl p-3">{req.content}</p>
            </div>
            <div>
                <p className="text-xs text-paragraph/60 mb-1">背景・理由</p>
                <p className="text-sm text-paragraph bg-secondary/10 rounded-xl p-3">{req.background}</p>
            </div>
            <div>
                <p className="text-xs text-paragraph/60 mb-1">期待される効果</p>
                <p className="text-sm text-paragraph bg-secondary/10 rounded-xl p-3">{req.effect}</p>
            </div>
        </div>
    );
}

// ===== 新規申請モーダル =====
function NewRequestModal({ onClose, onSave, staffList }: {
    onClose: () => void;
    onSave: (req: AnyRequest) => void;
    staffList: { id: string; name: string }[];
}) {
    const [step, setStep] = useState<'type' | 'form'>('type');
    const [selectedType, setSelectedType] = useState<RequestType | null>(null);

    const handleTypeSelect = (type: RequestType) => {
        setSelectedType(type);
        setStep('form');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50" />
            <div
                className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-secondary/20 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="font-bold text-headline text-lg">
                        {step === 'type' ? '申請種別を選択' : `${selectedType ? TYPE_CONFIG[selectedType].label : ''}の申請`}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-secondary/20 rounded-lg text-paragraph/60 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {step === 'type' && (
                    <div className="p-6 grid grid-cols-1 gap-3">
                        {(Object.entries(TYPE_CONFIG) as [RequestType, typeof TYPE_CONFIG[RequestType]][]).map(([type, config]) => (
                            <button
                                key={type}
                                onClick={() => handleTypeSelect(type)}
                                className="flex items-center gap-4 p-4 rounded-xl border border-secondary/20 hover:bg-secondary/10 transition-colors text-left group"
                            >
                                <span className="text-3xl">{config.icon}</span>
                                <div>
                                    <p className={`font-bold ${config.color}`}>{config.label}</p>
                                    <p className="text-xs text-paragraph/60 mt-0.5">
                                        {type === 'leave' && '有給・特別・慶弔・病気休暇の申請'}
                                        {type === 'travel' && '出張旅費の精算申請'}
                                        {type === 'training' && '外部研修への参加申請'}
                                        {type === 'supplies' && '消耗品・備品の購入依頼'}
                                        {type === 'approval' && '稟議・設備投資・その他の承認申請'}
                                    </p>
                                </div>
                                <svg className="w-5 h-5 text-paragraph/30 ml-auto group-hover:text-button transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ))}
                    </div>
                )}

                {step === 'form' && selectedType && (
                    <RequestForm
                        type={selectedType}
                        staffList={staffList}
                        onBack={() => setStep('type')}
                        onSave={onSave}
                        onClose={onClose}
                    />
                )}
            </div>
        </div>
    );
}

function RequestForm({ type, staffList, onBack, onSave, onClose }: {
    type: RequestType;
    staffList: { id: string; name: string }[];
    onBack: () => void;
    onSave: (req: AnyRequest) => void;
    onClose: () => void;
}) {
    const [applicantId, setApplicantId] = useState(staffList[0]?.id ?? '');
    const [asDraft, setAsDraft] = useState(false);

    // 各フォーム共通
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 有給休暇
    const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('年次有給');
    const [leaveStart, setLeaveStart] = useState(todayStr);
    const [leaveEnd, setLeaveEnd] = useState(todayStr);
    const [leaveReason, setLeaveReason] = useState('');

    // 出張旅費
    const [destination, setDestination] = useState('');
    const [purpose, setPurpose] = useState('');
    const [travelDate, setTravelDate] = useState(todayStr);
    const [returnDate, setReturnDate] = useState(todayStr);
    const [transportation, setTransportation] = useState('');
    const [fare, setFare] = useState(0);
    const [accommodation, setAccommodation] = useState(0);
    const [meals, setMeals] = useState(0);
    const [other, setOther] = useState(0);

    // 研修
    const [trainingName, setTrainingName] = useState('');
    const [organizer, setOrganizer] = useState('');
    const [trainingStart, setTrainingStart] = useState(todayStr);
    const [trainingEnd, setTrainingEnd] = useState(todayStr);
    const [location, setLocation] = useState('');
    const [fee, setFee] = useState(0);
    const [trainingPurpose, setTrainingPurpose] = useState('');

    // 備品
    const [items, setItems] = useState([{ name: '', quantity: 1, unitPrice: 0, purpose: '' }]);
    const [urgency, setUrgency] = useState<SuppliesRequest['urgency']>('通常');
    const [deliveryLocation, setDeliveryLocation] = useState('');

    // 稟議
    const [approvalTitle, setApprovalTitle] = useState('');
    const [approvalCategory, setApprovalCategory] = useState('');
    const [approvalAmount, setApprovalAmount] = useState<number | undefined>(undefined);
    const [content, setContent] = useState('');
    const [background, setBackground] = useState('');
    const [effect, setEffect] = useState('');

    const applicantName = staffList.find(s => s.id === applicantId)?.name ?? '';

    const buildAndSave = (submitNow: boolean) => {
        const base = {
            id: `req-${Date.now()}`,
            applicantId,
            applicantName,
            createdAt: now,
            updatedAt: now,
            status: (submitNow ? 'pending' : 'draft') as RequestStatus,
            submittedAt: submitNow ? now : undefined,
        };

        let req: AnyRequest;

        if (type === 'leave') {
            const days = Math.max(1, Math.ceil((new Date(leaveEnd + 'T00:00:00').getTime() - new Date(leaveStart + 'T00:00:00').getTime()) / 86400000) + 1);
            req = { ...base, type: 'leave', leaveType, startDate: leaveStart, endDate: leaveEnd, days, reason: leaveReason } as LeaveRequest;
        } else if (type === 'travel') {
            const total = fare + accommodation + meals + other;
            req = { ...base, type: 'travel', destination, purpose, travelDate, returnDate, transportation, fare, accommodation, meals, other, total, receiptsAttached: false } as TravelRequest;
        } else if (type === 'training') {
            req = { ...base, type: 'training', trainingName, organizer, startDate: trainingStart, endDate: trainingEnd, location, fee, purpose: trainingPurpose } as TrainingRequest;
        } else if (type === 'supplies') {
            const totalAmount = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
            req = { ...base, type: 'supplies', items, totalAmount, urgency, deliveryLocation } as SuppliesRequest;
        } else {
            req = { ...base, type: 'approval', title: approvalTitle, category: approvalCategory, amount: approvalAmount, content, background, effect } as ApprovalRequest;
        }

        onSave(req);
        onClose();
    };

    const inputCls = 'w-full px-3 py-2 border border-secondary/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-button/40';
    const labelCls = 'block text-sm font-medium text-paragraph/80 mb-1';

    return (
        <div className="p-6 space-y-4">
            {/* 申請者 */}
            <div>
                <label className={labelCls}>申請者 *</label>
                <select value={applicantId} onChange={e => setApplicantId(e.target.value)} className={inputCls}>
                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            {/* 有給休暇フォーム */}
            {type === 'leave' && (
                <>
                    <div>
                        <label className={labelCls}>休暇種別 *</label>
                        <div className="flex flex-wrap gap-2">
                            {(['年次有給', '特別休暇', '慶弔休暇', '病気休暇', 'その他'] as const).map(t => (
                                <button key={t} onClick={() => setLeaveType(t)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${leaveType === t ? 'bg-blue-500 text-white' : 'bg-secondary/20 text-paragraph/70 hover:bg-secondary/30'}`}>{t}</button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelCls}>開始日 *</label><input type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>終了日 *</label><input type="date" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} className={inputCls} /></div>
                    </div>
                    <div>
                        <label className={labelCls}>取得理由</label>
                        <input type="text" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="私用のため" className={inputCls} />
                    </div>
                </>
            )}

            {/* 出張旅費フォーム */}
            {type === 'travel' && (
                <>
                    <div><label className={labelCls}>出張先 *</label><input type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder="東京都新宿区" className={inputCls} /></div>
                    <div><label className={labelCls}>目的 *</label><input type="text" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="研修参加" className={inputCls} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelCls}>出発日 *</label><input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>帰着日 *</label><input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className={inputCls} /></div>
                    </div>
                    <div><label className={labelCls}>交通手段</label><input type="text" value={transportation} onChange={e => setTransportation(e.target.value)} placeholder="新幹線・電車" className={inputCls} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelCls}>交通費（円）</label><input type="number" value={fare} onChange={e => setFare(Number(e.target.value))} className={inputCls} /></div>
                        <div><label className={labelCls}>宿泊費（円）</label><input type="number" value={accommodation} onChange={e => setAccommodation(Number(e.target.value))} className={inputCls} /></div>
                        <div><label className={labelCls}>日当・食費（円）</label><input type="number" value={meals} onChange={e => setMeals(Number(e.target.value))} className={inputCls} /></div>
                        <div><label className={labelCls}>その他（円）</label><input type="number" value={other} onChange={e => setOther(Number(e.target.value))} className={inputCls} /></div>
                    </div>
                    <div className="p-3 bg-button/10 rounded-xl flex justify-between items-center">
                        <span className="text-sm font-medium text-button">合計</span>
                        <span className="font-bold text-button">{formatCurrency(fare + accommodation + meals + other)}</span>
                    </div>
                </>
            )}

            {/* 研修フォーム */}
            {type === 'training' && (
                <>
                    <div><label className={labelCls}>研修名 *</label><input type="text" value={trainingName} onChange={e => setTrainingName(e.target.value)} placeholder="特別支援保育研修" className={inputCls} /></div>
                    <div><label className={labelCls}>主催</label><input type="text" value={organizer} onChange={e => setOrganizer(e.target.value)} placeholder="市教育委員会" className={inputCls} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelCls}>開始日 *</label><input type="date" value={trainingStart} onChange={e => setTrainingStart(e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>終了日 *</label><input type="date" value={trainingEnd} onChange={e => setTrainingEnd(e.target.value)} className={inputCls} /></div>
                    </div>
                    <div><label className={labelCls}>場所</label><input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="市民ホール" className={inputCls} /></div>
                    <div><label className={labelCls}>受講料（円）</label><input type="number" value={fee} onChange={e => setFee(Number(e.target.value))} className={inputCls} /></div>
                    <div><label className={labelCls}>受講目的 *</label><textarea value={trainingPurpose} onChange={e => setTrainingPurpose(e.target.value)} rows={3} placeholder="研修を受ける目的・期待される効果" className={`${inputCls} resize-none`} /></div>
                </>
            )}

            {/* 備品購入フォーム */}
            {type === 'supplies' && (
                <>
                    <div>
                        <label className={labelCls}>緊急度</label>
                        <div className="flex gap-2">
                            {(['通常', '急ぎ', '緊急'] as const).map(u => (
                                <button key={u} onClick={() => setUrgency(u)} className={`px-4 py-2 rounded-lg text-sm transition-colors ${urgency === u ? (u === '緊急' ? 'bg-red-500 text-white' : u === '急ぎ' ? 'bg-orange-400 text-white' : 'bg-button text-white') : 'bg-secondary/20 text-paragraph/70'}`}>{u}</button>
                            ))}
                        </div>
                    </div>
                    <div><label className={labelCls}>お届け先</label><input type="text" value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)} placeholder="さくら組教室" className={inputCls} /></div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className={labelCls.replace('mb-1', 'mb-0')}>品目 *</label>
                            <button onClick={() => setItems(i => [...i, { name: '', quantity: 1, unitPrice: 0, purpose: '' }])} className="text-xs text-button hover:text-button/80">+ 追加</button>
                        </div>
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={idx} className="p-3 bg-secondary/10 rounded-xl space-y-2">
                                    <div className="flex gap-2">
                                        <input type="text" value={item.name} onChange={e => setItems(i => i.map((x, j) => j === idx ? { ...x, name: e.target.value } : x))} placeholder="品名" className={`${inputCls} flex-1`} />
                                        {items.length > 1 && <button onClick={() => setItems(i => i.filter((_, j) => j !== idx))} className="text-alert hover:text-alert/80 text-sm px-2">削除</button>}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div><label className="text-xs text-paragraph/60">数量</label><input type="number" value={item.quantity} onChange={e => setItems(i => i.map((x, j) => j === idx ? { ...x, quantity: Number(e.target.value) } : x))} className={inputCls} /></div>
                                        <div><label className="text-xs text-paragraph/60">単価（円）</label><input type="number" value={item.unitPrice} onChange={e => setItems(i => i.map((x, j) => j === idx ? { ...x, unitPrice: Number(e.target.value) } : x))} className={inputCls} /></div>
                                        <div><label className="text-xs text-paragraph/60">小計</label><p className="px-3 py-2 text-sm font-medium">{formatCurrency(item.quantity * item.unitPrice)}</p></div>
                                    </div>
                                    <input type="text" value={item.purpose} onChange={e => setItems(i => i.map((x, j) => j === idx ? { ...x, purpose: e.target.value } : x))} placeholder="用途" className={inputCls} />
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 p-3 bg-button/10 rounded-xl flex justify-between">
                            <span className="text-sm font-medium text-button">合計</span>
                            <span className="font-bold text-button">{formatCurrency(items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0))}</span>
                        </div>
                    </div>
                </>
            )}

            {/* 稟議フォーム */}
            {type === 'approval' && (
                <>
                    <div><label className={labelCls}>件名 *</label><input type="text" value={approvalTitle} onChange={e => setApprovalTitle(e.target.value)} placeholder="〇〇の導入・購入について" className={inputCls} /></div>
                    <div><label className={labelCls}>カテゴリ</label><input type="text" value={approvalCategory} onChange={e => setApprovalCategory(e.target.value)} placeholder="設備投資・外部委託・規程変更" className={inputCls} /></div>
                    <div><label className={labelCls}>金額（円・任意）</label><input type="number" value={approvalAmount ?? ''} onChange={e => setApprovalAmount(e.target.value ? Number(e.target.value) : undefined)} className={inputCls} /></div>
                    <div><label className={labelCls}>申請内容 *</label><textarea value={content} onChange={e => setContent(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="何を申請するか" /></div>
                    <div><label className={labelCls}>背景・理由 *</label><textarea value={background} onChange={e => setBackground(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="なぜ必要か" /></div>
                    <div><label className={labelCls}>期待される効果</label><textarea value={effect} onChange={e => setEffect(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="承認された場合の効果・メリット" /></div>
                </>
            )}

            {/* ボタン */}
            <div className="flex gap-2 pt-2 border-t border-secondary/20">
                <button onClick={onBack} className="px-4 py-2.5 text-sm text-paragraph/60 hover:bg-secondary/20 rounded-xl transition-colors">← 戻る</button>
                <button onClick={() => buildAndSave(false)} className="flex-1 py-2.5 bg-secondary/20 text-paragraph rounded-xl font-medium hover:bg-secondary/30 transition-colors text-sm">下書き保存</button>
                <button onClick={() => buildAndSave(true)} className="flex-1 py-2.5 bg-button text-white rounded-xl font-medium hover:opacity-90 transition-opacity text-sm">提出する</button>
            </div>
        </div>
    );
}

// ===== メインページ =====
export default function RequestsPage() {
    const { staff } = useApp();
    const staffList = staff.map(s => ({ id: s.id, name: `${s.lastName} ${s.firstName}` }));
    const currentUserName = staffList[0]?.name ?? '';

    const [requests, setRequests] = useState<AnyRequest[]>(sampleRequests);
    const [filterType, setFilterType] = useState<RequestType | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<RequestStatus | 'all'>('all');
    const [selectedRequest, setSelectedRequest] = useState<AnyRequest | null>(null);
    const [showNewModal, setShowNewModal] = useState(false);

    const filtered = requests
        .filter(r => filterType === 'all' || r.type === filterType)
        .filter(r => filterStatus === 'all' || r.status === filterStatus)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    const handleApprove = (id: string, comment?: string) => {
        setRequests(prev => prev.map(r => {
            if (r.id !== id) return r;
            const isSubmit = r.status === 'draft';
            return {
                ...r,
                status: isSubmit ? 'pending' : 'approved',
                approverName: isSubmit ? undefined : currentUserName,
                approvedAt: isSubmit ? undefined : new Date(),
                comment: comment || undefined,
                updatedAt: new Date(),
                submittedAt: isSubmit ? new Date() : r.submittedAt,
            } as AnyRequest;
        }));
    };

    const handleReject = (id: string, reason: string) => {
        setRequests(prev => prev.map(r =>
            r.id === id ? { ...r, status: 'rejected', rejectionReason: reason, approverName: currentUserName, rejectedAt: new Date(), updatedAt: new Date() } as AnyRequest : r
        ));
    };

    const handleWithdraw = (id: string) => {
        setRequests(prev => prev.map(r =>
            r.id === id ? { ...r, status: 'withdrawn', updatedAt: new Date() } as AnyRequest : r
        ));
    };

    const handleSaveNew = (req: AnyRequest) => {
        setRequests(prev => [req, ...prev]);
    };

    return (
        <div className="min-h-screen">
            {/* ヘッダー */}
            <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-headline">内部申請</h1>
                            {pendingCount > 0 && (
                                <span className="px-2.5 py-1 bg-orange-100 text-orange-600 text-xs rounded-full font-medium">
                                    承認待ち {pendingCount}件
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="px-4 py-2 bg-button text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            新規申請
                        </button>
                    </div>

                    {/* フィルター */}
                    <div className="flex flex-wrap gap-2">
                        <div className="flex gap-1">
                            <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filterType === 'all' ? 'bg-button text-white' : 'bg-secondary/20 text-paragraph/70 hover:bg-secondary/30'}`}>すべて</button>
                            {(Object.entries(TYPE_CONFIG) as [RequestType, typeof TYPE_CONFIG[RequestType]][]).map(([type, config]) => (
                                <button key={type} onClick={() => setFilterType(type)} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filterType === type ? `${config.bg} ${config.color} font-medium` : 'bg-secondary/20 text-paragraph/70 hover:bg-secondary/30'}`}>
                                    {config.icon} {config.label}
                                </button>
                            ))}
                        </div>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as RequestStatus | 'all')} className="px-3 py-1.5 rounded-lg text-xs border border-secondary/30 bg-surface focus:outline-none">
                            <option value="all">全ステータス</option>
                            {(Object.entries(STATUS_CONFIG) as [RequestStatus, typeof STATUS_CONFIG[RequestStatus]][]).map(([s, c]) => (
                                <option key={s} value={s}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            {/* リスト */}
            <main className="max-w-5xl mx-auto px-6 py-6 space-y-3">
                {filtered.map(req => {
                    const tc = TYPE_CONFIG[req.type];
                    const sc = STATUS_CONFIG[req.status];
                    return (
                        <div
                            key={req.id}
                            onClick={() => setSelectedRequest(req)}
                            className={`bg-surface rounded-xl border-l-4 shadow-sm cursor-pointer hover:shadow-md transition-all p-4 ${req.status === 'pending' ? 'border-orange-400' : req.status === 'approved' ? 'border-green-400' : req.status === 'rejected' ? 'border-red-400' : 'border-secondary/30'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                    <span className="text-2xl">{tc.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tc.bg} ${tc.color}`}>{tc.label}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                                        </div>
                                        <p className="font-medium text-headline text-sm">
                                            {req.type === 'leave' && `${(req as LeaveRequest).leaveType}（${(req as LeaveRequest).days}日）`}
                                            {req.type === 'travel' && `出張: ${(req as TravelRequest).destination}`}
                                            {req.type === 'training' && (req as TrainingRequest).trainingName}
                                            {req.type === 'supplies' && `備品購入 ${formatCurrency((req as SuppliesRequest).totalAmount)}`}
                                            {req.type === 'approval' && (req as ApprovalRequest).title}
                                        </p>
                                        <p className="text-xs text-paragraph/60 mt-0.5">{req.applicantName} • {formatDate(req.updatedAt)}</p>
                                    </div>
                                </div>
                                <svg className="w-4 h-4 text-paragraph/30 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>

                            {req.status === 'rejected' && req.rejectionReason && (
                                <div className="mt-3 pt-3 border-t border-secondary/10 text-xs text-red-500">
                                    却下理由: {req.rejectionReason}
                                </div>
                            )}
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-4 bg-secondary/20 rounded-full flex items-center justify-center text-2xl">📋</div>
                        <h2 className="text-lg font-medium text-headline mb-2">申請がありません</h2>
                        <p className="text-paragraph/70 text-sm">「新規申請」から申請を作成してください</p>
                    </div>
                )}
            </main>

            {/* 詳細モーダル */}
            {selectedRequest && (
                <RequestDetail
                    req={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onWithdraw={handleWithdraw}
                    currentUserName={currentUserName}
                />
            )}

            {/* 新規申請モーダル */}
            {showNewModal && (
                <NewRequestModal
                    onClose={() => setShowNewModal(false)}
                    onSave={handleSaveNew}
                    staffList={staffList}
                />
            )}
        </div>
    );
}
