'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ChildRelationship,
  PeerRelationType,
  peerRelationLabels,
  peerRelationColors,
  peerRelationIcons,
} from '@/types/child';
import { ChildWithGrowth, getChildDisplayName } from '@/lib/childrenStore';

interface ChildRelationshipsProps {
  child: ChildWithGrowth;
  allChildren: ChildWithGrowth[];
  onUpdate: (relationships: ChildRelationship[]) => void;
  /** true の場合、閲覧のみで追加/編集/削除の導線を隠す(退園済み園児などで使用) */
  readOnly?: boolean;
}

/** 園児選択コンボボックス */
function ChildPicker({
  allChildren,
  excludeIds,
  value,
  onChange,
}: {
  allChildren: ChildWithGrowth[];
  excludeIds: Set<string>;
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const candidates = allChildren
    .filter(c => !excludeIds.has(c.id))
    .filter(c => {
      if (!query.trim()) return true;
      const q = query.trim();
      return [c.firstName, c.lastName, c.firstNameKanji, c.lastNameKanji, c.className]
        .filter(Boolean)
        .some(n => n!.includes(q));
    })
    .slice(0, 15);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = value ? allChildren.find(c => c.id === value) : null;

  return (
    <div ref={ref} className="relative">
      {selected ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-secondary/30 rounded-lg bg-surface">
          <span className="text-sm text-headline font-medium flex-1">
            {getChildDisplayName(selected.id, allChildren)}
          </span>
          <button
            type="button"
            onClick={() => { onChange(''); setQuery(''); }}
            className="text-paragraph/40 hover:text-paragraph text-xs"
          >
            &times;
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="園児名で検索..."
          className="w-full px-3 py-2 border border-secondary/30 rounded-lg bg-surface text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
        />
      )}
      {open && !selected && (
        <div className="absolute z-30 top-full mt-1 left-0 right-0 bg-surface border border-secondary/30 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {candidates.length > 0 ? candidates.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onChange(c.id); setOpen(false); setQuery(''); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/20 transition-colors flex items-center gap-2"
            >
              <span className="w-6 h-6 rounded-full bg-secondary/30 flex items-center justify-center text-xs font-bold text-headline">
                {(c.lastNameKanji || c.lastName).charAt(0)}
              </span>
              <span className="text-headline">{getChildDisplayName(c.id, allChildren)}</span>
              <span className="text-paragraph/40 text-xs ml-auto">{c.className}</span>
            </button>
          )) : (
            <div className="px-3 py-3 text-xs text-paragraph/50 text-center">該当なし</div>
          )}
        </div>
      )}
    </div>
  );
}

