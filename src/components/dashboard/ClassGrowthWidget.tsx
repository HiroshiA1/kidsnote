'use client';

import Link from 'next/link';
import { InputMessage, GrowthData } from '@/types/intent';
import { ChildWithGrowth } from '@/lib/childrenStore';
import { ClassInfo } from '@/types/settings';
import { ChildLinks } from '@/components/ChildLink';
import type { Staff } from '@/components/AppLayout';

interface ClassGrowthWidgetProps {
  records: InputMessage[];
  children: ChildWithGrowth[];
  classes: ClassInfo[];
  currentStaff: Staff | undefined;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

export function ClassGrowthWidget({ records, children, classes, currentStaff }: ClassGrowthWidgetProps) {
  const isTeacher = currentStaff?.role === '担任' || currentStaff?.role === '副担任';
  const teacherClassId = currentStaff?.classAssignment;

  // 担任の場合は自クラスのみ、それ以外は全クラス
  const targetClassIds = isTeacher && teacherClassId ? [teacherClassId] : classes.map(c => c.id);
  const targetChildIds = new Set(children.filter(c => targetClassIds.includes(c.classId)).map(c => c.id));

  const filteredRecords = records
    .filter(r => r.linkedChildIds?.some(id => targetChildIds.has(id)))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  // クラスごとにグループ化（非担任用）
  const groupByClass = !isTeacher;

  const grouped = groupByClass
    ? classes.reduce<Record<string, InputMessage[]>>((acc, cls) => {
        const classChildIds = new Set(children.filter(c => c.classId === cls.id).map(c => c.id));
        const classRecords = filteredRecords.filter(r => r.linkedChildIds?.some(id => classChildIds.has(id)));
        if (classRecords.length > 0) acc[cls.id] = classRecords;
        return acc;
      }, {})
    : {};

  return (
    <div className="bg-surface rounded-xl border border-secondary/20 overflow-hidden">
      <div className="px-4 py-3 bg-green-50/50 border-b border-green-100/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">&#127793;</span>
          <h3 className="text-sm font-bold text-headline">成長記録</h3>
          {isTeacher && teacherClassId && (
            <span className="text-xs text-paragraph/50">
              ({classes.find(c => c.id === teacherClassId)?.name})
            </span>
          )}
        </div>
        <Link href="/records/growth" className="text-xs text-button hover:text-button/80">
          すべて見る
        </Link>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-paragraph/40">
          本日の成長記録はありません
        </div>
      ) : groupByClass ? (
        <div className="divide-y divide-secondary/15">
          {Object.entries(grouped).map(([classId, classRecords]) => {
            const cls = classes.find(c => c.id === classId);
            return (
              <div key={classId}>
                <div className="px-4 py-2 bg-secondary/5 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cls?.color ?? '#888' }} />
                  <span className="text-xs font-bold text-headline/70">{cls?.name}</span>
                  <span className="text-[10px] text-paragraph/40">{classRecords.length}件</span>
                </div>
                <div className="divide-y divide-secondary/10">
                  {classRecords.slice(0, 3).map(record => (
                    <GrowthRecordItem key={record.id} record={record} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="divide-y divide-secondary/10">
          {filteredRecords.map(record => (
            <GrowthRecordItem key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}

function GrowthRecordItem({ record }: { record: InputMessage }) {
  const data = record.result?.data as GrowthData | undefined;
  return (
    <div className="px-4 py-2.5 hover:bg-secondary/5 transition-colors">
      <div className="flex items-start gap-2">
        <span className="text-xs text-paragraph/40 mt-0.5 whitespace-nowrap">
          {formatTime(record.timestamp)}
        </span>
        <div className="flex-1 min-w-0">
          {record.linkedChildIds && record.linkedChildIds.length > 0 && (
            <span className="text-xs font-medium text-headline mr-1">
              <ChildLinks childIds={record.linkedChildIds} />:
            </span>
          )}
          <span className="text-sm text-paragraph">
            {data?.summary ?? record.content}
          </span>
          {data?.tags && data.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {data.tags.map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-tertiary/20 text-paragraph/60">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
