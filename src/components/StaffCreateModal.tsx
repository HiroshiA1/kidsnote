'use client';

import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const ROLES = ['園長', '主任', '担任', '副担任', 'パート'] as const;

export default function StaffCreateModal({ open, onClose, onCreated }: Props) {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState<(typeof ROLES)[number]>('担任');
  const [classAssignment, setClassAssignment] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setLastName('');
    setFirstName('');
    setRole('担任');
    setClassAssignment('');
    setEmail('');
    setPassword('');
    setPhone('');
    setHireDate('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          role,
          classAssignment: classAssignment || undefined,
          phone: phone || undefined,
          hireDate: hireDate || undefined,
          qualifications: [],
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? '作成に失敗しました');
      }
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-secondary/20 flex items-center justify-between sticky top-0 bg-surface">
          <h2 className="text-lg font-bold text-headline">スタッフを追加</h2>
          <button onClick={onClose} className="text-paragraph/60 hover:text-paragraph">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-paragraph/70 mb-1">姓 *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-paragraph"
              />
            </div>
            <div>
              <label className="block text-xs text-paragraph/70 mb-1">名 *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-paragraph"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-paragraph/70 mb-1">役職 *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
              className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-paragraph"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-paragraph/70 mb-1">担当クラス</label>
            <input
              type="text"
              value={classAssignment}
              onChange={(e) => setClassAssignment(e.target.value)}
              placeholder="例: ばら組"
              className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-paragraph"
            />
          </div>
          <div>
            <label className="block text-xs text-paragraph/70 mb-1">メールアドレス（ログインID）*</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-paragraph"
            />
          </div>
          <div>
            <label className="block text-xs text-paragraph/70 mb-1">初期パスワード（8文字以上）*</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-paragraph font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-paragraph/70 mb-1">電話番号</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-paragraph"
            />
          </div>
          <div>
            <label className="block text-xs text-paragraph/70 mb-1">入社日</label>
            <input
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-paragraph"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-secondary/30 rounded-lg text-paragraph hover:bg-secondary/10"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-button text-white rounded-lg hover:bg-button/90 disabled:opacity-50"
            >
              {submitting ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
