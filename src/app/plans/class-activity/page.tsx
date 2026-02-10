'use client';

import { useState } from 'react';

type ViewMode = 'plan' | 'report';
type ActivityStatus = 'draft' | 'submitted' | 'approved' | 'completed';

interface ClassActivity {
  id: string;
  className: string;
  classId: string;
  date: Date;
  title: string;
  description: string;
  objectives: string[];
  materials: string[];
  status: ActivityStatus;
  author: string;
  approver?: string;
  approvedAt?: Date;
  report?: {
    summary: string;
    achievements: string[];
    challenges: string[];
    nextSteps: string[];
    submittedAt: Date;
  };
}

const sampleActivities: ClassActivity[] = [
  {
    id: '1',
    className: 'さくら組',
    classId: 'sakura',
    date: new Date('2025-01-15'),
    title: '冬の自然観察',
    description: '園庭で冬の植物や虫を探して観察します。霜や氷も探してみましょう。',
    objectives: ['季節の変化に気づく', '観察力を養う', '自然への興味を育む'],
    materials: ['虫眼鏡', '観察シート', 'クレヨン'],
    status: 'approved',
    author: '鈴木美咲',
    approver: '田中太郎',
    approvedAt: new Date('2025-01-10'),
    report: {
      summary: '霜柱を発見し、子どもたちは大興奮でした。触ると溶けることに気づき、科学的な関心が芽生えました。',
      achievements: ['全員が積極的に参加', '季節の変化について話し合いができた', '観察記録を絵で表現できた'],
      challenges: ['寒さで集中が途切れる子がいた', '虫が少なく、植物中心の観察になった'],
      nextSteps: ['春の観察と比較する活動を計画', '室内での振り返り時間を増やす'],
      submittedAt: new Date('2025-01-15'),
    },
  },
  {
    id: '2',
    className: 'ひまわり組',
    classId: 'himawari',
    date: new Date('2025-01-16'),
    title: '絵本の読み聞かせと劇遊び',
    description: '「てぶくろ」の絵本を読んだ後、役を決めて簡単な劇遊びを行います。',
    objectives: ['物語の内容を理解する', '表現力を養う', '協調性を育む'],
    materials: ['絵本「てぶくろ」', '動物のお面', '手作り衣装'],
    status: 'submitted',
    author: '山本健太',
  },
  {
    id: '3',
    className: 'チューリップ組',
    classId: 'tulip',
    date: new Date('2025-01-17'),
    title: '製作活動：鬼のお面作り',
    description: '節分に向けて、紙皿を使った鬼のお面を作ります。',
    objectives: ['季節の行事を知る', '創造性を発揮する', '道具を安全に使う'],
    materials: ['紙皿', '絵の具', '毛糸', 'はさみ', 'のり'],
    status: 'draft',
    author: '佐藤結衣',
  },
  {
    id: '4',
    className: 'たんぽぽ組',
    classId: 'tanpopo',
    date: new Date('2025-01-14'),
    title: 'リズム遊び',
    description: 'タンバリンやカスタネットを使って、音楽に合わせてリズム遊びをします。',
    objectives: ['リズム感を養う', '音楽を楽しむ', '友達と一緒に活動する喜びを知る'],
    materials: ['タンバリン', 'カスタネット', '鈴', 'CDプレーヤー'],
    status: 'completed',
    author: '中村優子',
    approver: '田中太郎',
    approvedAt: new Date('2025-01-12'),
    report: {
      summary: '初めての楽器に興味津々で、積極的に参加できました。',
      achievements: ['全員が楽器に触れられた', '簡単なリズムパターンを真似できた'],
      challenges: ['楽器の取り合いがあった', '音量調整が難しい子がいた'],
      nextSteps: ['順番を守る練習を取り入れる', '個別に楽器体験の時間を設ける'],
      submittedAt: new Date('2025-01-14'),
    },
  },
];

const statusConfig: Record<ActivityStatus, { label: string; color: string; bg: string }> = {
  draft: { label: '下書き', color: 'text-paragraph', bg: 'bg-paragraph/20' },
  submitted: { label: '承認待ち', color: 'text-button', bg: 'bg-button/20' },
  approved: { label: '承認済み', color: 'text-tertiary', bg: 'bg-tertiary/20' },
  completed: { label: '完了', color: 'text-headline', bg: 'bg-secondary/30' },
};

