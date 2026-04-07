'use client';

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from 'recharts';
import { GrowthCategoryId, GrowthEvaluation } from '@/types/growth';
import { getCategoryById } from '@/lib/constants/growthCategories';

interface RadarChartViewProps {
  categoryId: GrowthCategoryId;
  evaluations: GrowthEvaluation[];
  height?: number;
}

const SEMESTER_COLORS = [
  '#94a3b8', // past semesters (lighter)
  '#64748b',
  '#6366f1', // more recent
  '#8b5cf6', // most recent
];

export function RadarChartView({ categoryId, evaluations, height = 300 }: RadarChartViewProps) {
  const category = getCategoryById(categoryId);
  if (!category || evaluations.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-paragraph/50" style={{ height }}>
        評価データがありません
      </div>
    );
  }

  const data = category.items.map(item => {
    const entry: Record<string, string | number> = { item: item.shortLabel, fullName: item.label };
    evaluations.forEach((ev, idx) => {
      const score = ev.scores.find(s => s.itemId === item.id);
      entry[ev.period.label] = score?.score ?? 0;
    });
    return entry;
  });

  const colorOffset = Math.max(0, SEMESTER_COLORS.length - evaluations.length);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="item"
          tick={{ fontSize: 11, fill: '#64748b' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 5]}
          tickCount={6}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
        />
        {evaluations.map((ev, idx) => (
          <Radar
            key={ev.id}
            name={ev.period.label}
            dataKey={ev.period.label}
            stroke={SEMESTER_COLORS[colorOffset + idx] || '#6366f1'}
            fill={SEMESTER_COLORS[colorOffset + idx] || '#6366f1'}
            fillOpacity={idx === evaluations.length - 1 ? 0.2 : 0.05}
            strokeWidth={idx === evaluations.length - 1 ? 2 : 1}
          />
        ))}
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const fullName = payload[0]?.payload?.fullName || label;
            return (
              <div className="bg-surface border border-secondary/30 rounded-lg shadow-lg p-3 text-xs">
                <p className="font-medium text-headline mb-1">{fullName}</p>
                {payload.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: String(p.color ?? '#6366f1') }} />
                    <span className="text-paragraph/70">{String(p.name ?? '')}: {String(p.value ?? 0)}/5</span>
                  </div>
                ))}
              </div>
            );
          }}
        />
        {evaluations.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
      </RadarChart>
    </ResponsiveContainer>
  );
}

/** ミニレーダーチャート（園児詳細ページ用） */
export function MiniRadarChart({ categoryId, evaluations }: { categoryId: GrowthCategoryId; evaluations: GrowthEvaluation[] }) {
  const latest = evaluations.length > 0 ? [evaluations[evaluations.length - 1]] : [];
  return <RadarChartView categoryId={categoryId} evaluations={latest} height={200} />;
}
