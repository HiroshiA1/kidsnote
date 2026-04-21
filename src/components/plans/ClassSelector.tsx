'use client';

import { ClassInfo } from '@/types/settings';

interface ClassSelectorProps {
  classes: ClassInfo[];
  selectedClassId: string | null;
  onSelect: (classId: string) => void;
}

export function ClassSelector({ classes, selectedClassId, onSelect }: ClassSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {classes.map(cls => (
        <button
          key={cls.id}
          onClick={() => onSelect(cls.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedClassId === cls.id
              ? 'text-white shadow-md scale-105'
              : 'bg-surface border border-secondary/20 text-paragraph/70 hover:border-secondary/40'
          }`}
          style={selectedClassId === cls.id ? { backgroundColor: cls.color } : undefined}
        >
          {cls.name}
          <span className="text-xs ml-1 opacity-70">({cls.grade})</span>
        </button>
      ))}
    </div>
  );
}
