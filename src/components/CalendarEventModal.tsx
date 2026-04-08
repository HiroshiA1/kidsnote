'use client';

import { useState, useEffect } from 'react';
import { useApp } from './AppLayout';
import {
  CalendarEvent,
  CalendarCategory,
  CALENDAR_CATEGORIES,
  EventStatus,
  VisibilityScope,
} from '@/types/calendar';

interface Props {
  open: boolean;
  onClose: () => void;
  initialDate?: string;
  event?: CalendarEvent | null;
}

function emptyEvent(date: string, fiscalYear: number): CalendarEvent {
  const now = new Date().toISOString();
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    date,
    allDay: true,
    category: '行事',
    status: 'scheduled',
    visibilityScope: 'all_staff',
    fiscalYear,
    createdAt: now,
    updatedAt: now,
  };
}

export function CalendarEventModal({ open, onClose, initialDate, event }: Props) {
  const { addCalendarEvent, updateCalendarEvent, deleteCalendarEvent, fiscalYear, staff, settings, children: childrenData, currentStaffId } = useApp();
  const [form, setForm] = useState<CalendarEvent>(() =>
    event ?? emptyEvent(initialDate ?? new Date().toISOString().slice(0, 10), fiscalYear)
  );

  useEffect(() => {
    if (open) {
      setForm(event ?? emptyEvent(initialDate ?? new Date().toISOString().slice(0, 10), fiscalYear));
    }
  }, [open, event, initialDate, fiscalYear]);

  if (!open) return null;

  const isEdit = !!event;

  const set = <K extends keyof CalendarEvent>(key: K, value: CalendarEvent[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      alert('タイトルを入力してください');
      return;
    }
    const payload = { ...form, updatedAt: new Date().toISOString(), ownerStaffId: form.ownerStaffId ?? currentStaffId ?? undefined };
    if (isEdit) {
      updateCalendarEvent(payload);
    } else {
      addCalendarEvent(payload);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!event) return;
    if (confirm('この予定を削除しますか？')) {
      deleteCalendarEvent(event.id);
      onClose();
    }
  };

  const classes = settings.classes ?? [];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <header className="sticky top-0 bg-surface border-b border-secondary/20 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-headline">{isEdit ? '予定を編集' : '予定を追加'}</h2>
          <button onClick={onClose} className="text-paragraph/60 hover:text-paragraph">✕</button>
        </header>

        <div className="p-6 space-y-4">
          {/* タイトル */}
          <div>
            <label className="block text-xs font-medium text-paragraph/70 mb-1">タイトル *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
              placeholder="例: 年中クラス健診"
            />
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
              <select
                value={form.category}
                onChange={e => set('category', e.target.value as CalendarCategory)}
                className="w-full px-3 py-2 border border-secondary/30 rounded-md text-sm"
              >
                {CALENDAR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
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
              <div className="max-h-32 overflow-y-auto border border-secondary/30 rounded-md p-2 space-y-1">
                {childrenData.map(c => {
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
            <button onClick={handleDelete} className="text-sm text-alert hover:underline">削除</button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-paragraph hover:bg-secondary/20 rounded-md">キャンセル</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-button text-white rounded-md hover:opacity-90">保存</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
