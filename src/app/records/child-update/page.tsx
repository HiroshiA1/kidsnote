'use client';

import { ChildUpdateData } from '@/types/intent';
import { ChildLinks } from '@/components/ChildLink';
import { formatDate } from '@/lib/formatters';
import { useRecordPage } from '@/hooks/useRecordPage';
import { PendingSection, EmptyState, RecordPageHeader } from '@/components/RecordPageTemplate';

const fieldLabels: Record<string, string> = { allergy: 'アレルギー', characteristic: '特性・その他' };

export default function ChildUpdateRecordsPage() {
  const { pendingMessages, savedMessages, confirmMessage, editMessage, cancelMessage, markForRecord } = useRecordPage({ intentType: 'child_update' });

  return (
    <div className="min-h-screen">
      <RecordPageHeader
        title="園児情報更新"
        rightContent={<span className="text-sm text-paragraph/60">{savedMessages.length}件</span>}
      />

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        <PendingSection
          pendingMessages={pendingMessages}
          confirmMessage={confirmMessage}
          editMessage={editMessage}
          cancelMessage={cancelMessage}
          markForRecord={markForRecord}
          skeletonColor="bg-paragraph"
        />

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
          <EmptyState
            icon={<span className="text-3xl">👤</span>}
            message="園児情報更新がありません"
          />
        )}
      </main>
    </div>
  );
}
