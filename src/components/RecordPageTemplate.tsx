'use client';

import { ReactNode } from 'react';
import { IntentCard } from './IntentCard';
import { IntentType, InputMessage } from '@/types/intent';

/** 確認待ちセクション（全recordページ共通） */
export function PendingSection({
  pendingMessages,
  confirmMessage,
  editMessage,
  cancelMessage,
  markForRecord,
  skeletonColor = 'bg-tertiary',
}: {
  pendingMessages: InputMessage[];
  confirmMessage: (id: string) => void;
  editMessage: (id: string, newIntent: IntentType) => void;
  cancelMessage: (id: string) => void;
  markForRecord: (id: string) => void;
  skeletonColor?: string;
}) {
  if (pendingMessages.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-medium text-paragraph/60 mb-3">確認待ち</h2>
      <div className="space-y-4">
        {pendingMessages.map(message => (
          <div key={message.id}>
            {message.status === 'processing' && (
              <div className="bg-surface rounded-lg p-4 shadow-sm animate-pulse">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${skeletonColor}/30 rounded-full`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-4 ${skeletonColor}/30 rounded w-3/4`} />
                    <div className={`h-3 ${skeletonColor}/20 rounded w-1/2`} />
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
  );
}

/** 空状態コンポーネント */
export function EmptyState({
  icon,
  message,
  subMessage = '下の入力欄から記録を追加してください',
}: {
  icon: ReactNode;
  message: string;
  subMessage?: string;
}) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 mx-auto mb-4 bg-secondary/20 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-lg font-medium text-headline mb-2">{message}</h2>
      <p className="text-paragraph/70">{subMessage}</p>
    </div>
  );
}

/** ページヘッダー */
export function RecordPageHeader({
  title,
  rightContent,
  children,
}: {
  title: string;
  rightContent?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-headline">{title}</h1>
          {rightContent}
        </div>
        {children}
      </div>
    </header>
  );
}
