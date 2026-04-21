'use client';

import Link from 'next/link';
import { InputMessage, HandoverData } from '@/types/intent';

interface HandoverWidgetProps {
  records: InputMessage[];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

export function HandoverWidget({ records }: HandoverWidgetProps) {
  const sorted = [...records]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);

  return (
    <div className="bg-surface rounded-xl border border-secondary/20 overflow-hidden h-full">
      <div className="px-4 py-3 bg-blue-50/50 border-b border-blue-100/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">&#128172;</span>
          <h3 className="text-sm font-bold text-headline">申し送り</h3>
        </div>
        <Link href="/records/handover" className="text-xs text-button hover:text-button/80">
          すべて見る
        </Link>
      </div>
      <div className="divide-y divide-secondary/10">
        {sorted.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-paragraph/40">
            本日の申し送りはありません
          </div>
        ) : (
          sorted.map(record => {
            const data = record.result?.data as HandoverData | undefined;
            return (
              <div key={record.id} className="px-4 py-2.5 hover:bg-secondary/5 transition-colors">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-paragraph/40 mt-0.5 whitespace-nowrap">
                    {formatTime(record.timestamp)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-headline truncate">
                      {data?.message ?? record.content}
                    </p>
                  </div>
                  {data?.urgent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-alert/20 text-alert font-medium shrink-0">
                      至急
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
