'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useApp, Staff } from '@/components/AppLayout';
import { mapSupabaseStaff, SupabaseStaffRow } from '@/lib/staffMapper';

/**
 * 退職者一覧。
 *
 * AppLayout の `staff` は archived=active のみ取得するため、本ページは独立に
 * `?archived=only` で取得する。復職は AppLayout 経由 (restoreStaff) に投げ、成功時に
 * ローカル archived リストからも除外する。
 */
export default function ArchivedStaffPage() {
  const { restoreStaff, currentUserRole, addToast, refetchStaff } = useApp();
  const isAdmin = currentUserRole === 'admin';

  const [archived, setArchived] = useState<Staff[] | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'unauthenticated'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchArchived = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/staff?archived=only', { cache: 'no-store' });
      if (res.status === 401) {
        setStatus('unauthenticated');
        setArchived(null);
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? '取得失敗');
      }
      const json = (await res.json()) as { staff: SupabaseStaffRow[] };
      const list = json.staff.map(mapSupabaseStaff);
      list.sort((a, b) => (b.archivedAt?.getTime() ?? 0) - (a.archivedAt?.getTime() ?? 0));
      setArchived(list);
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得失敗');
      setArchived(null);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  const handleRestore = async (staff: Staff) => {
    if (!isAdmin) {
      addToast({ type: 'error', message: '復職は管理者のみ実行できます' });
      return;
    }
    setRestoringId(staff.id);
    try {
      await restoreStaff(staff.id);
      // 在職リスト・退職リスト両方を最新化
      setArchived(prev => prev?.filter(s => s.id !== staff.id) ?? null);
      await refetchStaff();
      addToast({ type: 'success', message: `${staff.lastName} ${staff.firstName} を復職しました` });
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : '復職処理に失敗しました',
      });
    } finally {
      // L2: try/finally で flag を必ず戻す
      setRestoringId(null);
    }
  };

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/staff" className="text-paragraph/60 hover:text-paragraph transition-colors text-sm">← 在職者一覧に戻る</Link>
            <h1 className="text-xl font-bold text-headline">退職者一覧</h1>
          </div>
          <span className="text-sm text-paragraph/60">{archived?.length ?? 0}名</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6">
        {status === 'loading' && (
          <p className="text-sm text-paragraph/60">読み込み中...</p>
        )}
        {status === 'unauthenticated' && (
          <p className="text-sm text-alert">
            ログインが必要です。<Link href="/login" className="underline">ログイン</Link>してください。
          </p>
        )}
        {status === 'error' && (
          <div className="text-sm text-alert flex items-center gap-3">
            <span>退職者の取得に失敗しました{error ? `(${error})` : ''}。</span>
            <button
              type="button"
              onClick={fetchArchived}
              className="text-button underline hover:no-underline"
            >
              再試行
            </button>
          </div>
        )}
        {status === 'ready' && archived && archived.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg text-paragraph/60">退職者はまだいません</p>
          </div>
        )}
        {status === 'ready' && archived && archived.length > 0 && (
          <div className="bg-surface rounded-xl border border-secondary/20 overflow-hidden">
            {archived.map(staff => (
              <div key={staff.id} className="flex items-center gap-4 px-4 py-3 border-b border-secondary/10 last:border-b-0">
                <div className="w-10 h-10 bg-paragraph/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-paragraph/60">{staff.lastName.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/staff/${staff.id}`} className="font-bold text-headline hover:underline">
                    {staff.lastName} {staff.firstName}
                  </Link>
                  <p className="text-xs text-paragraph/60">
                    {staff.role}
                    {staff.archivedAt && ` ・ 退職: ${staff.archivedAt.toLocaleDateString('ja-JP')}`}
                  </p>
                  {staff.archiveReason && (
                    <p className="text-xs text-paragraph/50 mt-0.5">理由: {staff.archiveReason}</p>
                  )}
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleRestore(staff)}
                    disabled={restoringId === staff.id}
                    className="px-3 py-1.5 bg-tertiary text-headline text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {restoringId === staff.id ? '処理中...' : '復職'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
