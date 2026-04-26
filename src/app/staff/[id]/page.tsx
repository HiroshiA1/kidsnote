'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp, Staff } from '@/components/AppLayout';
import { calculateYearsOfService } from '@/lib/formatters';
import { hasMinRole } from '@/lib/supabase/auth';
import { defaultStaffRoleConfigs } from '@/types/settings';
import { mapSupabaseStaff, SupabaseStaffRow } from '@/lib/staffMapper';

const defaultRoleColors: Record<string, string> = {
  '園長': 'bg-button text-white',
  '主任': 'bg-tertiary text-headline',
  '担任': 'bg-secondary text-headline',
  '副担任': 'bg-secondary/50 text-headline',
  'パート': 'bg-paragraph/20 text-paragraph',
};

function getRoleColor(role: string): string {
  return defaultRoleColors[role] ?? 'bg-paragraph/10 text-paragraph';
}

/** 職員編集モーダル */
function StaffEditModal({ staff, onSave, onClose, roleNames }: { staff: Staff; onSave: (s: Staff) => void; onClose: () => void; roleNames: string[] }) {
  const [form, setForm] = useState({
    firstName: staff.firstName,
    lastName: staff.lastName,
    role: staff.role,
    classAssignment: staff.classAssignment || '',
    email: staff.email || '',
    phone: staff.phone || '',
    qualifications: staff.qualifications.join(', '),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...staff,
      firstName: form.firstName,
      lastName: form.lastName,
      role: form.role,
      classAssignment: form.classAssignment || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      qualifications: form.qualifications.split(/[,、]/).map(s => s.trim()).filter(Boolean),
    });
  };

  const inputClass = "w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30";
  const labelClass = "block text-sm font-medium text-paragraph/70 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface px-6 py-4 border-b border-secondary/20 flex items-center justify-between">
          <h2 className="text-lg font-bold text-headline">職員情報を編集</h2>
          <button onClick={onClose} className="text-paragraph/60 hover:text-paragraph text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>姓</label>
              <input className={inputClass} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
            </div>
            <div>
              <label className={labelClass}>名</label>
              <input className={inputClass} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>役職</label>
              <select className={inputClass} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {roleNames.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>担当クラス</label>
              <input className={inputClass} value={form.classAssignment} onChange={e => setForm(f => ({ ...f, classAssignment: e.target.value }))} placeholder="さくら組" />
            </div>
          </div>
          <div>
            <label className={labelClass}>メールアドレス</label>
            <input className={inputClass} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>電話番号</label>
            <input className={inputClass} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>資格（カンマ区切り）</label>
            <input className={inputClass} value={form.qualifications} onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))} placeholder="保育士, 幼稚園教諭二種" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-button text-white rounded-lg font-medium hover:opacity-90 transition-opacity">保存</button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-secondary/30 text-paragraph rounded-lg font-medium hover:bg-secondary/50 transition-colors">キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 退職処理モーダル。理由は任意 (空なら API には null を渡す)。
 * 親から `onSubmit(reason)` を受け、成功で onClose する。失敗時は内部エラー表示。
 */
