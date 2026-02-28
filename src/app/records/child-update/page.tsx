'use client';

import { useApp } from '@/components/AppLayout';
import { IntentCard } from '@/components/IntentCard';
import { ChildUpdateData } from '@/types/intent';
import { sampleRecords } from '@/lib/sampleData';
import { ChildLinks } from '@/components/ChildLink';

export default function ChildUpdateRecordsPage() {
  const { messages, confirmMessage, editMessage, cancelMessage, markForRecord } = useApp();

  const pendingMessages = messages.filter(
    m => (m.status === 'processing' || m.status === 'confirmed') && m.result?.intent === 'child_update'
  );

  const savedMessages = [
    ...messages.filter(m => m.status === 'saved' && m.result?.intent === 'child_update'),
    ...sampleRecords.filter(r => r.result?.intent === 'child_update'),
  ];

  const formatDate = (date: Date) =>
    date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const fieldLabels: Record<string, string> = { allergy: 'アレルギー', characteristic: '特性・その他' };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <h1 className="text-xl font-bold text-headline">園児情報更新</h1>
          </div>
          <span className="text-sm text-paragraph/60">{savedMessages.length}件</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* 確認待ち */}
        {pendingMessages.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-paragraph/60 mb-3">確認待ち</h2>
            <div className="space-y-4">
              {pendingMessages.map(message => (
                <div key={message.id}>
                  {message.status === 'processing' && (
                    <div className="bg-surface rounded-lg p-4 shadow-sm animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-paragraph/20 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-paragraph/20 rounded w-3/4" />
                          <div className="h-3 bg-paragraph/10 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  )}
                  {message.status === 'confirmed' && message.result && (
                    <IntentCard
                      result={message.result}
                      originalText={message.content}
                      onConfirm={() => confirmMessage(message.id)}
                      onEdit={(newIntent) => editMessage(message.id, newIntent)}
                      onCancel={() => cancelMessage(message.id)}
                      onLinkToGrowth={() => {}}
                      onMarkForRecord={() => markForRecord(message.id)}
                      isMarkedForRecord={message.isMarkedForRecord}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 保存済み */}
        <section>
          <h2 className="text-sm font-medium text-paragraph/60 mb-3">保存済み</h2>
          <div className="space-y-3">
            {savedMessages.map(message => {
              const data = message.result?.data as ChildUpdateData;
              return (
                <div
                  key={message.id}
                  className="bg-paragraph/5 border-l-4 border-paragraph/30 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-headline">
                        {message.linkedChildIds && message.linkedChildIds.length > 0
                          ? <ChildLinks childIds={message.linkedChildIds} />
                          : data.child_name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-button/20 rounded-full text-button">
                          {fieldLabels[data.field] || data.field}
                        </span>
                        <span className="text-sm text-paragraph">{data.new_value}</span>
                      </div>
                    </div>
                    <span className="text-xs text-paragraph/50 ml-2 whitespace-nowrap">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {savedMessages.length === 0 && pendingMessages.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">👤</div>
            <h2 className="text-lg font-medium text-headline mb-2">園児情報更新がありません</h2>
            <p className="text-paragraph/70">下の入力欄から記録を追加してください</p>
          </div>
        )}
      </main>
    </div>
  );
}
