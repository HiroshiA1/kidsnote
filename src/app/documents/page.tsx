'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppLayout';

type DocumentCategory = 'leave' | 'expense' | 'training' | 'supply' | 'other';
type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

interface InternalDocument {
  id: string;
  category: DocumentCategory;
  title: string;
  content: string;
  details: Record<string, string>;
  authorId: string;
  status: ApprovalStatus;
  approverId?: string;
  approvalComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  leave: '休暇申請',
  expense: '経費申請',
  training: '研修申請',
  supply: '備品申請',
  other: 'その他',
};

const CATEGORY_ICONS: Record<DocumentCategory, string> = {
  leave: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
  expense: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  training: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
  supply: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
  other: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
};

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: '下書き',
  pending: '承認待ち',
  approved: '承認済',
  rejected: '却下',
  cancelled: '取り消し',
};

const STATUS_COLORS: Record<ApprovalStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-blue-100 text-blue-600',
  approved: 'bg-green-100 text-green-600',
  rejected: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-400',
};

// サンプル申請データ
function generateSampleDocs(staffIds: string[]): InternalDocument[] {
  const now = new Date();
  return [
    {
      id: 'doc-1',
      category: 'leave',
      title: '有給休暇申請',
      content: '家庭の事情のため有給休暇を取得いたします。',
      details: { '種別': '有給休暇', '期間': '2月20日〜2月21日', '日数': '2日' },
      authorId: staffIds[2] ?? '',
      status: 'pending',
      createdAt: new Date(now.getTime() - 2 * 86400000),
      updatedAt: new Date(now.getTime() - 2 * 86400000),
    },
    {
      id: 'doc-2',
      category: 'expense',
      title: '教材費申請',
      content: '製作活動用の画用紙・折り紙等の購入申請です。',
      details: { '金額': '¥5,400', '用途': '製作活動材料', '購入先': 'ヨドバシカメラ' },
      authorId: staffIds[3] ?? '',
      status: 'approved',
      approverId: staffIds[0] ?? '',
      approvalComment: '承認します。領収書を提出してください。',
      createdAt: new Date(now.getTime() - 5 * 86400000),
      updatedAt: new Date(now.getTime() - 3 * 86400000),
    },
    {
      id: 'doc-3',
      category: 'training',
      title: '外部研修参加申請',
      content: '保育士スキルアップ研修（幼児理解と保育実践）への参加を希望します。',
      details: { '研修名': '保育士スキルアップ研修', '日程': '3月15日', '場所': '市民会館', '費用': '¥3,000' },
      authorId: staffIds[4] ?? '',
      status: 'pending',
      createdAt: new Date(now.getTime() - 1 * 86400000),
      updatedAt: new Date(now.getTime() - 1 * 86400000),
    },
    {
      id: 'doc-4',
      category: 'supply',
      title: '備品購入申請',
      content: '園庭の砂場用の砂の補充をお願いします。',
      details: { '品目': '砂場用抗菌砂', '数量': '10袋', '見積金額': '¥12,000' },
      authorId: staffIds[5] ?? '',
      status: 'draft',
      createdAt: new Date(now.getTime() - 1 * 86400000),
      updatedAt: new Date(now.getTime() - 1 * 86400000),
    },
    {
      id: 'doc-5',
      category: 'leave',
      title: '産前休暇申請',
      content: '出産予定日に伴い、産前休暇を申請いたします。',
      details: { '種別': '産前休暇', '期間': '4月1日〜5月15日', '出産予定日': '5月10日' },
      authorId: staffIds[6] ?? '',
      status: 'approved',
      approverId: staffIds[0] ?? '',
      createdAt: new Date(now.getTime() - 10 * 86400000),
      updatedAt: new Date(now.getTime() - 8 * 86400000),
    },
  ];
}

