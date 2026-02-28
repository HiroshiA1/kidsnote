'use client';

import Link from 'next/link';
import { useApp } from './AppLayout';
import { getChildDisplayName } from '@/lib/childrenStore';

/**
 * 園児IDから名前を解決してリンク付きで表示するコンポーネント
 */
export function ChildLink({ childId, className }: { childId: string; className?: string }) {
  const { children } = useApp();
  const name = getChildDisplayName(childId, children);

  return (
    <Link
      href={`/children/${childId}`}
      className={`text-button hover:underline ${className ?? ''}`}
    >
      {name}
    </Link>
  );
}

/**
 * 複数の園児IDをリンク付きで「、」区切りで表示
 */
export function ChildLinks({ childIds, className }: { childIds: string[]; className?: string }) {
  if (childIds.length === 0) return null;

  return (
    <span className={className}>
      {childIds.map((id, i) => (
        <span key={id}>
          {i > 0 && '、'}
          <ChildLink childId={id} />
        </span>
      ))}
    </span>
  );
}

/**
 * メッセージのlinkedChildIdsから園児名を解決するヘルパー
 * linkedChildIdsがない場合はフォールバックとして元のテキスト名を返す
 */
export function useLinkedChildNames(linkedChildIds?: string[]): { names: string[]; hasLinks: boolean } {
  const { children } = useApp();

  if (!linkedChildIds || linkedChildIds.length === 0) {
    return { names: [], hasLinks: false };
  }

  const names = linkedChildIds.map(id => getChildDisplayName(id, children));
  return { names, hasLinks: true };
}