/** 関係性追加・編集フォーム */
function RelationshipForm({
  allChildren,
  excludeIds,
  initial,
  onSave,
  onCancel,
}: {
  allChildren: ChildWithGrowth[];
  excludeIds: Set<string>;
  initial?: ChildRelationship;
  onSave: (rel: ChildRelationship) => void;
  onCancel: () => void;
}) {
  const [targetId, setTargetId] = useState(initial?.targetChildId || '');
  const [type, setType] = useState<PeerRelationType>(initial?.type || 'close_friend');
  const [note, setNote] = useState(initial?.note || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;
    onSave({
      id: initial?.id || crypto.randomUUID(),
      targetChildId: targetId,
      type,
      note: note.trim() || undefined,
      updatedAt: new Date(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-secondary/5 border border-secondary/20 rounded-xl">
      <div>
        <label className="block text-sm font-medium text-paragraph/70 mb-1">相手の園児</label>
        <ChildPicker
          allChildren={allChildren}
          excludeIds={excludeIds}
          value={targetId}
          onChange={setTargetId}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-paragraph/70 mb-2">関係性</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(peerRelationLabels) as PeerRelationType[]).map(t => {
            const colors = peerRelationColors[t];
            const selected = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selected
                    ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-offset-1 ring-current`
                    : 'bg-surface border-secondary/30 text-paragraph/60 hover:bg-secondary/10'
                }`}
              >
                <span className="mr-1">{peerRelationIcons[t]}</span>
                {peerRelationLabels[t]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-paragraph/70 mb-1">具体的なメモ（任意）</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="例: ブロック遊びでいつも一緒。互いに刺激し合っている。"
          className="w-full px-3 py-2 border border-secondary/30 rounded-lg bg-surface text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30 resize-none h-20"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!targetId}
          className="px-4 py-2 bg-button text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {initial ? '更新' : '追加'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-secondary/30 text-paragraph rounded-lg text-sm hover:bg-secondary/50 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

/** 関係性カード（1件分） */
function RelationshipCard({
  rel,
  allChildren,
  onEdit,
  onDelete,
}: {
  rel: ChildRelationship;
  allChildren: ChildWithGrowth[];
  /** 未指定ならアクションボタン非表示(閲覧のみ) */
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const target = allChildren.find(c => c.id === rel.targetChildId);
  const colors = peerRelationColors[rel.type];

  return (
    <div className={`border rounded-xl p-4 ${colors.border} ${colors.bg}`}>
      <div className="flex items-start gap-3">
        {/* アバター */}
        <Link href={target ? `/children/${target.id}` : '#'} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-white/80 border border-secondary/20 flex items-center justify-center shadow-sm hover:shadow transition-shadow">
            <span className="text-sm font-bold text-headline">
              {target ? (target.lastNameKanji || target.lastName).charAt(0) : '?'}
            </span>
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={target ? `/children/${target.id}` : '#'}
              className="font-medium text-headline hover:underline text-sm"
            >
              {target ? getChildDisplayName(target.id, allChildren) : '不明'}
            </Link>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.text} bg-white/60`}>
              {peerRelationIcons[rel.type]} {peerRelationLabels[rel.type]}
            </span>
            {target && (
              <span className="text-xs text-paragraph/40">{target.className}</span>
            )}
          </div>
          {rel.note && (
            <p className="text-sm text-paragraph/70 mt-1.5 leading-relaxed">{rel.note}</p>
          )}
        </div>

        {/* アクション(閲覧のみなら非表示) */}
        {(onEdit || onDelete) && (
          <div className="flex gap-1 flex-shrink-0">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg hover:bg-white/60 transition-colors text-paragraph/40 hover:text-paragraph"
                title="編集"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg hover:bg-white/60 transition-colors text-paragraph/40 hover:text-alert"
                title="削除"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** 友達関係セクション */
export function ChildRelationships({ child, allChildren, onUpdate, readOnly = false }: ChildRelationshipsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const relationships = child.relationships || [];

  // 既に登録済みの園児ID（自分自身含む）
  const excludeIds = new Set([child.id, ...relationships.filter(r => r.id !== editingId).map(r => r.targetChildId)]);

  const handleAdd = (rel: ChildRelationship) => {
    onUpdate([...relationships, rel]);
    setShowForm(false);
  };

  const handleEdit = (rel: ChildRelationship) => {
    onUpdate(relationships.map(r => r.id === rel.id ? rel : r));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onUpdate(relationships.filter(r => r.id !== id));
  };

  // 関係性タイプでグループ化（ポジティブ→ネガティブ順）
  const positiveTypes: PeerRelationType[] = ['close_friend', 'play_partner', 'admires', 'caretaker'];
  const negativeTypes: PeerRelationType[] = ['uncomfortable', 'conflict'];
  const sortedRels = [
    ...relationships.filter(r => positiveTypes.includes(r.type)),
    ...relationships.filter(r => negativeTypes.includes(r.type)),
    ...relationships.filter(r => r.type === 'other'),
  ];

  return (
    <section className="bg-surface rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-headline">友達関係</h3>
        {!readOnly && !showForm && !editingId && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-button text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            追加
          </button>
        )}
      </div>

      {/* 追加フォーム */}
      {!readOnly && showForm && (
        <div className="mb-4">
          <RelationshipForm
            allChildren={allChildren}
            excludeIds={excludeIds}
            onSave={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* 関係性一覧 */}
      {sortedRels.length > 0 ? (
        <div className="space-y-3">
          {sortedRels.map(rel =>
            !readOnly && editingId === rel.id ? (
              <RelationshipForm
                key={rel.id}
                allChildren={allChildren}
                excludeIds={excludeIds}
                initial={rel}
                onSave={handleEdit}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <RelationshipCard
                key={rel.id}
                rel={rel}
                allChildren={allChildren}
                onEdit={readOnly ? undefined : () => setEditingId(rel.id)}
                onDelete={readOnly ? undefined : () => handleDelete(rel.id)}
              />
            )
          )}
        </div>
      ) : !showForm ? (
        <div className="text-center py-8">
          <p className="text-sm text-paragraph/50 mb-3">
            {readOnly ? '友達関係は登録されていませんでした' : 'まだ友達関係が登録されていません'}
          </p>
          {!readOnly && (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-button hover:underline"
            >
              友達関係を追加する
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
