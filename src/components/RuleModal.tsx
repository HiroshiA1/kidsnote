'use client';

import { useState } from 'react';
import { Rule, RuleCategory, ruleCategoryConfig, BASIC_RULE_CATEGORIES } from '@/types/rule';

export type RuleSavePayload = Omit<Rule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

interface RuleModalProps {
  rule: Partial<Rule> | null;
  onSave: (payload: RuleSavePayload) => void;
  onClose: () => void;
  /** AI提案ベースでモーダルを開いた場合のみ true。タイトル文言変更などに使う */
  aiSuggested?: boolean;
}

export function RuleModal({ rule, onSave, onClose, aiSuggested = false }: RuleModalProps) {
  const [title, setTitle] = useState(rule?.title || '');
  const [content, setContent] = useState(rule?.content || '');
  const [category, setCategory] = useState<RuleCategory>((rule?.category as RuleCategory) || 'other');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave({ id: rule?.id, title: title.trim(), content: content.trim(), category });
  };

  const headerLabel = rule?.id
    ? 'ルールを編集'
    : aiSuggested
    ? 'AIが提案するルールを確認して保存'
    : '新しいルールを追加';

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-secondary/20">
            <h3 className="text-lg font-bold text-headline">{headerLabel}</h3>
            {aiSuggested && (
              <p className="text-xs text-paragraph/60 mt-1">
                AIが入力内容から構造化した提案です。内容を確認してから保存してください。
              </p>
            )}
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-headline mb-1">タイトル</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-surface text-headline text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
                placeholder="ルールのタイトル"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-headline mb-1">カテゴリ</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as RuleCategory)}
                className="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-surface text-headline text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
              >
                {BASIC_RULE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {ruleCategoryConfig[cat].icon} {ruleCategoryConfig[cat].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-headline mb-1">内容</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-surface text-headline text-sm focus:outline-none focus:ring-2 focus:ring-button/30 min-h-[200px] resize-y"
                placeholder="ルールの詳細内容"
                required
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-secondary/20 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 px-4 rounded-lg text-sm text-paragraph hover:bg-secondary/20 border border-secondary/40 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="min-h-12 px-5 rounded-lg text-sm font-medium text-white bg-button hover:bg-button/90 transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
