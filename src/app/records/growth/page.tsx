'use client';

import { useState, useRef, useCallback } from 'react';
import { GrowthData } from '@/types/intent';
import { ChildLinks } from '@/components/ChildLink';
import { formatDate, formatDateGroup, DEVELOPMENT_AREAS } from '@/lib/formatters';
import { useRecordPage } from '@/hooks/useRecordPage';
import { PendingSection, EmptyState, RecordPageHeader } from '@/components/RecordPageTemplate';

type FilterMode = 'all' | 'photo' | 'case_note';
type Visibility = 'staff_only' | 'guardians_allowed';

interface PhotoItem {
  url: string;   // DataURL (base64)
  name: string;  // オリジナルファイル名
}

interface GrowthExtra {
  photos: PhotoItem[];      // 実プレビュー画像
  visibility: Visibility;
  episodes: string[];       // エピソード記述
  caseNote?: string;        // ケースメモ（職員のみ）
  developmentArea?: string; // 発達領域
}


export default function GrowthRecordsPage() {
  const { pendingMessages, savedMessages, groupByDate, confirmMessage, editMessage, cancelMessage, markForRecord } = useRecordPage({ intentType: 'growth' });
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [extras, setExtras] = useState<Record<string, GrowthExtra>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState<GrowthExtra>({
    photos: [],
    visibility: 'staff_only',
    episodes: [],
    caseNote: '',
    developmentArea: '',
  });

  const filteredMessages = savedMessages.filter(m => {
    if (filterMode === 'all') return true;
    const extra = extras[m.id];
    if (filterMode === 'photo') return extra && extra.photos.length > 0;
    if (filterMode === 'case_note') return extra && !!extra.caseNote;
    return true;
  });

  const photoCount = savedMessages.filter(m => extras[m.id]?.photos.length).length;
  const caseNoteCount = savedMessages.filter(m => !!extras[m.id]?.caseNote).length;

  const getExtra = (id: string): GrowthExtra => extras[id] ?? {
    photos: [],
    visibility: 'staff_only',
    episodes: [],
  };


  const openEdit = (id: string) => {
    const current = getExtra(id);
    setEditForm({
      photos: [...current.photos],
      visibility: current.visibility,
      episodes: current.episodes.length > 0 ? [...current.episodes] : [''],
      caseNote: current.caseNote ?? '',
      developmentArea: current.developmentArea ?? '',
    });
    setEditingId(id);
  };

  const saveEdit = () => {
    if (!editingId) return;
    setExtras(prev => ({
      ...prev,
      [editingId]: {
        ...editForm,
        episodes: editForm.episodes.filter(e => e.trim()),
        caseNote: editForm.caseNote?.trim() || undefined,
        developmentArea: editForm.developmentArea || undefined,
      },
    }));
    setEditingId(null);
  };

  const addPhoto = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        if (!url) return;
        setEditForm(f => ({ ...f, photos: [...f.photos, { url, name: file.name }] }));
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removePhoto = (idx: number) => {
    setEditForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));
  };

  const addEpisode = () => {
    setEditForm(f => ({ ...f, episodes: [...f.episodes, ''] }));
  };

  const updateEpisode = (idx: number, value: string) => {
    setEditForm(f => ({
      ...f,
      episodes: f.episodes.map((e, i) => i === idx ? value : e),
    }));
  };

  const removeEpisode = (idx: number) => {
    setEditForm(f => ({ ...f, episodes: f.episodes.filter((_, i) => i !== idx) }));
  };

  const grouped = groupByDate(filteredMessages);

  return (
    <div className="min-h-screen">
      <RecordPageHeader
        title="成長記録"
        rightContent={<span className="text-sm text-paragraph/60">{savedMessages.length}件</span>}
      >
        <div className="flex gap-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterMode === 'all' ? 'bg-tertiary text-white' : 'bg-secondary/20 text-paragraph/70 hover:bg-secondary/30'}`}
          >
            すべて ({savedMessages.length})
          </button>
          <button
            onClick={() => setFilterMode('photo')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterMode === 'photo' ? 'bg-tertiary text-white' : 'bg-secondary/20 text-paragraph/70 hover:bg-secondary/30'}`}
          >
            写真あり ({photoCount})
          </button>
          <button
            onClick={() => setFilterMode('case_note')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterMode === 'case_note' ? 'bg-tertiary text-white' : 'bg-secondary/20 text-paragraph/70 hover:bg-secondary/30'}`}
          >
            ケースメモ ({caseNoteCount})
          </button>
        </div>
      </RecordPageHeader>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        <PendingSection
          pendingMessages={pendingMessages}
          confirmMessage={confirmMessage}
          editMessage={editMessage}
          cancelMessage={cancelMessage}
          markForRecord={markForRecord}
          skeletonColor="bg-tertiary"
        />

        {/* 保存済み（日付グループ） */}
        {Object.entries(grouped).map(([dateKey, dayMessages]) => (
          <section key={dateKey}>
            <h2 className="text-sm font-medium text-paragraph/60 mb-3">
              {formatDateGroup(dayMessages[0].timestamp)}
            </h2>
            <div className="space-y-3">
              {dayMessages.map(message => {
                const data = message.result?.data as GrowthData;
                const extra = getExtra(message.id);
                const isExpanded = expandedId === message.id;

                return (
                  <div
                    key={message.id}
                    className="bg-surface rounded-lg border-l-4 border-tertiary shadow-sm overflow-hidden"
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-tertiary/5 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : message.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-headline">
                              {message.linkedChildIds && message.linkedChildIds.length > 0
                                ? <ChildLinks childIds={message.linkedChildIds} />
                                : data.child_names.join('、')}
                            </span>
                            {/* 公開範囲バッジ */}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${extra.visibility === 'guardians_allowed'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-500'
                              }`}>
                              {extra.visibility === 'guardians_allowed' ? '保護者公開' : '職員のみ'}
                            </span>
                            {extra.developmentArea && (
                              <span className="text-xs px-2 py-0.5 bg-tertiary/20 text-tertiary rounded-full">
                                {extra.developmentArea}
                              </span>
                            )}
                            {extra.photos.length > 0 && (
                              <span className="text-xs text-paragraph/60 flex items-center gap-0.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                                </svg>
                                {extra.photos.length}
                              </span>
                            )}
                            {extra.caseNote && (
                              <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                                ケースメモ
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-paragraph mt-1">{data.summary}</p>
                          {data.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {data.tags.map((tag, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-tertiary/20 rounded-full text-tertiary">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className="text-xs text-paragraph/50 whitespace-nowrap">
                            {formatDate(message.timestamp)}
                          </span>
                          <svg className={`w-4 h-4 text-paragraph/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* 展開時の詳細 */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-secondary/10 pt-3 space-y-3">
                        {/* 写真プレビュー */}
                        {extra.photos.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-paragraph/60 mb-2">添付写真</h4>
                            <div className="flex gap-2 flex-wrap">
                              {extra.photos.map((photo, i) => (
                                <button
                                  key={i}
                                  onClick={(e) => { e.stopPropagation(); setLightboxPhoto(photo); }}
                                  className="w-20 h-20 rounded-lg overflow-hidden border border-secondary/20 hover:opacity-90 transition-opacity flex-shrink-0"
                                >
                                  <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* エピソード */}
                        {extra.episodes.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-paragraph/60 mb-2">エピソード記述</h4>
                            <div className="space-y-2">
                              {extra.episodes.map((ep, i) => (
                                <p key={i} className="text-sm text-paragraph bg-tertiary/5 rounded-lg p-3">
                                  {ep}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ケースメモ */}
                        {extra.caseNote && (
                          <div>
                            <h4 className="text-xs font-medium text-orange-600 mb-2">ケースメモ（職員のみ閲覧可）</h4>
                            <p className="text-sm text-paragraph bg-orange-50 rounded-lg p-3 border border-orange-200">
                              {extra.caseNote}
                            </p>
                          </div>
                        )}

                        {/* アクションボタン */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(message.id); }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-tertiary/10 text-tertiary hover:bg-tertiary/20 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            詳細を編集
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {filteredMessages.length === 0 && pendingMessages.length === 0 && (
          <EmptyState
            icon={
              <svg className="w-8 h-8 text-paragraph/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            }
            message={filterMode === 'photo' ? '写真付きの記録はありません' : filterMode === 'case_note' ? 'ケースメモはありません' : '成長記録がありません'}
          />
        )}
      </main>

      {/* 詳細編集モーダル */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditingId(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-surface rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-headline mb-4">成長記録の詳細編集</h3>
            <div className="space-y-5">
              {/* 公開範囲 */}
              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-2">公開範囲</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditForm(f => ({ ...f, visibility: 'staff_only' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors border ${editForm.visibility === 'staff_only'
                        ? 'border-gray-400 bg-gray-100 text-gray-700 font-medium'
                        : 'border-secondary/30 text-paragraph/60 hover:bg-secondary/10'
                      }`}
                  >
                    職員のみ
                  </button>
                  <button
                    onClick={() => setEditForm(f => ({ ...f, visibility: 'guardians_allowed' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors border ${editForm.visibility === 'guardians_allowed'
                        ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
                        : 'border-secondary/30 text-paragraph/60 hover:bg-secondary/10'
                      }`}
                  >
                    保護者にも公開
                  </button>
                </div>
              </div>

              {/* 発達領域 */}
              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-2">発達領域</label>
                <div className="flex flex-wrap gap-1.5">
                  {DEVELOPMENT_AREAS.map(area => (
                    <button
                      key={area}
                      onClick={() => setEditForm(f => ({ ...f, developmentArea: f.developmentArea === area ? '' : area }))}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${editForm.developmentArea === area
                          ? 'bg-tertiary text-white'
                          : 'bg-secondary/20 text-paragraph/60 hover:bg-secondary/30'
                        }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* 写真 */}
              <div>
                <label className="block text-sm font-medium text-paragraph/80 mb-2">
                  写真 ({editForm.photos.length})
                </label>

                {/* ドラッグ&ドロップエリア */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    addPhoto(e.dataTransfer.files);
                  }}
                  className={`mb-3 border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${isDragOver
                      ? 'border-tertiary bg-tertiary/10'
                      : 'border-secondary/40 hover:border-tertiary hover:bg-tertiary/5'
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addPhoto(e.target.files)}
                  />
                  <svg className="w-8 h-8 mx-auto mb-2 text-paragraph/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                  <p className="text-xs text-paragraph/60">
                    クリックして選択、またはドラッグ&ドロップ
                  </p>
                  <p className="text-xs text-paragraph/40 mt-1">JPG・PNG・GIF（複数選択可）</p>
                </div>

                {/* サムネイル一覧 */}
                {editForm.photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {editForm.photos.map((photo, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-secondary/20 group flex-shrink-0">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setLightboxPhoto(photo)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <button
                          onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity"
                          title={photo.name}
                        >
                          {photo.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* エピソード記述 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-paragraph/80">エピソード記述</label>
                  <button
                    onClick={addEpisode}
                    className="text-xs text-tertiary hover:text-tertiary/80 transition-colors"
                  >
                    + 追加
                  </button>
                </div>
                <div className="space-y-2">
                  {editForm.episodes.map((ep, i) => (
                    <div key={i} className="flex gap-2">
                      <textarea
                        value={ep}
                        onChange={e => updateEpisode(i, e.target.value)}
                        rows={2}
                        className="flex-1 px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/40 resize-none"
                        placeholder="子どもの姿や関わりのエピソードを記述..."
                      />
                      {editForm.episodes.length > 1 && (
                        <button
                          onClick={() => removeEpisode(i)}
                          className="text-paragraph/40 hover:text-alert transition-colors self-start mt-2"
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

              {/* ケースメモ */}
              <div>
                <label className="block text-sm font-medium text-orange-600 mb-2">
                  ケースメモ（職員のみ閲覧可）
                </label>
                <textarea
                  value={editForm.caseNote}
                  onChange={e => setEditForm(f => ({ ...f, caseNote: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none bg-orange-50/50"
                  placeholder="気になる行動、家庭環境の変化、支援の方針など..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 text-sm text-paragraph/70 hover:bg-secondary/20 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 text-sm bg-tertiary text-white rounded-lg hover:bg-tertiary/90 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ライトボックス（拡大表示）*/}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.name}
              className="max-h-[85vh] max-w-full mx-auto rounded-xl object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm px-4 py-2 rounded-b-xl text-center">
              {lightboxPhoto.name}
            </div>
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