function StaffArchiveModal({
  staff,
  onSubmit,
  onClose,
}: {
  staff: Staff;
  onSubmit: (reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(reason.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : '退職処理に失敗しました');
    } finally {
      // L2: 例外時も submitting フラグを必ず戻す
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-secondary/20 flex items-center justify-between">
          <h2 className="text-lg font-bold text-headline">退職処理</h2>
          <button onClick={onClose} className="text-paragraph/60 hover:text-paragraph text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-button/5 border border-button/20 rounded-lg p-3">
            <p className="text-sm text-headline font-medium">{staff.lastName} {staff.firstName}</p>
            <p className="text-xs text-paragraph/60">{staff.role}{staff.classAssignment ? ` / ${staff.classAssignment}` : ''}</p>
          </div>

          <div className="text-xs text-paragraph/70 bg-secondary/10 rounded-lg p-3 space-y-1">
            <p>・ログインが無効化され、職員一覧から非表示になります。</p>
            <p>・出席・記録などの過去データは保持されます。</p>
            <p>・退職者一覧からいつでも復職処理ができます。</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-paragraph/70 mb-1">退職理由（任意）</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="例: 自己都合退職、定年、契約満了 など"
              className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
            />
          </div>

          {error && (
            <div className="text-sm text-alert bg-alert/10 px-3 py-2 rounded-lg">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-alert text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? '処理中...' : '退職処理する'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-secondary/30 text-paragraph rounded-lg font-medium hover:bg-secondary/50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * アカウント作成モーダル。
 * 親から `onSubmit(email, password)` を受け取り、成功すれば onClose する。失敗時はエラー文言をモーダル内に出す。
 * (UI と API 呼び出しの責務を分け、モーダル自身は staffId を知らない)
 */
function AccountCreateModal({
  staff,
  onSubmit,
  onClose,
}: {
  staff: Staff;
  onSubmit: (email: string, password: string) => Promise<void>;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(staff.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setConfirmPassword(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('有効なメールアドレスを入力してください');
      return;
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上にしてください');
      return;
    }
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setCreating(true);
    try {
      await onSubmit(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アカウント作成に失敗しました');
    } finally {
      // L2: 例外発生時も creating フラグを必ず戻す
      setCreating(false);
    }
  };

  const inputClass = "w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-secondary/20 flex items-center justify-between">
          <h2 className="text-lg font-bold text-headline">アカウント作成</h2>
          <button onClick={onClose} className="text-paragraph/60 hover:text-paragraph text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-button/5 border border-button/20 rounded-lg p-3">
            <p className="text-sm text-headline font-medium">{staff.lastName} {staff.firstName}</p>
            <p className="text-xs text-paragraph/60">{staff.role}{staff.classAssignment ? ` / ${staff.classAssignment}` : ''}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-paragraph/70 mb-1">ログイン用メールアドレス</label>
            <input className={inputClass} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="example@kidsnote.jp" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-paragraph/70">パスワード</label>
              <button type="button" onClick={generatePassword} className="text-xs text-button hover:underline">
                自動生成
              </button>
            </div>
            <input className={inputClass} type="text" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="8文字以上" />
          </div>

          <div>
            <label className="block text-sm font-medium text-paragraph/70 mb-1">パスワード確認</label>
            <input className={inputClass} type="text" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="もう一度入力" />
          </div>

          {error && (
            <div className="text-sm text-alert bg-alert/10 px-3 py-2 rounded-lg">{error}</div>
          )}

          <div className="bg-secondary/10 rounded-lg p-3 text-xs text-paragraph/70 space-y-1">
            <p className="font-medium text-headline">セキュリティ要件:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>パスワードは8文字以上</li>
              <li>作成後、職員にログイン情報を安全な方法で伝えてください</li>
              <li>初回ログイン後のパスワード変更を推奨</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={creating} className="flex-1 py-2.5 bg-button text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {creating ? '作成中...' : 'アカウント作成'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-secondary/30 text-paragraph rounded-lg font-medium hover:bg-secondary/50 transition-colors">
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    staff: staffData,
    staffStatus,
    updateStaff,
    createStaffAccount,
    archiveStaff,
    restoreStaff,
    refetchStaff,
    currentUserRole,
    addToast,
    settings,
  } = useApp();
  const roleConfigs = settings.staffRoleConfigs ?? defaultStaffRoleConfigs;
  const roleNames = roleConfigs.map(r => r.name);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  // 退職済みは GET /api/staff (in-service only) には含まれない。詳細ページに直接遷移したケースに備え
  // ?archived=include で再取得した結果を別 state に保持する。
  const [archivedFallback, setArchivedFallback] = useState<Staff | null>(null);
  const [archivedFallbackTried, setArchivedFallbackTried] = useState(false);

  const staffId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const staff = staffData.find(s => s.id === staffId) ?? archivedFallback;
  const isAdmin = hasMinRole(currentUserRole, 'manager');
  const isAdminOnly = currentUserRole === 'admin'; // 退職処理は admin のみ (manager 不可)
  const isArchived = !!staff?.archivedAt;

  // 在職リストにない & 取得済みの状況なら、退職者として再取得を試みる
  useEffect(() => {
    if (staffStatus !== 'ready') return;
    if (!staffId) return;
    if (staffData.find(s => s.id === staffId)) return;
    if (archivedFallbackTried) return;
    setArchivedFallbackTried(true);
    (async () => {
      try {
        const res = await fetch(`/api/staff?archived=include`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as { staff: SupabaseStaffRow[] };
        const found = json.staff.find(r => r.id === staffId);
        if (found) setArchivedFallback(mapSupabaseStaff(found));
      } catch {
        // 失敗時は通常 not found 表示
      }
    })();
  }, [staffStatus, staffId, staffData, archivedFallbackTried]);

  // staff 取得完了前は not found を出さない (loading 中の誤判定防止)
  if (staffStatus === 'loading' || staffStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-paragraph/60">
          {staffStatus === 'loading' ? '読み込み中...' : 'ログインが必要です'}
        </p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-paragraph/60">職員が見つかりません</p>
          <Link href="/staff" className="text-sm text-button hover:underline mt-2 inline-block">一覧に戻る</Link>
        </div>
      </div>
    );
  }

  const yearsOfService = calculateYearsOfService(staff.hireDate);

  /**
   * モーダルからの submit を受け、POST /api/staff/[id]/account を呼ぶ。
   * 成功時のみモーダルを閉じる (失敗時はモーダル内エラー表示を活かす)。
   */
  const handleAccountSubmit = async (email: string, password: string) => {
    if (!staff) return;
    await createStaffAccount(staff.id, email, password);
    setShowAccountModal(false);
    addToast({ type: 'success', message: `${staff.lastName} ${staff.firstName} のアカウントを作成しました` });
  };

  /** 退職処理。成功で一覧に戻す (詳細ページに残ると archivedFallback で再取得されるが、UX としては一覧復帰が自然) */
  const handleArchiveSubmit = async (reason: string) => {
    if (!staff) return;
    await archiveStaff(staff.id, reason || undefined);
    setShowArchiveModal(false);
    addToast({ type: 'success', message: `${staff.lastName} ${staff.firstName} を退職処理しました` });
    router.push('/staff');
  };

  /** 復職処理。成功で在職リストに戻り、staffData 経由で再取得される */
  const handleRestore = async () => {
    if (!staff) return;
    try {
      await restoreStaff(staff.id);
      // 復職したので archivedFallback を捨て、refetchStaff で在職側に再ロード
      setArchivedFallback(null);
      setArchivedFallbackTried(false);
      await refetchStaff();
      addToast({ type: 'success', message: `${staff.lastName} ${staff.firstName} を復職しました` });
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : '復職処理に失敗しました',
      });
    }
  };

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/staff" className="text-paragraph/60 hover:text-paragraph transition-colors text-sm">← 一覧に戻る</Link>
            <h1 className="text-xl font-bold text-headline">職員詳細</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && !isArchived && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-button text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                編集
              </button>
            )}
            {isAdminOnly && !isArchived && (
              <button
                onClick={() => setShowArchiveModal(true)}
                className="px-4 py-2 bg-surface border border-alert/40 text-alert rounded-lg text-sm font-medium hover:bg-alert/10 transition-colors"
              >
                退職処理
              </button>
            )}
            {isAdminOnly && isArchived && (
              <button
                onClick={handleRestore}
                className="px-4 py-2 bg-tertiary text-headline rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                復職する
              </button>
            )}
          </div>
        </div>
      </header>

      {isArchived && staff.archivedAt && (
        <div className="bg-alert/10 border-b border-alert/30">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-alert flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-headline">
              <p className="font-medium">退職処理済み（{staff.archivedAt.toLocaleDateString('ja-JP')}）</p>
              {staff.archiveReason && (
                <p className="text-xs text-paragraph/70 mt-0.5">理由: {staff.archiveReason}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <StaffEditModal
          staff={staff}
          roleNames={roleNames}
          onSave={async (updated) => {
            try {
              await updateStaff(updated);
              setShowEditModal(false);
              addToast({ message: '職員情報を更新しました', type: 'success' });
            } catch (err) {
              addToast({
                type: 'error',
                message: err instanceof Error ? err.message : '職員情報の更新に失敗しました',
              });
            }
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showAccountModal && (
        <AccountCreateModal
          staff={staff}
          onSubmit={handleAccountSubmit}
          onClose={() => setShowAccountModal(false)}
        />
      )}

      {showArchiveModal && (
        <StaffArchiveModal
          staff={staff}
          onSubmit={handleArchiveSubmit}
          onClose={() => setShowArchiveModal(false)}
        />
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 基本情報 */}
        <section className="bg-surface rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 bg-button/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-button">{staff.lastName.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-headline">{staff.lastName} {staff.firstName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getRoleColor(staff.role)}`}>{staff.role}</span>
                {staff.classAssignment && (
                  <span className="text-sm text-paragraph/60">{staff.classAssignment}</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-paragraph/60">勤続年数</span>
              <p className="text-headline font-medium">{yearsOfService}年</p>
            </div>
            <div>
              <span className="text-paragraph/60">入職日</span>
              <p className="text-headline font-medium">{staff.hireDate.toLocaleDateString('ja-JP')}</p>
            </div>
            <div>
              <span className="text-paragraph/60">メール</span>
              <p className="text-headline font-medium truncate">{staff.email || '-'}</p>
            </div>
            <div>
              <span className="text-paragraph/60">電話</span>
              <p className="text-headline font-medium">{staff.phone || '-'}</p>
            </div>
          </div>

          {staff.qualifications.length > 0 && (
            <div className="mt-4 pt-4 border-t border-paragraph/10">
              <span className="text-sm text-paragraph/60">保有資格</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {staff.qualifications.map((qual, i) => (
                  <span key={i} className="px-3 py-1 bg-tertiary/20 text-headline rounded-full text-sm">{qual}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* アカウント管理 — hasAccount は memberships 存在で判定 (API join 経由、真偽値が実態と一致) */}
        {!isArchived && (
        <section className="bg-surface rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-headline mb-4">アカウント管理</h3>

          {staff.hasAccount ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-tertiary/10 border border-tertiary/30 rounded-xl">
                <div className="w-10 h-10 bg-tertiary/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-headline">アカウント作成済み</p>
                  <p className="text-xs text-paragraph/60">ログインメール: {staff.email || '-'}</p>
                </div>
              </div>
              {/*
                アカウント無効化は memberships 削除 + auth user 無効化の設計未確定のため一時停止。
                DELETE /api/staff/[id] または別エンドポイント設計 (次フェーズ) で再導入する。
              */}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-paragraph/5 border border-paragraph/10 rounded-xl">
                <div className="w-10 h-10 bg-paragraph/10 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-paragraph/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-headline">アカウント未作成</p>
                  <p className="text-xs text-paragraph/60">この職員はまだシステムにログインできません</p>
                </div>
              </div>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => setShowAccountModal(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-button text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  アカウントを作成
                </button>
              ) : (
                <p className="text-xs text-paragraph/60">
                  アカウント作成は管理者のみ可能です。
                </p>
              )}
            </div>
          )}

          {/* ログインフロー説明 */}
          <div className="mt-6 pt-4 border-t border-paragraph/10">
            <h4 className="text-sm font-medium text-headline mb-2">ログイン方法</h4>
            <ol className="space-y-2 text-xs text-paragraph/70">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-button/20 text-button text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                <span>管理者がこの画面からアカウントを作成</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-button/20 text-button text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                <span>ログイン情報（メール・パスワード）を安全な方法で職員に伝達</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-button/20 text-button text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                <span>職員がログイン画面からメール・パスワードでログイン</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-button/20 text-button text-xs font-bold flex items-center justify-center flex-shrink-0">4</span>
                <span>初回ログイン後、設定画面からパスワード変更を推奨</span>
              </li>
            </ol>
          </div>
        </section>
        )}
      </main>
    </div>
  );
}
