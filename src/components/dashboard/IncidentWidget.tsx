'use client';

import Link from 'next/link';
import { InputMessage, IncidentData } from '@/types/intent';
import { ChildLinks } from '@/components/ChildLink';

interface IncidentWidgetProps {
  records: InputMessage[];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

const severityConfig = {
  high: { label: '重大', className: 'bg-alert/20 text-alert' },
  medium: { label: '中度', className: 'bg-yellow-100 text-yellow-700' },
  low: { label: '軽微', className: 'bg-paragraph/10 text-paragraph/60' },
};

export function IncidentWidget({ records }: IncidentWidgetProps) {
  const sorted = [...records]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);

  const highCount = records.filter(r => (r.result?.data as IncidentData)?.severity === 'high').length;

  return (
    <div className="bg-surface rounded-xl border border-secondary/20 overflow-hidden h-full">
      <div className={`px-4 py-3 border-b flex items-center justify-between ${
        highCount > 0 ? 'bg-alert/5 border-alert/20' : 'bg-orange-50/50 border-orange-100/50'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{highCount > 0 ? '\u26A0\uFE0F' : '\uD83D\uDCCB'}</span>
          <h3 className="text-sm font-bold text-headline">ヒヤリハット</h3>
          {records.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              highCount > 0 ? 'bg-alert/20 text-alert' : 'bg-orange-100 text-orange-600'
            }`}>
              {records.length}件
            </span>
          )}
        </div>
        <Link href="/records/incident" className="text-xs text-button hover:text-button/80">
          すべて見る
        </Link>
      </div>
      <div className="divide-y divide-secondary/10">
        {sorted.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-paragraph/40">
            本日のヒヤリハットはありません
          </div>
        ) : (
          sorted.map(record => {
            const data = record.result?.data as IncidentData | undefined;
            const severity = data?.severity ?? 'low';
            const config = severityConfig[severity];
            return (
              <div key={record.id} className="px-4 py-2.5 hover:bg-secondary/5 transition-colors">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-paragraph/40 mt-0.5 whitespace-nowrap">
                    {formatTime(record.timestamp)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-headline truncate">
                      {data?.description ?? record.content}
                    </p>
                    {record.linkedChildIds && record.linkedChildIds.length > 0 && (
                      <div className="text-xs text-paragraph/50 mt-0.5">
                        <ChildLinks childIds={record.linkedChildIds} />
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${config.className}`}>
                    {config.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
