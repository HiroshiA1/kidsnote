'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { peerRelationLabels, peerRelationColors, peerRelationIcons } from '@/types/child';
import { useApp } from '@/components/AppLayout';
import { ChildWithGrowth } from '@/lib/childrenStore';

import ChildCreateModal from '@/components/ChildCreateModal';
import ChildCsvImportModal from '@/components/ChildCsvImportModal';
import { getAgeInFiscalYear, getGradeInFiscalYear, isEnrolledInFiscalYear } from '@/lib/fiscalYear';
import { countChildActivity } from '@/lib/childActivityCount';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GrowthCategoryId, GrowthEvaluation } from '@/types/growth';
import { growthCategories } from '@/lib/constants/growthCategories';

type ViewMode = 'list' | 'class-group';
type SortKey = 'name' | 'age' | 'class' | 'grade';
type SortOrder = 'asc' | 'desc';

/** カテゴリ別ミニレーダー（最新評価のみ表示） */
function CategoryMiniRadar({ categoryId, evaluations }: { categoryId: GrowthCategoryId; evaluations: GrowthEvaluation[] }) {
  const category = growthCategories.find(c => c.id === categoryId);
  if (!category) return null;

  // 最新の評価のみ使用
  const latest = evaluations[evaluations.length - 1];
  if (!latest) return null;

  const data = category.items.map(item => ({
    label: item.shortLabel,
    value: latest.scores.find(s => s.itemId === item.id)?.score ?? 0,
  }));

  // 全スコアが0なら表示しない
  if (data.every(d => d.value === 0)) return null;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-xs">{category.icon}</span>
        <span className="text-[11px] font-medium text-headline">{category.label}</span>
      </div>
      <div style={{ width: '100%', height: 130 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="label" tick={{ fontSize: 9, fill: '#6b7280' }} />
            <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
            <Radar dataKey="value" stroke={category.color} fill={category.color} fillOpacity={0.2} strokeWidth={1.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChildCard({ child, fiscalYear, allChildren }: { child: ChildWithGrowth; fiscalYear: number; allChildren: ChildWithGrowth[] }) {
  const age = getAgeInFiscalYear(child.birthDate, fiscalYear);
  const grade = getGradeInFiscalYear(child.birthDate, fiscalYear);
  const relationships = (child.relationships ?? []).slice(0, 4);

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
              {grade}
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

        {/* 友達関係 */}
        {relationships.length > 0 && (
          <div className="border-t border-paragraph/10 pt-3 mt-3">
            <p className="text-xs text-paragraph/60 mb-2">友達関係</p>
            <div className="flex flex-wrap gap-1.5">
              {relationships.map(rel => {
                const targetChild = allChildren.find(c => c.id === rel.targetChildId);
                const name = targetChild
                  ? `${targetChild.lastNameKanji || targetChild.lastName}`
                  : '?';
                const colors = peerRelationColors[rel.type];
                return (
                  <span
                    key={rel.id}
                    className={`text-xs px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
                  >
                    {peerRelationIcons[rel.type]} {name}({peerRelationLabels[rel.type]})
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 成長概要レーダーチャート（3カテゴリ） */}
        {(child.growthEvaluations ?? []).length > 0 && (
          <div className="border-t border-paragraph/10 pt-3 mt-3 space-y-2">
            {(['ten_figures', 'daily_life', 'non_cognitive'] as GrowthCategoryId[]).map(catId => (
              <CategoryMiniRadar key={catId} categoryId={catId} evaluations={child.growthEvaluations!} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function ChildListItem({ child, fiscalYear, onDelete }: { child: ChildWithGrowth; fiscalYear: number; onDelete: (child: ChildWithGrowth) => void }) {
  const age = getAgeInFiscalYear(child.birthDate, fiscalYear);
  const grade = getGradeInFiscalYear(child.birthDate, fiscalYear);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(child);
  };

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
              {grade}
            </span>
          </div>

          {/* クラス（タブレット以上） */}
          <div className="hidden md:block w-24 text-right">
            <span className="text-xs px-2 py-0.5 bg-secondary/30 rounded-full text-paragraph">
              {child.className}
            </span>
          </div>

          {/* 退園(アーカイブ)ボタン。物理削除ではなくソフト削除で復元可能 */}
          <button
            onClick={handleDeleteClick}
            className="w-12 h-12 flex items-center justify-center text-paragraph/40 hover:text-button hover:bg-button/10 rounded-lg transition-colors flex-shrink-0"
            title={`${child.lastName} ${child.firstName} を退園(アーカイブ)`}
            aria-label={`${child.lastName} ${child.firstName} を退園(アーカイブ)`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </button>

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
  const { children: allChildren, addChild, archiveChild, fiscalYear, openConfirm, messages, attendance } = useApp();
  // 選択年度に在園していて、かつ退園(archivedAt)されていない園児のみを対象にする
  const childrenData = useMemo(
    () => allChildren.filter((c) => !c.archivedAt && isEnrolledInFiscalYear(c.birthDate, fiscalYear)),
    [allChildren, fiscalYear],
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDelete = async (child: ChildWithGrowth) => {
    const name = `${child.lastNameKanji || child.lastName} ${child.firstNameKanji || child.firstName}`.trim();
    const { growthCount, attendanceCount } = countChildActivity(child, messages, attendance);
    // 退園(ソフト削除)。復元可能なので typed confirm は不要
    const confirmed = await openConfirm({
      title: `${name} さんを退園します`,
      message: 'アーカイブに移動され、一覧から非表示になります。関連する成長記録・出欠は保持されます。管理 > アーカイブ から復元・完全削除できます。',
      type: 'info',
      influenceScope: [
        { label: '関連する成長記録', count: growthCount },
        { label: '関連する出欠記録', count: attendanceCount, unit: '日分' },
      ],
      confirmLabel: '退園する',
    });
    if (confirmed) archiveChild(child.id);
  };
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const classes = [...new Set(childrenData.map(c => c.className))];
  const gradeOrder = ['年少', '年中', '年長'];

  const filteredAndSortedChildren = useMemo(() => {
    const result = childrenData.filter(child => {
      const matchesSearch =
        child.firstName.includes(searchQuery) ||
        child.lastName.includes(searchQuery) ||
        (child.firstNameKanji && child.firstNameKanji.includes(searchQuery)) ||
        (child.lastNameKanji && child.lastNameKanji.includes(searchQuery));
      const matchesClass = selectedClass === 'all' || child.className === selectedClass;
      const childGrade = getGradeInFiscalYear(child.birthDate, fiscalYear);
      const matchesGrade = selectedGrade === 'all' || childGrade === selectedGrade;
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
          comparison = gradeOrder.indexOf(getGradeInFiscalYear(a.birthDate, fiscalYear)) - gradeOrder.indexOf(getGradeInFiscalYear(b.birthDate, fiscalYear));
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [childrenData, searchQuery, selectedClass, selectedGrade, sortKey, sortOrder, fiscalYear]);

  // Group children by grade → class for class-group view
  const groupedByClass = useMemo(() => {
    const groups: { grade: string; classes: { className: string; children: ChildWithGrowth[] }[] }[] = [];
    const gradeMap = new Map<string, Map<string, ChildWithGrowth[]>>();

    for (const child of filteredAndSortedChildren) {
      const grade = getGradeInFiscalYear(child.birthDate, fiscalYear);
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
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-headline">園児一覧</h1>
            <p className="text-xs text-paragraph/50">{fiscalYear}年度</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-paragraph/60">{filteredAndSortedChildren.length}名</span>
            <button
              onClick={() => setShowCsvImportModal(true)}
              className="px-3 py-1.5 border border-button/30 text-button text-sm rounded-lg hover:bg-button/5"
            >
              CSVインポート
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 bg-button text-white text-sm rounded-lg hover:bg-button/90"
            >
              + 園児追加
            </button>
          </div>
        </div>
      </header>

      <ChildCreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={addChild}
      />
      <ChildCsvImportModal
        open={showCsvImportModal}
        onClose={() => setShowCsvImportModal(false)}
        onCreate={addChild}
        fiscalYear={fiscalYear}
      />

      {/* 検索・フィルター・表示切替 */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-3">
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
              title="カード表示"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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
      <main className="max-w-6xl mx-auto px-3 sm:px-6 pb-8">
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
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {cls.children.map(child => (
                          <ChildCard key={child.id} child={child} fiscalYear={fiscalYear} allChildren={allChildren} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                const gA = a[0] ? gradeWeight[getGradeInFiscalYear(a[0].birthDate, fiscalYear)] ?? 0 : 0;
                const gB = b[0] ? gradeWeight[getGradeInFiscalYear(b[0].birthDate, fiscalYear)] ?? 0 : 0;
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
                      <p className="text-xs text-paragraph/50">{kids[0] ? getGradeInFiscalYear(kids[0].birthDate, fiscalYear) : ''} / {kids.length}名</p>
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
                    <ChildListItem key={child.id} child={child} fiscalYear={fiscalYear} onDelete={handleDelete} />
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
