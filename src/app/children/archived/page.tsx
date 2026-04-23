'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppLayout';
import { hasMinRole } from '@/lib/supabase/auth';
import { Button } from '@/components/Button';
import { countChildActivity } from '@/lib/childActivityCount';

export default function ArchivedChildrenPage() {
  const {
    children: allChildren,
    restoreChild,
    removeChild,
    openConfirm,
    addToast,
    currentUserRole,
    messages,
    attendance,
  } = useApp();

  const canManage = hasMinRole(currentUserRole, 'manager'); // admin|manager
  const canPermanentlyDelete = currentUserRole === 'admin'; // 物理削除は admin 限定

  const archivedChildren = useMemo(
    () =>
      allChildren
        .filter(c => !!c.archivedAt)
        .sort((a, b) => (b.archivedAt!.getTime() - a.archivedAt!.getTime())),
    [allChildren],
  );

  const handleRestore = async (childId: string, name: string) => {
    if (!canManage) {
      addToast({ type: 'error', message: '復元は管理者・主任のみ実行できます' });
      return;
    }
    const confirmed = await openConfirm({
      title: `${name} さんを復元します`,
      message: '一覧に再表示され、退園状態が解除されます。',
      type: 'info',
      confirmLabel: '復元する',
    });
    if (confirmed) {
      restoreChild(childId);
      addToast({ type: 'success', message: `${name} さんを復元しました` });
    }
  };

  const handlePermanentDelete = async (
    childId: string,
    name: string,
    growthCount: number,
    attendanceCount: number,
  ) => {
    if (!canPermanentlyDelete) {
      addToast({ type: 'error', message: '完全削除は管理者のみ実行できます' });
      return;
    }
    const confirmed = await openConfirm({
      title: `${name} さんを完全に削除します`,
      message: '園児情報が完全に削除され、復元できなくなります。関連する成長記録・出欠記録はデータとしては残りますが、園児との紐付けは失われます。',
      type: 'danger',
      influenceScope: [
        { label: '関連する成長記録', count: growthCount },
        { label: '関連する出欠記録', count: attendanceCount, unit: '日分' },
      ],
      typedConfirm: { keyword: '削除' },
      // 不可逆削除は typed confirm に加え、pointer デバイス経由では 1秒長押しで最終確定
      longPress: { durationMs: 1000 },
      confirmLabel: '完全削除する',
    });
    if (confirmed) {
      removeChild(childId);
      addToast({ type: 'success', message: `${name} さんを完全に削除しました` });
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-headline">退園済み(アーカイブ)園児</h1>
            {canManage && (
              <p className="text-xs text-paragraph/50">{archivedChildren.length}名</p>
            )}
          </div>
          <Link
            href="/children"
            className="text-sm text-button hover:underline"
          >
            在園中一覧へ戻る
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4">
        {!canManage ? (
          <div className="bg-surface rounded-lg border border-alert/40 p-6 text-center space-y-3">
            <p className="text-headline font-medium">アクセス権限がありません</p>
            <p className="text-sm text-paragraph/80">
              退園済み(アーカイブ)園児の閲覧・操作は、管理者または主任のみ可能です。
            </p>
            <Link href="/children" className="inline-block text-sm text-button hover:underline">
              在園中一覧へ戻る
            </Link>
          </div>
        ) : archivedChildren.length === 0 ? (
          <div className="text-center py-12 text-paragraph/50">
            <p>退園済みの園児はいません。</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {archivedChildren.map(child => {
              const name = `${child.lastNameKanji || child.lastName} ${child.firstNameKanji || child.firstName}`.trim();
              const archivedAtStr = child.archivedAt?.toLocaleDateString('ja-JP', {
                year: 'numeric', month: '2-digit', day: '2-digit',
              }) ?? '-';
              const { growthCount, attendanceCount } = countChildActivity(child, messages, attendance);
              return (
                <li
                  key={child.id}
                  className="bg-surface rounded-lg border border-secondary/30 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-headline">
                      {name}
                      <span className="ml-2 text-xs text-paragraph/60">{child.className}</span>
                    </p>
                    <p className="text-xs text-paragraph/60 mt-0.5">
                      退園日: {archivedAtStr}
                      {child.archiveReason && <span className="ml-2">理由: {child.archiveReason}</span>}
                    </p>
                    <p className="text-xs text-paragraph/50 mt-0.5">
                      関連する成長記録: {growthCount}件 / 出欠: {attendanceCount}日分
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="commit"
                      onClick={() => handleRestore(child.id, name)}
                      disabled={!canManage}
                    >
                      復元
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handlePermanentDelete(child.id, name, growthCount, attendanceCount)}
                      disabled={!canPermanentlyDelete}
                      title={canPermanentlyDelete ? '完全削除' : '完全削除は管理者のみ'}
                    >
                      完全削除
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
