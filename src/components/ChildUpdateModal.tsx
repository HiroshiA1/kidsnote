'use client';

import { useState } from 'react';
import { ChildWithGrowth } from '@/lib/childrenStore';
import { UpdateChildData } from '@/types/intent';

/**
 * AI 提案による園児情報更新の確認モーダル。
 *
 * 設計:
 * - before/after の差分表示で誤発火を視認しやすくする
 * - new_value はユーザーが編集可能 (AI 抽出のミスを修正できる)
 * - target/field は AI 確定値で固定 (こちらをユーザーが触ると整合が崩れる)
 * - 適用は親が onSubmit で受けて updateChild を呼ぶ
 */
export interface ChildUpdateModalProps {
  child: ChildWithGrowth;
  data: UpdateChildData;
  onSubmit: (newValue: string) => Promise<void> | void;
  onClose: () => void;
}

export function ChildUpdateModal({ child, data, onSubmit, onClose }: ChildUpdateModalProps) {
  const [newValue, setNewValue] = useState(data.new_value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fieldLabel =
    data.field === 'emergency_contact_phone' ? '緊急連絡先(電話)' :
    data.field === 'add_interest' ? '興味関心(追加)' : data.field;

  const oldValue =
    data.field === 'emergency_contact_phone' ? (child.emergencyContact?.phone ?? '') :
    data.field === 'add_interest' ? (child.interests?.join(', ') ?? '') : '';

  // 差分プレビュー: add_interest なら配列の追記後を、emergency_contact_phone なら置換結果を表示
  const previewAfter =
    data.field === 'emergency_contact_phone' ? newValue.trim() :
    data.field === 'add_interest'
      ? [...(child.interests ?? []), newValue.trim()].filter(Boolean).join(', ')
      : newValue;

  const validate = (): string | null => {
    const v = newValue.trim();
    if (!v) return '値を入力してください';
    if (data.field === 'emergency_contact_phone') {
      // 数字とハイフン/プラスのみ。最低 8 桁(緩め、市外局番無し短縮対応)
      if (!/^[\d\-+\s()]+$/.test(v)) return '電話番号の形式が正しくありません';
      if (v.replace(/\D/g, '').length < 8) return '電話番号は数字 8 桁以上必要です';
    }
    if (data.field === 'add_interest') {
      if (v.length > 30) return '興味は 30 文字以内で入力してください';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errMsg = validate();
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(newValue.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      // L2: 例外時も submitting フラグを必ず戻す
      setSubmitting(false);
    }
  };

  const fullName =
    `${child.lastNameKanji || child.lastName} ${child.firstNameKanji || child.firstName}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface px-6 py-4 border-b border-secondary/20 flex items-center justify-between">
          <h2 className="text-lg font-bold text-headline">園児情報の変更</h2>
          <button onClick={onClose} className="text-paragraph/60 hover:text-paragraph text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-button/5 border border-button/20 rounded-lg p-3">
            <p className="text-sm font-medium text-headline">{fullName}</p>
            <p className="text-xs text-paragraph/60">{child.className}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-paragraph/70 mb-1">変更対象</label>
            <p className="px-3 py-2 bg-secondary/10 rounded-lg text-sm text-paragraph">{fieldLabel}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-paragraph/70 mb-1">
              {data.field === 'add_interest' ? '追加する興味' : '新しい値'}
            </label>
            <input
              type={data.field === 'emergency_contact_phone' ? 'tel' : 'text'}
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              placeholder={data.field === 'emergency_contact_phone' ? '090-1234-5678' : '例: 折り紙'}
              className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
              autoFocus
            />
          </div>

          {/* before/after 差分プレビュー */}
          <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-3 space-y-2 text-xs">
            <p className="font-medium text-paragraph/80">変更内容のプレビュー</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <span className="text-paragraph/60">変更前:</span>
              <span className="text-paragraph break-all">{oldValue || '(未設定)'}</span>
              <span className="text-paragraph/60">変更後:</span>
              <span className="text-headline font-medium break-all">{previewAfter || '(未入力)'}</span>
            </div>
          </div>

          {error && (
            <div className="text-sm text-alert bg-alert/10 px-3 py-2 rounded-lg">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-button text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? '保存中...' : '保存する'}
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
