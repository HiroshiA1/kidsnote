'use client';

import { useState, useRef, useEffect } from 'react';
import { ChildWithGrowth } from '@/lib/childrenStore';
import { getChildDisplayName } from '@/lib/childrenStore';

interface ChildSearchWidgetProps {
  children: ChildWithGrowth[];
  selectedChildId: string | null;
  onSelect: (childId: string | null) => void;
}

export function ChildSearchWidget({ children, selectedChildId, onSelect }: ChildSearchWidgetProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedChild = selectedChildId ? children.find(c => c.id === selectedChildId) : null;

  const filtered = query.trim()
    ? children
        .filter(c => !c.archivedAt) // 退園済みは AI選択対象から除外
        .filter(c => {
          const q = query.trim();
          return [c.firstName, c.lastName, c.firstNameKanji, c.lastNameKanji, c.className]
            .filter(Boolean)
            .some(name => name!.includes(q));
        }).slice(0, 10)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (childId: string) => {
    onSelect(childId);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery('');
  };

  if (selectedChild) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-button/10 border border-button/30 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-button/20 flex items-center justify-center text-sm font-bold text-button">
          {(selectedChild.lastNameKanji || selectedChild.lastName).charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-headline truncate">
            {getChildDisplayName(selectedChild.id, children)}
          </p>
          <p className="text-xs text-paragraph/60">{selectedChild.className}</p>
        </div>
        <button
          onClick={handleClear}
          className="w-6 h-6 rounded-full bg-paragraph/20 text-paragraph/60 hover:bg-paragraph/30 flex items-center justify-center text-xs"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-secondary/30 rounded-xl focus-within:ring-2 focus-within:ring-button/30">
        <svg className="w-4 h-4 text-paragraph/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="園児名で検索..."
          className="flex-1 bg-transparent text-sm text-paragraph placeholder:text-paragraph/40 focus:outline-none"
        />
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-surface border border-secondary/30 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filtered.map(child => (
            <button
              key={child.id}
              onClick={() => handleSelect(child.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/20 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center text-sm font-bold text-headline">
                {(child.lastNameKanji || child.lastName).charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-headline truncate">
                  {getChildDisplayName(child.id, children)}
                </p>
                <p className="text-xs text-paragraph/60">{child.className} / {child.grade}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim() && filtered.length === 0 && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-surface border border-secondary/30 rounded-xl shadow-lg p-4 text-center">
          <p className="text-sm text-paragraph/50">該当する園児が見つかりません</p>
        </div>
      )}
    </div>
  );
}
