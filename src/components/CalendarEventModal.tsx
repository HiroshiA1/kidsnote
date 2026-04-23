'use client';

import { useState, useEffect } from 'react';
import { useApp } from './AppLayout';
import {
  CalendarEvent,
  CalendarCategoryConfig,
  DEFAULT_CALENDAR_CATEGORIES,
  getCategoryColor,
  EventStatus,
  VisibilityScope,
} from '@/types/calendar';
import { isConnected as isGoogleConnected, pushEventToGoogle, updateGoogleEvent, deleteGoogleEvent } from '@/lib/googleCalendar';

interface Props {
  open: boolean;
  onClose: () => void;
  initialDate?: string;
  initialStartTime?: string;
  event?: CalendarEvent | null;
  /** AI提案からの起動かどうか。true の場合、ヘッダ注記表示 + 保存時の intent 監査ログ用フック */
  aiSuggested?: boolean;
  /** aiSuggested=true のときの元メッセージID(AppLayout で confirmMessage に使う) */
  aiSourceMessageId?: string;
  /** AI提案が実データとして保存されたタイミングで呼ばれる。AppLayout側で message confirm 用。savedEvent が渡される */
  onAiSuggestionSaved?: (savedEvent: CalendarEvent) => void;
}

function addMinutes(hm: string, delta: number): string {
  const [h, m] = hm.split(':').map(Number);
  const total = h * 60 + m + delta;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function roundToNext30(d: Date): string {
  const m = d.getMinutes();
  const rounded = m < 30 ? 30 : 60;
  const t = new Date(d);
  t.setMinutes(rounded, 0, 0);
  if (rounded === 60) t.setHours(t.getHours());
  const h = String(t.getHours()).padStart(2, '0');
  const min = String(t.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

function emptyEvent(date: string, fiscalYear: number, startTime?: string): CalendarEvent {
  const now = new Date().toISOString();
  const defaultStart = startTime ?? roundToNext30(new Date());
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    date,
    allDay: false,
    startTime: defaultStart,
    endTime: addMinutes(defaultStart, 60),
    category: '行事',
    status: 'scheduled',
    visibilityScope: 'all_staff',
    fiscalYear,
    createdAt: now,
    updatedAt: now,
  };
}

export function CalendarEventModal({ open, onClose, initialDate, initialStartTime, event, aiSuggested = false, aiSourceMessageId, onAiSuggestionSaved }: Props) {
  const { addCalendarEvent, updateCalendarEvent, deleteCalendarEvent, fiscalYear, staff, settings, children: childrenData, currentStaffId, addToast, openConfirm } = useApp();
  const calendarCategories = settings.calendarCategories ?? DEFAULT_CALENDAR_CATEGORIES;
  const [form, setForm] = useState<CalendarEvent>(() =>
    event ?? emptyEvent(initialDate ?? new Date().toISOString().slice(0, 10), fiscalYear, initialStartTime)
  );
  const [childClassFilter, setChildClassFilter] = useState<string>('all');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(event ?? emptyEvent(initialDate ?? new Date().toISOString().slice(0, 10), fiscalYear, initialStartTime));
      setSubmitAttempted(false);
    }
  }, [open, event, initialDate, initialStartTime, fiscalYear]);

  if (!open) return null;

  // aiSuggested=true のときは、event prop が付いていても新規追加(addCalendarEvent)として扱う
  // (pending 中のドラフトID を持っているだけで store には未登録のため)
  const isEdit = !!event && !aiSuggested;
  const titleMissing = !form.title.trim();
  const showTitleError = submitAttempted && titleMissing;

  const set = <K extends keyof CalendarEvent>(key: K, value: CalendarEvent[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (titleMissing) {
      setSubmitAttempted(true);
      return;
    }
    const payload: CalendarEvent = { ...form, updatedAt: new Date().toISOString(), ownerStaffId: form.ownerStaffId ?? currentStaffId ?? undefined };
    // Google Calendar 連携（接続中のみ）
    if (isGoogleConnected()) {
      try {
        if (isEdit && payload.googleEventId) {
          await updateGoogleEvent(payload, payload.googleEventId);
        } else {
          const gid = await pushEventToGoogle(payload);
          payload.googleEventId = gid;
        }
      } catch (e) {
        addToast({ type: 'error', message: `Google同期失敗: ${(e as Error).message}` });
      }
    }
    if (isEdit) {
      updateCalendarEvent(payload);
    } else {
      if (aiSuggested) {
        // AI提案は drafted ID を新しい UUID に差し替えて登録する
        payload.id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      }
      addCalendarEvent(payload);
    }
    if (aiSuggested && onAiSuggestionSaved) {
      onAiSuggestionSaved(payload);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!event) return;
    const confirmed = await openConfirm({
      title: 'この予定を削除します',
      message: event.title ? `「${event.title}」を削除します。` : undefined,
      type: 'danger',
      confirmLabel: '削除する',
    });
    if (!confirmed) return;
    if (event.googleEventId && isGoogleConnected()) {
      try {
        await deleteGoogleEvent(event.googleEventId);
      } catch (e) {
        addToast({ type: 'error', message: `Google削除失敗: ${(e as Error).message}` });
      }
    }
    deleteCalendarEvent(event.id);
    onClose();
  };

  const classes = settings.classes ?? [];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <header className="sticky top-0 bg-surface border-b border-secondary/20 px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-headline">
              {aiSuggested ? 'AI提案の予定を確認して保存' : (isEdit ? '予定を編集' : '予定を追加')}
            </h2>
            {aiSuggested && (
              <p className="text-xs text-paragraph/60 mt-0.5">
                AIが入力内容から構造化した予定案です。内容を確認してから保存してください。
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="w-11 h-11 flex items-center justify-center rounded-lg text-paragraph/60 hover:text-paragraph hover:bg-secondary/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-6 space-y-4">
          {/* タイトル */}
          <div>
            <label className="block text-xs font-medium text-paragraph/70 mb-1">タイトル *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              onBlur={() => {
                // フォーカスアウト時にエラーを表示(保存ボタン disabled だと onClick が発火しないための補完)
                if (titleMissing) setSubmitAttempted(true);
              }}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                showTitleError
                  ? 'border-alert focus:ring-alert/40'
                  : 'border-secondary/30 focus:ring-button/30'
              }`}
              placeholder="例: 年中クラス健診"
              aria-invalid={showTitleError}
              aria-describedby={showTitleError ? 'calendar-title-error' : undefined}
            />
            {showTitleError && (
              <p id="calendar-title-error" className="text-xs text-alert mt-1">
                タイトルを入力してください
              </p>
            )}
          </div>

          {/* 日付・時刻 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-paragraph/70 mb-1">日付 *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-paragraph">
                <input type="checkbox" checked={form.allDay} onChange={e => set('allDay', e.target.checked)} />
                終日
              </label>
            </div>
          </div>

          {!form.allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-paragraph/70 mb-1">開始</label>
                <input
                  type="time"
                  value={form.startTime ?? ''}
                  onChange={e => set('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-paragraph/70 mb-1">終了</label>
                <input
                  type="time"
                  value={form.endTime ?? ''}
                  onChange={e => set('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
                />
              </div>
            </div>
          )}

          {/* カテゴリ・ステータス */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-paragraph/70 mb-1">カテゴリ</label>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(form.category, calendarCategories).dot }}
                />
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
                >
                  {calendarCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-paragraph/70 mb-1">ステータス</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value as EventStatus)}
                className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
              >
                <option value="scheduled">予定</option>
                <option value="done">完了</option>
                <option value="cancelled">中止</option>
              </select>
            </div>
          </div>

          {/* 場所 */}
          <div>
            <label className="block text-xs font-medium text-paragraph/70 mb-1">場所</label>
            <input
              type="text"
              value={form.location ?? ''}
              onChange={e => set('location', e.target.value)}
              className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
              placeholder="例: 遊戯室"
            />
          </div>

          {/* 対象範囲 */}
          <div>
            <label className="block text-xs font-medium text-paragraph/70 mb-1">対象</label>
            <select
              value={form.visibilityScope}
              onChange={e => {
                const v = e.target.value as VisibilityScope;
                setForm(prev => ({ ...prev, visibilityScope: v, targetClassIds: [], targetStaffIds: [], targetChildIds: [] }));
              }}
              className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
            >
              <option value="all_staff">全職員</option>
              <option value="class">特定クラス</option>
              <option value="staff">特定職員</option>
              <option value="children_related">特定園児</option>
            </select>
          </div>

          {form.visibilityScope === 'class' && (
            <div>
              <label className="block text-xs font-medium text-paragraph/70 mb-1">クラス選択</label>
              <div className="flex flex-wrap gap-2">
                {classes.map(cls => {
                  const checked = form.targetClassIds?.includes(cls.id) ?? false;
                  return (
                    <label key={cls.id} className={`px-3 py-1 rounded-full text-xs cursor-pointer border ${checked ? 'bg-button text-white border-button' : 'border-secondary/30 text-paragraph'}`}>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={() => {
                          const cur = form.targetClassIds ?? [];
                          set('targetClassIds', checked ? cur.filter(id => id !== cls.id) : [...cur, cls.id]);
                        }}
                      />
                      {cls.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {form.visibilityScope === 'staff' && (
            <div>
              <label className="block text-xs font-medium text-paragraph/70 mb-1">職員選択</label>
              <div className="max-h-32 overflow-y-auto border border-secondary/30 rounded-md p-2 space-y-1">
                {staff.map(s => {
                  const checked = form.targetStaffIds?.includes(s.id) ?? false;
                  return (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const cur = form.targetStaffIds ?? [];
                          set('targetStaffIds', checked ? cur.filter(id => id !== s.id) : [...cur, s.id]);
                        }}
                      />
                      {s.lastName} {s.firstName}（{s.role}）
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {form.visibilityScope === 'children_related' && (
            <div>
              <label className="block text-xs font-medium text-paragraph/70 mb-1">園児選択</label>
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={childClassFilter}
                  onChange={e => setChildClassFilter(e.target.value)}
                  className="px-3 py-1.5 border border-secondary/30 rounded-md text-sm flex-1"
                >
                  <option value="all">全クラス</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
                {childClassFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      const classKids = childrenData.filter(c => !c.archivedAt && c.classId === childClassFilter).map(c => c.id);
                      const cur = new Set(form.targetChildIds ?? []);
                      classKids.forEach(id => cur.add(id));
                      set('targetChildIds', Array.from(cur));
                    }}
                    className="px-2 py-1.5 text-xs bg-button/10 text-button rounded-md hover:bg-button/20 whitespace-nowrap"
                  >
                    このクラス全員を選択
                  </button>
                )}
              </div>
              <div className="max-h-32 overflow-y-auto border border-secondary/30 rounded-md p-2 space-y-1">
                {childrenData
                  .filter(c => !c.archivedAt) // 退園済みは行事対象から外す
                  .filter(c => childClassFilter === 'all' || c.classId === childClassFilter)
                  .map(c => {
                    const checked = form.targetChildIds?.includes(c.id) ?? false;
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const cur = form.targetChildIds ?? [];
                            set('targetChildIds', checked ? cur.filter(id => id !== c.id) : [...cur, c.id]);
                          }}
                        />
                        {c.lastNameKanji || c.lastName} {c.firstNameKanji || c.firstName}
                        <span className="text-xs text-paragraph/50">({c.className})</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 担当者 */}
          <div>
            <label className="block text-xs font-medium text-paragraph/70 mb-1">担当者</label>
            <select
              value={form.ownerStaffId ?? ''}
              onChange={e => set('ownerStaffId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
            >
              <option value="">未指定</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
            </select>
          </div>

          {/* 詳細テキスト系 */}
          <div>
            <label className="block text-xs font-medium text-paragraph/70 mb-1">詳細</label>
            <textarea
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-paragraph/70 mb-1">職員への申し送り</label>
            <textarea
              value={form.notesForStaff ?? ''}
              onChange={e => set('notesForStaff', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
              placeholder="例: 当日8時に職員室集合"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-paragraph/70 mb-1">事前準備</label>
            <textarea
              value={form.preparationNotes ?? ''}
              onChange={e => set('preparationNotes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-paragraph/70 mb-1">引き継ぎメモ</label>
            <textarea
              value={form.handoverNotes ?? ''}
              onChange={e => set('handoverNotes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-paragraph/70 mb-1">持ち物</label>
              <input
                type="text"
                value={form.bringItems ?? ''}
                onChange={e => set('bringItems', e.target.value)}
                className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-paragraph/70 mb-1">連絡先</label>
              <input
                type="text"
                value={form.contactPoints ?? ''}
                onChange={e => set('contactPoints', e.target.value)}
                className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        <footer className="sticky bottom-0 bg-surface border-t border-secondary/20 px-6 py-3 flex items-center justify-between">
          {isEdit ? (
            <button
              onClick={handleDelete}
              className="min-h-12 px-5 rounded-lg text-sm font-medium bg-alert text-white hover:bg-alert/90 transition-colors"
            >
              削除
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="min-h-11 px-4 rounded-lg text-sm text-paragraph hover:bg-secondary/20 border border-secondary/40 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={titleMissing}
              className="min-h-12 px-5 rounded-lg text-sm font-medium bg-button text-white hover:bg-button/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              保存
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