function ActivityCard({ activity, viewMode }: { activity: ClassActivity; viewMode: ViewMode }) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[activity.status];

  const formatDate = (date: Date) =>
    date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });

  return (
    <div className="bg-surface rounded-xl border border-secondary/20 overflow-hidden">
      {/* ヘッダー */}
      <div
        className="p-4 cursor-pointer hover:bg-secondary/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-button/20 rounded-full text-button font-medium">
                {activity.className}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                {status.label}
              </span>
            </div>
            <h3 className="font-bold text-headline">{activity.title}</h3>
            <p className="text-sm text-paragraph/70 mt-1 line-clamp-1">{activity.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-medium text-headline">{formatDate(activity.date)}</p>
            <p className="text-xs text-paragraph/60 mt-1">担当: {activity.author}</p>
          </div>
          <svg
            className={`w-5 h-5 text-paragraph/40 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* 詳細 */}
      {expanded && (
        <div className="border-t border-secondary/20 p-4 bg-secondary/5">
          {viewMode === 'plan' ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-paragraph/60 uppercase mb-2">ねらい</h4>
                <ul className="space-y-1">
                  {activity.objectives.map((obj, i) => (
                    <li key={i} className="text-sm text-paragraph flex items-start gap-2">
                      <span className="text-tertiary mt-0.5">•</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-medium text-paragraph/60 uppercase mb-2">準備物</h4>
                <div className="flex flex-wrap gap-2">
                  {activity.materials.map((mat, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-surface rounded-lg border border-secondary/30">
                      {mat}
                    </span>
                  ))}
                </div>
              </div>
              {activity.approver && (
                <div className="pt-3 border-t border-secondary/20 text-xs text-paragraph/60">
                  承認: {activity.approver}（{activity.approvedAt && formatDate(activity.approvedAt)}）
                </div>
              )}
            </div>
          ) : activity.report ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-paragraph/60 uppercase mb-2">活動報告</h4>
                <p className="text-sm text-paragraph">{activity.report.summary}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-tertiary uppercase mb-2">成果・良かった点</h4>
                  <ul className="space-y-1">
                    {activity.report.achievements.map((item, i) => (
                      <li key={i} className="text-sm text-paragraph flex items-start gap-2">
                        <svg className="w-4 h-4 text-tertiary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-alert uppercase mb-2">課題・改善点</h4>
                  <ul className="space-y-1">
                    {activity.report.challenges.map((item, i) => (
                      <li key={i} className="text-sm text-paragraph flex items-start gap-2">
                        <svg className="w-4 h-4 text-alert mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-button uppercase mb-2">次回への申し送り</h4>
                <ul className="space-y-1">
                  {activity.report.nextSteps.map((item, i) => (
                    <li key={i} className="text-sm text-paragraph flex items-start gap-2">
                      <svg className="w-4 h-4 text-button mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-paragraph/60 text-center py-4">報告はまだありません</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClassActivityPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('plan');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const classes = [...new Set(sampleActivities.map(a => a.className))];

  const filteredActivities = sampleActivities.filter(activity => {
    const matchesClass = selectedClass === 'all' || activity.className === selectedClass;
    const matchesStatus = selectedStatus === 'all' || activity.status === selectedStatus;
    const matchesViewMode = viewMode === 'plan' || (viewMode === 'report' && (activity.status === 'completed' || activity.report));
    return matchesClass && matchesStatus && matchesViewMode;
  });

  // 統計
  const stats = {
    total: sampleActivities.length,
    draft: sampleActivities.filter(a => a.status === 'draft').length,
    submitted: sampleActivities.filter(a => a.status === 'submitted').length,
    approved: sampleActivities.filter(a => a.status === 'approved').length,
    completed: sampleActivities.filter(a => a.status === 'completed').length,
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-headline">クラス活動</h1>
            <button className="px-4 py-2 bg-button text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              新規作成
            </button>
          </div>

          {/* 計画/報告切り替え */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex bg-secondary/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('plan')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'plan' ? 'bg-surface text-button shadow-sm' : 'text-paragraph/70 hover:text-paragraph'
                }`}
              >
                計画
              </button>
              <button
                onClick={() => setViewMode('report')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'report' ? 'bg-surface text-button shadow-sm' : 'text-paragraph/70 hover:text-paragraph'
                }`}
              >
                報告
              </button>
            </div>

            <div className="h-6 w-px bg-secondary/30" />

            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
            >
              <option value="all">全クラス</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
            >
              <option value="all">全ステータス</option>
              <option value="draft">下書き</option>
              <option value="submitted">承認待ち</option>
              <option value="approved">承認済み</option>
              <option value="completed">完了</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-surface rounded-lg p-3 border border-secondary/20 text-center">
            <p className="text-2xl font-bold text-headline">{stats.total}</p>
            <p className="text-xs text-paragraph/60">全体</p>
          </div>
          <div className="bg-paragraph/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-paragraph">{stats.draft}</p>
            <p className="text-xs text-paragraph/60">下書き</p>
          </div>
          <div className="bg-button/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-button">{stats.submitted}</p>
            <p className="text-xs text-paragraph/60">承認待ち</p>
          </div>
          <div className="bg-tertiary/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-tertiary">{stats.approved}</p>
            <p className="text-xs text-paragraph/60">承認済み</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-headline">{stats.completed}</p>
            <p className="text-xs text-paragraph/60">完了</p>
          </div>
        </div>

        {/* 活動一覧 */}
        <div className="space-y-4">
          {filteredActivities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} viewMode={viewMode} />
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-secondary/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-paragraph/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-headline mb-2">
              該当する活動がありません
            </h2>
            <p className="text-paragraph/70">
              フィルターを変更するか、新しい活動を作成してください
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
