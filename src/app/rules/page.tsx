'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/components/AppLayout';
import { Rule, RuleCategory, RuleChatMessage, ruleCategoryConfig } from '@/types/rule';
import { askRulesAction } from '@/app/actions/rules-chat';
import { ChildEntry } from '@/lib/anonymize';

type Tab = 'manage' | 'chat';

const allCategories: RuleCategory[] = ['safety', 'health', 'parents', 'daily_life', 'allergy', 'emergency', 'other'];

// ルール編集モーダル
function RuleModal({
  rule,
  onSave,
  onClose,
}: {
  rule: Partial<Rule> | null;
  onSave: (rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(rule?.title || '');
  const [content, setContent] = useState(rule?.content || '');
  const [category, setCategory] = useState<RuleCategory>(rule?.category || 'other');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave({ id: rule?.id, title: title.trim(), content: content.trim(), category });
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-secondary/20">
            <h3 className="text-lg font-bold text-headline">
              {rule?.id ? 'ルールを編集' : '新しいルールを追加'}
            </h3>
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
                {allCategories.map(cat => (
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
              className="px-4 py-2 rounded-lg text-sm text-paragraph hover:bg-secondary/20 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm text-white bg-button hover:bg-button/90 transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ルール管理タブ
function RuleManageTab() {
  const { rules, addRule, updateRule, deleteRule } = useApp();
  const [editingRule, setEditingRule] = useState<Partial<Rule> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<RuleCategory | 'all'>('all');

  const filteredRules = filterCategory === 'all'
    ? rules
    : rules.filter(r => r.category === filterCategory);

  // カテゴリ別にグループ化
  const rulesByCategory = filteredRules.reduce<Record<string, Rule[]>>((acc, rule) => {
    if (!acc[rule.category]) acc[rule.category] = [];
    acc[rule.category].push(rule);
    return acc;
  }, {});

  const handleSave = (data: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    if (data.id) {
      const existing = rules.find(r => r.id === data.id);
      if (existing) {
        updateRule({ ...existing, title: data.title, content: data.content, category: data.category, updatedAt: new Date() });
      }
    } else {
      const newRule: Rule = {
        id: `rule-${Date.now()}`,
        title: data.title,
        content: data.content,
        category: data.category,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addRule(newRule);
    }
    setShowModal(false);
    setEditingRule(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('このルールを削除しますか？')) {
      deleteRule(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* ツールバー */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => { setEditingRule({}); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-button hover:bg-button/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          ルールを追加
        </button>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as RuleCategory | 'all')}
          className="px-3 py-2 rounded-lg border border-secondary/30 bg-surface text-sm text-headline focus:outline-none focus:ring-2 focus:ring-button/30"
        >
          <option value="all">すべてのカテゴリ</option>
          {allCategories.map(cat => (
            <option key={cat} value={cat}>
              {ruleCategoryConfig[cat].icon} {ruleCategoryConfig[cat].label}
            </option>
          ))}
        </select>
        <span className="text-sm text-paragraph/50 ml-auto">{filteredRules.length}件</span>
      </div>

      {/* ルール一覧 */}
      {Object.entries(rulesByCategory).map(([category, categoryRules]) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{ruleCategoryConfig[category as RuleCategory].icon}</span>
            <h3 className="text-sm font-medium text-headline">
              {ruleCategoryConfig[category as RuleCategory].label}
            </h3>
            <span className="text-xs text-paragraph/50">{categoryRules.length}件</span>
          </div>
          <div className="space-y-2">
            {categoryRules.map(rule => (
              <div
                key={rule.id}
                className="bg-surface rounded-xl border border-secondary/20 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedRuleId(expandedRuleId === rule.id ? null : rule.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/5 transition-colors"
                >
                  <span className="font-medium text-sm text-headline flex-1">{rule.title}</span>
                  <svg
                    className={`w-4 h-4 text-paragraph/40 transition-transform ${expandedRuleId === rule.id ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedRuleId === rule.id && (
                  <div className="px-4 pb-4 border-t border-secondary/10">
                    <pre className="text-sm text-paragraph whitespace-pre-wrap mt-3 leading-relaxed">
                      {rule.content}
                    </pre>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-secondary/10">
                      <button
                        onClick={() => { setEditingRule(rule); setShowModal(true); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-paragraph hover:bg-secondary/20 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-alert hover:bg-alert/10 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        削除
                      </button>
                      <span className="ml-auto text-xs text-paragraph/40">
                        更新: {rule.updatedAt.toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {filteredRules.length === 0 && (
        <div className="text-center py-12 text-paragraph/40">
          <p>ルールがありません</p>
          <p className="text-sm mt-1">「ルールを追加」から新しいルールを作成してください</p>
        </div>
      )}

      {showModal && (
        <RuleModal
          rule={editingRule}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingRule(null); }}
        />
      )}
    </div>
  );
}

// チャットタブ
function RuleChatTab() {
  const { rules, ruleChatMessages, addRuleChatMessage, clearRuleChat, children: childrenData, staff: staffData } = useApp();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ruleChatMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;

    setInput('');

    const userMessage: RuleChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    addRuleChatMessage(userMessage);

    setIsLoading(true);
    try {
      const collectChildEntries = (): ChildEntry[] =>
        childrenData.map(c => ({
          id: c.id,
          names: [
            c.firstName, c.lastName,
            c.firstNameKanji, c.lastNameKanji,
            `${c.lastName}${c.firstName}`.trim(),
            `${c.lastNameKanji ?? ''}${c.firstNameKanji ?? ''}`.trim(),
          ].filter((n): n is string => !!n && n.length >= 2),
        }));

      const collectExtraNames = (): string[] => {
        const names: string[] = [];
        for (const s of staffData) {
          if (s.firstName && s.firstName.length >= 2) names.push(s.firstName);
          if (s.lastName && s.lastName.length >= 2) names.push(s.lastName);
        }
        return [...new Set(names)];
      };

      const rulesContext = rules.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content,
        category: r.category,
      }));

      // 直近5往復の会話履歴を抽出
      const recentHistory = ruleChatMessages
        .slice(-10)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const result = await askRulesAction(
        question,
        rulesContext,
        recentHistory,
        collectChildEntries(),
        collectExtraNames()
      );

      const assistantMessage: RuleChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.answer,
        timestamp: new Date(),
        referencedRuleIds: result.referencedRuleIds,
      };
      addRuleChatMessage(assistantMessage);
    } catch {
      const errorMessage: RuleChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'エラーが発生しました。もう一度お試しください。',
        timestamp: new Date(),
      };
      addRuleChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getReferencedRuleTitles = (ruleIds?: string[]) => {
    if (!ruleIds || ruleIds.length === 0) return [];
    return ruleIds
      .map(id => rules.find(r => r.id === id))
      .filter((r): r is Rule => r !== undefined);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
      {/* チャットヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-paragraph/60">
          園のルールについて質問できます（登録済みルール: {rules.length}件）
        </p>
        {ruleChatMessages.length > 0 && (
          <button
            onClick={clearRuleChat}
            className="text-xs text-paragraph/40 hover:text-paragraph transition-colors"
          >
            チャットをクリア
          </button>
        )}
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto bg-surface rounded-xl border border-secondary/20 p-4 space-y-4">
        {ruleChatMessages.length === 0 && (
          <div className="text-center py-12 text-paragraph/30">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-sm">園のルールに関する質問を入力してください</p>
            <div className="mt-4 space-y-1">
              <p className="text-xs text-paragraph/40">例:</p>
              <p className="text-xs text-paragraph/40">「園庭遊びのルールを教えて」</p>
              <p className="text-xs text-paragraph/40">「アレルギー対応はどうすればいい？」</p>
              <p className="text-xs text-paragraph/40">「地震の時はどうする？」</p>
            </div>
          </div>
        )}

        {ruleChatMessages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.role === 'user'
                ? 'bg-button text-white'
                : 'bg-secondary/20 text-headline'
                }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.role === 'assistant' && msg.referencedRuleIds && msg.referencedRuleIds.length > 0 && (
                <div className="mt-2 pt-2 border-t border-paragraph/10">
                  <p className="text-xs text-paragraph/50 mb-1">参照ルール:</p>
                  <div className="flex flex-wrap gap-1">
                    {getReferencedRuleTitles(msg.referencedRuleIds).map(rule => (
                      <span
                        key={rule.id}
                        className="text-xs px-2 py-0.5 rounded-full bg-surface text-paragraph/70"
                      >
                        {ruleCategoryConfig[rule.category].icon} {rule.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <span className={`block text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-paragraph/30'}`}>
                {msg.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-paragraph/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-paragraph/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-paragraph/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="園のルールについて質問..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-secondary/30 bg-surface text-sm text-headline focus:outline-none focus:ring-2 focus:ring-button/30"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl text-sm text-white bg-button hover:bg-button/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  );
}

export default function RulesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('manage');

  return (
    <div className="min-h-screen">
      {/* ページヘッダー */}
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4">
          <h1 className="text-xl font-bold text-headline">園のルール</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6">
        {/* タブ切り替え */}
        <div className="flex gap-1 mb-6 bg-secondary/10 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'manage'
              ? 'bg-surface text-headline shadow-sm'
              : 'text-paragraph/60 hover:text-paragraph'
              }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              ルール管理
            </span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'chat'
              ? 'bg-surface text-headline shadow-sm'
              : 'text-paragraph/60 hover:text-paragraph'
              }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              ルールに質問
            </span>
          </button>
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'manage' ? <RuleManageTab /> : <RuleChatTab />}
      </main>
    </div>
  );
}
