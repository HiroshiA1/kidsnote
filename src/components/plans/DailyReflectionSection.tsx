'use client';

import { useState } from 'react';
import { ChildWithGrowth } from '@/lib/childrenStore';
import { DailyReflection, ChildDailyReflection } from '@/types/carePlan';

interface DailyReflectionSectionProps {
  classId: string;
  date: string;
  planId: string;
  authorId: string;
  children: ChildWithGrowth[];
  reflection: DailyReflection | null;
  childReflections: ChildDailyReflection[];
  onSaveReflection: (r: DailyReflection) => void;
  onSaveChildReflection: (r: ChildDailyReflection) => void;
}

export function DailyReflectionSection({
  classId,
  date,
  planId,
  authorId,
  children,
  reflection,
  childReflections,
  onSaveReflection,
  onSaveChildReflection,
}: DailyReflectionSectionProps) {
  const [overall, setOverall] = useState(reflection?.overallReflection ?? '');
  const [nextDay, setNextDay] = useState(reflection?.nextDayNotes ?? '');
  const [childNotes, setChildNotes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    childReflections.forEach(cr => { map[cr.childId] = cr.note; });
    return map;
  });
  const [expandedChild, setExpandedChild] = useState<string | null>(null);

  const handleSaveOverall = () => {
    const now = new Date();
    onSaveReflection({
      id: reflection?.id ?? `ref-${classId}-${date}`,
      planId,
      classId,
      date,
      overallReflection: overall,
      nextDayNotes: nextDay,
      authorId,
      createdAt: reflection?.createdAt ?? now,
      updatedAt: now,
    });
  };

  const handleSaveChildNote = (childId: string) => {
    const existing = childReflections.find(cr => cr.childId === childId);
    const now = new Date();
    onSaveChildReflection({
      id: existing?.id ?? `cref-${childId}-${date}`,
      planId,
      childId,
      classId,
      date,
      note: childNotes[childId] ?? '',
      authorId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  };

  const classChildren = children.filter(c => c.classId === classId);

  return (
    <div className="space-y-6">
      {/* 全体の振り返り */}
      <div className="bg-amber-50/50 rounded-xl border border-amber-200/50 p-4">
        <h4 className="text-sm font-bold text-headline mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-xs">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </span>
          全体の振り返り
        </h4>
        <textarea
          value={overall}
          onChange={e => setOverall(e.target.value)}
          onBlur={handleSaveOverall}
          placeholder="今日の保育全体を振り返って..."
          className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 min-h-[80px] resize-y"
        />
        <div className="mt-3">
          <label className="text-xs font-medium text-paragraph/60 mb-1 block">明日への申し送り</label>
          <textarea
            value={nextDay}
            onChange={e => setNextDay(e.target.value)}
            onBlur={handleSaveOverall}
            placeholder="明日の保育で配慮すること..."
            className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 min-h-[60px] resize-y"
          />
        </div>
      </div>

      {/* 園児個々の振り返り */}
      <div>
        <h4 className="text-sm font-bold text-headline mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-xs">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          園児個々の振り返り
          <span className="text-xs font-normal text-paragraph/50">({classChildren.length}名)</span>
        </h4>
        <div className="space-y-1">
          {classChildren.map(child => {
            const hasNote = !!(childNotes[child.id]?.trim());
            const isExpanded = expandedChild === child.id;
            return (
              <div key={child.id} className="border border-secondary/15 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedChild(isExpanded ? null : child.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary/5 transition-colors text-left"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${hasNote ? 'bg-green-400' : 'bg-secondary/30'}`}>
                    {(child.lastNameKanji || child.lastName).charAt(0)}
                  </div>
                  <span className="text-sm text-headline flex-1">
                    {child.lastNameKanji || child.lastName} {child.firstNameKanji || child.firstName}
                  </span>
                  {hasNote && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">記録済</span>
                  )}
                  <svg className={`w-4 h-4 text-paragraph/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1">
                    <textarea
                      value={childNotes[child.id] ?? ''}
                      onChange={e => setChildNotes(prev => ({ ...prev, [child.id]: e.target.value }))}
                      onBlur={() => handleSaveChildNote(child.id)}
                      placeholder={`${child.lastNameKanji || child.lastName}${child.firstNameKanji || child.firstName}さんの様子...`}
                      className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 min-h-[60px] resize-y"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