export default function DocumentsPage() {
  const { children, staff } = useApp();
  const staffIds = staff.map(s => s.id);

  const [documents, setDocuments] = useState<InternalDocument[]>(() => generateSampleDocs(staffIds));
  const [activeTab, setActiveTab] = useState<'records' | 'workflow'>('workflow');
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'all'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState<string | null>(null);
  const [approvalForm, setApprovalForm] = useState({ action: '' as 'approved' | 'rejected' | '', comment: '' });
  const [newForm, setNewForm] = useState({
    category: 'leave' as DocumentCategory,
    title: '',
    content: '',
    details: [{ key: '', value: '' }],
  });

  const getStaffName = (id: string) => {
    const s = staff.find(s => s.id === id);
    return s ? `${s.lastName} ${s.firstName}` : '';
  };

  const filteredDocs = documents.filter(d => {
    if (filterCategory !== 'all' && d.category !== filterCategory) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    return true;
  });

  const pendingCount = documents.filter(d => d.status === 'pending').length;

  const formatDate = (date: Date) =>
    date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });

  const createDocument = (asDraft: boolean) => {
    const now = new Date();
    const doc: InternalDocument = {
      id: `doc-${Date.now()}`,
      category: newForm.category,
      title: newForm.title || `${CATEGORY_LABELS[newForm.category]}`,
      content: newForm.content,
      details: Object.fromEntries(newForm.details.filter(d => d.key && d.value).map(d => [d.key, d.value])),
      authorId: staff[0]?.id ?? '',
      status: asDraft ? 'draft' : 'pending',
      createdAt: now,
      updatedAt: now,
    };
    setDocuments(prev => [doc, ...prev]);
    setShowNewModal(false);
    setNewForm({ category: 'leave', title: '', content: '', details: [{ key: '', value: '' }] });
  };

  const submitForApproval = (id: string) => {
    setDocuments(prev => prev.map(d =>
      d.id === id ? { ...d, status: 'pending' as ApprovalStatus, updatedAt: new Date() } : d
    ));
  };

  const openApproval = (id: string) => {
    setApprovalForm({ action: '', comment: '' });
    setShowApprovalModal(id);
  };

  const submitApproval = () => {
    if (!showApprovalModal || !approvalForm.action) return;
    setDocuments(prev => prev.map(d =>
      d.id === showApprovalModal ? {
        ...d,
        status: approvalForm.action as ApprovalStatus,
        approverId: staff[0]?.id ?? '',
        approvalComment: approvalForm.comment || undefined,
        updatedAt: new Date(),
      } : d
    ));
    setShowApprovalModal(null);
  };

  // クラス別にグループ化（指導要録用）
  const childrenByClass = children.reduce<Record<string, typeof children>>((acc, child) => {
    const cn = child.className;
    if (!acc[cn]) acc[cn] = [];
    acc[cn].push(child);
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-headline">書類</h1>
            {activeTab === 'workflow' && (
              <button
                onClick={() => setShowNewModal(true)}
                className="px-4 py-2 bg-button text-white rounded-lg text-sm hover:bg-button/90 transition-colors"
              >
                新規申請
              </button>
            )}
          </div>

          {/* タブ */}
          <div className="flex gap-1 bg-secondary/10 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('workflow')}
              className={`flex-1 px-4 py-2 rounded-md text-sm transition-colors ${
                activeTab === 'workflow'
                  ? 'bg-surface text-headline font-medium shadow-sm'
                  : 'text-paragraph/60 hover:text-paragraph'
              }`}
            >
              承認ワークフロー
              {pendingCount > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`flex-1 px-4 py-2 rounded-md text-sm transition-colors ${
                activeTab === 'records'
                  ? 'bg-surface text-headline font-medium shadow-sm'
                  : 'text-paragraph/60 hover:text-paragraph'
              }`}
            >
              園児書類
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {activeTab === 'workflow' && (
          <>
            {/* フィルター */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value as DocumentCategory | 'all')}
                className="px-3 py-1.5 rounded-lg text-sm border border-secondary/30 bg-surface focus:outline-none focus:ring-2 focus:ring-button/40"
              >
                <option value="all">全カテゴリ</option>
                {(Object.entries(CATEGORY_LABELS) as [DocumentCategory, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as ApprovalStatus | 'all')}
                className="px-3 py-1.5 rounded-lg text-sm border border-secondary/30 bg-surface focus:outline-none focus:ring-2 focus:ring-button/40"
              >
                <option value="all">全ステータス</option>
                {(Object.entries(STATUS_LABELS) as [ApprovalStatus, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* 申請一覧 */}
            <div className="space-y-3">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="bg-surface rounded-lg border border-secondary/20 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-5 h-5 text-paragraph/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={CATEGORY_ICONS[doc.category]} />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs px-2 py-0.5 bg-secondary/20 text-paragraph/70 rounded font-medium">
                              {CATEGORY_LABELS[doc.category]}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[doc.status]}`}>
                              {STATUS_LABELS[doc.status]}
                            </span>
                          </div>
                          <h3 className="font-medium text-headline">{doc.title}</h3>
                          <p className="text-sm text-paragraph/70 mt-1">{doc.content}</p>

                          {/* 詳細項目 */}
                          {Object.keys(doc.details).length > 0 && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                              {Object.entries(doc.details).map(([key, value]) => (
                                <span key={key} className="text-xs text-paragraph/60">
                                  {key}: <span className="text-paragraph font-medium">{value}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* 承認コメント */}
                          {doc.approvalComment && (
                            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200 text-xs">
                              <span className="text-green-700 font-medium">{getStaffName(doc.approverId ?? '')}:</span>{' '}
                              <span className="text-paragraph">{doc.approvalComment}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-2 text-xs text-paragraph/50">
                            <span>申請者: {getStaffName(doc.authorId)}</span>
                            <span>{formatDate(doc.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex items-center gap-2 mt-3 pl-13">
                      {doc.status === 'draft' && (
                        <button
                          onClick={() => submitForApproval(doc.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          承認申請する
                        </button>
                      )}
                      {doc.status === 'pending' && (
                        <button
                          onClick={() => openApproval(doc.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                        >
                          承認/却下
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredDocs.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 bg-secondary/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-paragraph/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-medium text-headline mb-2">該当する書類がありません</h2>
                  <p className="text-paragraph/70">「新規申請」から書類を作成してください</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'records' && (
          <>
            {/* 出席簿 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-button/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-button" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-headline">出席簿</h2>
                  <p className="text-sm text-paragraph/60">月別の出席管理</p>
                </div>
                <Link
                  href="/documents/attendance"
                  className="ml-auto px-4 py-2 bg-button text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  出席簿を開く
                </Link>
              </div>
            </section>

            {/* 指導要録 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-tertiary/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-headline">指導要録</h2>
                  <p className="text-sm text-paragraph/60">園児を選択して要録を作成</p>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(childrenByClass).map(([className, classChildren]) => (
                  <div key={className} className="bg-surface rounded-xl border border-secondary/20 overflow-hidden">
                    <div className="bg-secondary/10 px-4 py-2.5">
                      <h3 className="font-medium text-headline text-sm">{className} ({classChildren.length}名)</h3>
                    </div>
                    <div className="divide-y divide-secondary/10">
                      {classChildren.map(child => (
                        <Link
                          key={child.id}
                          href={`/children/${child.id}/record`}
                          className="flex items-center justify-between px-4 py-3 hover:bg-secondary/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-button/10 rounded-full flex items-center justify-center text-sm font-medium text-button">
                              {(child.lastNameKanji || child.lastName).charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-headline">
                                {child.lastNameKanji || child.lastName} {child.firstNameKanji || child.firstName}
                              </p>
                              <p className="text-xs text-paragraph/60">{child.grade}</p>
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-paragraph/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* 新規申請モーダル */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-headline mb-4">新規申請</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-2">カテゴリ</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.entries(CATEGORY_LABELS) as [DocumentCategory, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setNewForm(f => ({ ...f, category: key }))}
                      className={`px-2 py-2 rounded-lg text-xs transition-colors ${
                        newForm.category === key
                          ? 'bg-button text-white'
                          : 'bg-secondary/20 text-paragraph/60 hover:bg-secondary/30'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-1">タイトル</label>
                <input
                  type="text"
                  value={newForm.title}
                  onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={CATEGORY_LABELS[newForm.category]}
                  className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-1">内容</label>
                <textarea
                  value={newForm.content}
                  onChange={e => setNewForm(f => ({ ...f, content: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40 resize-none"
                  placeholder="申請の内容を記入..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-paragraph/80">詳細項目</label>
                  <button
                    onClick={() => setNewForm(f => ({ ...f, details: [...f.details, { key: '', value: '' }] }))}
                    className="text-xs text-button hover:text-button/80"
                  >
                    + 追加
                  </button>
                </div>
                <div className="space-y-2">
                  {newForm.details.map((d, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={d.key}
                        onChange={e => setNewForm(f => ({
                          ...f,
                          details: f.details.map((dd, j) => j === i ? { ...dd, key: e.target.value } : dd),
                        }))}
                        placeholder="項目名"
                        className="w-1/3 px-3 py-1.5 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40"
                      />
                      <input
                        type="text"
                        value={d.value}
                        onChange={e => setNewForm(f => ({
                          ...f,
                          details: f.details.map((dd, j) => j === i ? { ...dd, value: e.target.value } : dd),
                        }))}
                        placeholder="内容"
                        className="flex-1 px-3 py-1.5 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40"
                      />
                      {newForm.details.length > 1 && (
                        <button
                          onClick={() => setNewForm(f => ({ ...f, details: f.details.filter((_, j) => j !== i) }))}
                          className="text-paragraph/40 hover:text-alert"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-sm text-paragraph/70 hover:bg-secondary/20 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => createDocument(true)}
                className="px-4 py-2 text-sm border border-secondary/30 text-paragraph/70 rounded-lg hover:bg-secondary/10 transition-colors"
              >
                下書き保存
              </button>
              <button
                onClick={() => createDocument(false)}
                className="px-4 py-2 text-sm bg-button text-white rounded-lg hover:bg-button/90 transition-colors"
              >
                承認申請する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 承認/却下モーダル */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowApprovalModal(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-headline mb-4">承認判断</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-2">判断</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setApprovalForm(f => ({ ...f, action: 'approved' }))}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors border ${
                      approvalForm.action === 'approved'
                        ? 'border-green-400 bg-green-50 text-green-700 font-medium'
                        : 'border-secondary/30 text-paragraph/60 hover:bg-secondary/10'
                    }`}
                  >
                    承認
                  </button>
                  <button
                    onClick={() => setApprovalForm(f => ({ ...f, action: 'rejected' }))}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors border ${
                      approvalForm.action === 'rejected'
                        ? 'border-red-400 bg-red-50 text-red-700 font-medium'
                        : 'border-secondary/30 text-paragraph/60 hover:bg-secondary/10'
                    }`}
                  >
                    却下
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-1">コメント（任意）</label>
                <textarea
                  value={approvalForm.comment}
                  onChange={e => setApprovalForm(f => ({ ...f, comment: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/40 resize-none"
                  placeholder="コメントを入力..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowApprovalModal(null)}
                className="px-4 py-2 text-sm text-paragraph/70 hover:bg-secondary/20 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={submitApproval}
                disabled={!approvalForm.action}
                className={`px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-40 ${
                  approvalForm.action === 'rejected' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                確定する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
