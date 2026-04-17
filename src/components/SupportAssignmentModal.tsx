'use client';

import { useState, useEffect } from 'react';
import { useApp } from './AppLayout';
import { SupportAssignment } from '@/types/calendar';

interface Props {
  open: boolean;
  onClose: () => void;
  initialDate?: string;
  assignment?: SupportAssignment | null;
}

export function SupportAssignmentModal({ open, onClose, initialDate, assignment }: Props) {
  const { staff, settings, addSupportAssignment, updateSupportAssignment, deleteSupportAssignment } = useApp();
  const classes = settings.classes ?? [];
  const isEdit = !!assignment;

  const [date, setDate] = useState(initialDate ?? new Date().toISOString().slice(0, 10));
  const [staffId, setStaffId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [taskDescription, setTaskDescription] = useState('');

  useEffect(() => {
    if (assignment) {
      setDate(assignment.date);
      setStaffId(assignment.staffId);
      setTargetClassId(assignment.targetClassId);
      setStartTime(assignment.startTime);
      setEndTime(assignment.endTime);
      setTaskDescription(assignment.taskDescription);
    } else {
      setDate(initialDate ?? new Date().toISOString().slice(0, 10));
      setStaffId(staff[0]?.id ?? '');
      setTargetClassId(classes[0]?.id ?? '');
      setStartTime('09:00');
      setEndTime('12:00');
      setTaskDescription('');
    }
  }, [assignment, initialDate, open, staff, classes]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    if (isEdit && assignment) {
      updateSupportAssignment({
        ...assignment,
        date,
        staffId,
        targetClassId,
        startTime,
        endTime,
        taskDescription,
        updatedAt: now,
      });
    } else {
      addSupportAssignment({
        id: crypto.randomUUID(),
        date,
        staffId,
        targetClassId,
        startTime,
        endTime,
        taskDescription,
        createdAt: now,
        updatedAt: now,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (assignment) {
      deleteSupportAssignment(assignment.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-secondary/20 flex items-center justify-between sticky top-0 bg-surface">
          <h2 className="text-lg font-bold text-headline">{isEdit ? '補助配置を編集' : '補助配置を追加'}</h2>
          <button onClick={onClose} className="text-paragraph/60 hover:text-paragraph text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs text-paragraph/70 mb-1">日付</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-paragraph text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-paragraph/70 mb-1">担当スタッフ</label>
            <select
              value={staffId}
              onChange={e => setStaffId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-paragraph text-sm"
            >
              <option value="">選択してください</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.lastName} {s.firstName}（{s.role}）</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-paragraph/70 mb-1">対象クラス</label>
            <select
              value={targetClassId}
              onChange={e => setTargetClassId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-paragraph text-sm"
            >
              <option value="">選択してください</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-paragraph/70 mb-1">開始時間</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-paragraph text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-paragraph/70 mb-1">終了時間</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-paragraph text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-paragraph/70 mb-1">依頼内容</label>
            <textarea
              value={taskDescription}
              onChange={e => setTaskDescription(e.target.value)}
              placeholder="補助の内容を記入..."
              rows={3}
              className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-paragraph text-sm resize-none"
            />
          </div>
          <div className="flex gap-2 pt-2">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
              >
                削除
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-secondary/30 rounded-lg text-paragraph text-sm hover:bg-secondary/10"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!staffId || !targetClassId}
              className="px-4 py-2 bg-button text-white rounded-lg text-sm hover:bg-button/90 disabled:opacity-50"
            >
              {isEdit ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
