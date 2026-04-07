'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { GrowthDomain, growthDomainLabels } from '@/types/child';
import { useApp } from '@/components/AppLayout';
import { ChildWithGrowth } from '@/lib/childrenStore';
import { calculateAge } from '@/lib/formatters';

type ViewMode = 'card' | 'list' | 'class-group';
type SortKey = 'name' | 'age' | 'class' | 'grade';
type SortOrder = 'asc' | 'desc';

function GrowthLevelBadge({ level }: { level: 1 | 2 | 3 | 4 }) {
  const colors = {
    1: 'bg-paragraph/20 text-paragraph',
    2: 'bg-secondary/50 text-headline',
    3: 'bg-tertiary text-headline',
    4: 'bg-button text-white',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[level]}`}>
      Lv.{level}
    </span>
  );
}

function ChildCard({ child }: { child: ChildWithGrowth }) {
  const age = calculateAge(child.birthDate);

  return (
    <Link href={`/children/${child.id}`}>
      <div className="bg-surface rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-secondary/20">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-2xl font-bold text-headline">
              {child.lastName} {child.firstName}
            </h3>
            {(child.lastNameKanji || child.firstNameKanji) && (
              <p className="text-xs text-paragraph/60">
                {child.lastNameKanji} {child.firstNameKanji}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs px-2 py-0.5 bg-button/20 rounded-full text-button">
              {child.grade}
            </span>
            <span className="text-xs px-2 py-0.5 bg-secondary/30 rounded-full text-paragraph">
              {child.className}
            </span>
          </div>
        </div>

        <div className="flex gap-4 text-sm text-paragraph/70 mb-3">
          <span>{age}歳</span>
          <span>{child.gender === 'male' ? '男の子' : child.gender === 'female' ? '女の子' : 'その他'}</span>
        </div>

        {child.allergies.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {child.allergies.map((allergy, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-alert/20 text-alert rounded-full">
                {allergy}
              </span>
            ))}
          </div>
        )}

        <div className="border-t border-paragraph/10 pt-3 mt-3">
          <p className="text-xs text-paragraph/60 mb-2">成長状況</p>
          <div className="flex flex-wrap gap-2">
            {child.growthLevels.map(gl => (
              <div key={gl.domain} className="flex items-center gap-1">
                <span className="text-xs text-paragraph/70">{growthDomainLabels[gl.domain]}</span>
                <GrowthLevelBadge level={gl.level} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ChildListItem({ child }: { child: ChildWithGrowth }) {
  const age = calculateAge(child.birthDate);

  return (
    <Link href={`/children/${child.id}`}>
      <div className="bg-surface rounded-lg p-3 hover:bg-secondary/10 transition-colors border-b border-secondary/10">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* アバター */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-button/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-button">
              {child.lastName.charAt(0)}
            </span>
          </div>

          {/* 名前 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <h3 className="font-bold text-headline truncate text-sm sm:text-base">
                {child.lastName} {child.firstName}
              </h3>
              {child.allergies.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 bg-alert/20 text-alert rounded hidden sm:inline">
                  アレルギー有
                </span>
              )}
            </div>
            <p className="text-xs text-paragraph/60 truncate">
              {child.lastNameKanji} {child.firstNameKanji}
              <span className="sm:hidden"> / {age}歳</span>
            </p>
          </div>

          {/* 年齢・性別（タブレット以上） */}
          <div className="text-sm text-paragraph/70 w-16 text-center hidden sm:block">
            {age}歳 {child.gender === 'male' ? '男' : child.gender === 'female' ? '女' : '他'}
          </div>

          {/* 学年（タブレット以上） */}
          <div className="hidden sm:block w-16">
            <span className="text-xs px-2 py-0.5 bg-button/20 rounded-full text-button">
              {child.grade}
            </span>
          </div>

          {/* クラス（タブレット以上） */}
          <div className="hidden md:block w-24 text-right">
            <span className="text-xs px-2 py-0.5 bg-secondary/30 rounded-full text-paragraph">
              {child.className}
            </span>
          </div>

          {/* 矢印 */}
          <svg className="w-5 h-5 text-paragraph/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default function ChildrenPage() {
  const { children: childrenData } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const classes = [...new Set(childrenData.map(c => c.className))];
  const grades = [...new Set(childrenData.map(c => c.grade))];
  const gradeOrder = ['年少', '年中', '年長'];

  const filteredAndSortedChildren = useMemo(() => {
    let result = childrenData.filter(child => {
      const matchesSearch =
        child.firstName.includes(searchQuery) ||
        child.lastName.includes(searchQuery) ||
        (child.firstNameKanji && child.firstNameKanji.includes(searchQuery)) ||
        (child.lastNameKanji && child.lastNameKanji.includes(searchQuery));
      const matchesClass = selectedClass === 'all' || child.className === selectedClass;
      const matchesGrade = selectedGrade === 'all' || child.grade === selectedGrade;
      return matchesSearch && matchesClass && matchesGrade;
    });

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'name':
          comparison = (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName);
          break;
        case 'age':
          comparison = a.birthDate.getTime() - b.birthDate.getTime();
          break;
        case 'class':
          comparison = a.className.localeCompare(b.className);
          break;
        case 'grade':
          comparison = gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [childrenData, searchQuery, selectedClass, selectedGrade, sortKey, sortOrder]);

  // Group children by grade → class for class-group view
  const groupedByClass = useMemo(() => {
    const groups: { grade: string; classes: { className: string; children: ChildWithGrowth[] }[] }[] = [];
    const gradeMap = new Map<string, Map<string, ChildWithGrowth[]>>();

    for (const child of filteredAndSortedChildren) {
      const grade = child.grade;
      if (!gradeMap.has(grade)) gradeMap.set(grade, new Map());
      const classMap = gradeMap.get(grade)!;
      if (!classMap.has(child.className)) classMap.set(child.className, []);
      classMap.get(child.className)!.push(child);
    }

    for (const grade of gradeOrder) {
      const classMap = gradeMap.get(grade);
      if (!classMap) continue;
      const classes: { className: string; children: ChildWithGrowth[] }[] = [];
      for (const [className, kids] of classMap) {
        classes.push({ className, children: kids });
      }
      groups.push({ grade, classes });
    }

    return groups;
  }, [filteredAndSortedChildren]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-headline">園児一覧</h1>
          <span className="text-sm text-paragraph/60">{filteredAndSortedChildren.length}名</span>
        </div>
      </header>

      {/* 検索・フィルター・表示切替 */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-3">
        {/* 検索 */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-paragraph/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="名前で検索..."
              className="w-full pl-10 pr-4 py-2 bg-surface border border-secondary/30 rounded-lg text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
            />
          </div>

          {/* 表示切替 */}
          <div className="flex bg-surface border border-secondary/30 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('class-group')}
              className={`px-3 py-2 transition-colors ${
                viewMode === 'class-group' ? 'bg-button text-white' : 'text-paragraph hover:bg-secondary/20'
              }`}
              title="クラス別表示"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-2 transition-colors ${
                viewMode === 'card' ? 'bg-button text-white' : 'text-paragraph hover:bg-secondary/20'
              }`}
              title="カード表示"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 transition-colors ${
                viewMode === 'list' ? 'bg-button text-white' : 'text-paragraph hover:bg-secondary/20'
              }`}
              title="リスト表示"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* フィルター・ソート */}
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          <select
            value={selectedGrade}
            onChange={e => setSelectedGrade(e.target.value)}
            className="px-3 py-1.5 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
          >
            <option value="all">全学年</option>
            {gradeOrder.map(grade => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>

          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
          >
            <option value="all">全クラス</option>
            {classes.map(cls => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          <div className="h-4 w-px bg-secondary/30" />

          <span className="text-xs text-paragraph/60">並び替え:</span>

          {[
            { key: 'name' as SortKey, label: '名前' },
            { key: 'age' as SortKey, label: '年齢' },
            { key: 'grade' as SortKey, label: '学年' },
            { key: 'class' as SortKey, label: 'クラス' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => handleSort(item.key)}
              className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                sortKey === item.key
                  ? 'bg-button/20 text-button font-medium'
                  : 'text-paragraph/70 hover:bg-secondary/20'
              }`}
            >
              {item.label}
              {sortKey === item.key && (
                <svg
                  className={`w-3 h-3 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 園児リスト */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 pb-8">
        {viewMode === 'class-group' ? (
          <div className="space-y-6">
            {groupedByClass.map(gradeGroup => (
              <div key={gradeGroup.grade}>
                <h2 className="text-lg font-bold text-headline mb-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-button/20 rounded-full text-button text-sm">
                    {gradeGroup.grade}
                  </span>
                </h2>
                <div className="space-y-4">
                  {gradeGroup.classes.map(cls => (
                    <div key={cls.className}>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-headline">{cls.className}</h3>
                        <span className="text-xs px-1.5 py-0.5 bg-secondary/30 rounded-full text-paragraph/70">
                          {cls.children.length}名
                        </span>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {cls.children.map(child => (
                          <ChildCard key={child.id} child={child} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredAndSortedChildren.map(child => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* クラス別グルーピングリスト表示 */}
            {(() => {
              // クラスごとにグループ化
              const classGroups = new Map<string, ChildWithGrowth[]>();
              for (const child of filteredAndSortedChildren) {
                const key = child.className;
                if (!classGroups.has(key)) classGroups.set(key, []);
                classGroups.get(key)!.push(child);
              }
              // 学年順にソートしてからクラス名順
              const gradeWeight: Record<string, number> = { '年少': 1, '年中': 2, '年長': 3 };
              const sortedGroups = [...classGroups.entries()].sort(([, a], [, b]) => {
                const gA = gradeWeight[a[0]?.grade] ?? 0;
                const gB = gradeWeight[b[0]?.grade] ?? 0;
                if (gA !== gB) return gA - gB;
                return a[0]?.className.localeCompare(b[0]?.className) ?? 0;
              });

              return sortedGroups.map(([className, kids]) => (
                <div key={className} className="bg-surface rounded-xl border border-secondary/20 overflow-hidden">
                  {/* クラスヘッダー */}
                  <div className="bg-button/5 border-b-2 border-button/20 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-button/15 flex items-center justify-center">
                      <svg className="w-4 h-4 text-button" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-headline">{className}</h3>
                      <p className="text-xs text-paragraph/50">{kids[0]?.grade} / {kids.length}名</p>
                    </div>
                  </div>
                  {/* リストヘッダー */}
                  <div className="bg-secondary/5 px-3 py-1.5 flex items-center gap-2 sm:gap-4 text-xs text-paragraph/50 font-medium border-b border-secondary/10">
                    <div className="w-9 sm:w-10" />
                    <div className="flex-1">名前</div>
                    <div className="w-16 text-center hidden sm:block">年齢</div>
                    <div className="w-16 hidden sm:block">学年</div>
                    <div className="w-24 text-right hidden md:block">クラス</div>
                    <div className="w-5" />
                  </div>
                  {kids.map(child => (
                    <ChildListItem key={child.id} child={child} />
                  ))}
                </div>
              ));
            })()}
          </div>
        )}

        {filteredAndSortedChildren.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-secondary/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-paragraph/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-headline mb-2">
              該当する園児がいません
            </h2>
            <p className="text-paragraph/70">
              検索条件を変更してください
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
