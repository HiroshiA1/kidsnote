'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/components/AppLayout';
import { getDaysInMonth, isWeekend } from '@/types/staffAttendance';

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

interface NewActivityForm {
  classId: string;
  className: string;
  date: string;
  title: string;
  description: string;
  objectives: string[];
  materials: string[];
  authorId: string;
}

interface ReportForm {
  summary: string;
  achievements: string[];
  challenges: string[];
  nextSteps: string[];
}

const statusConfig: Record<ActivityStatus, { label: string; color: string; bg: string }> = {
  draft: { label: '下書き', color: 'text-paragraph', bg: 'bg-paragraph/20' },
  submitted: { label: '承認待ち', color: 'text-button', bg: 'bg-button/20' },
  approved: { label: '承認済み', color: 'text-tertiary', bg: 'bg-tertiary/20' },
  completed: { label: '完了', color: 'text-headline', bg: 'bg-secondary/30' },
};

// --- サンプルデータ ---
const sampleActivities: ClassActivity[] = [
  {
    id: '1',
    className: 'さくら組', classId: 'sakura',
    date: new Date('2025-01-15'),
    title: '冬の自然観察',
    description: '園庭で冬の植物や虫を探して観察します。霜や氷も探してみましょう。',
    objectives: ['季節の変化に気づく', '観察力を養う', '自然への興味を育む'],
    materials: ['虫眼鏡', '観察シート', 'クレヨン'],
    status: 'approved', author: '鈴木美咲', approver: '田中太郎', approvedAt: new Date('2025-01-10'),
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
    className: 'ひまわり組', classId: 'himawari',
    date: new Date('2025-01-16'),
    title: '絵本の読み聞かせと劇遊び',
    description: '「てぶくろ」の絵本を読んだ後、役を決めて簡単な劇遊びを行います。',
    objectives: ['物語の内容を理解する', '表現力を養う', '協調性を育む'],
    materials: ['絵本「てぶくろ」', '動物のお面', '手作り衣装'],
    status: 'submitted', author: '山本健太',
  },
  {
    id: '3',
    className: 'チューリップ組', classId: 'tulip',
    date: new Date('2025-01-17'),
    title: '製作活動：鬼のお面作り',
    description: '節分に向けて、紙皿を使った鬼のお面を作ります。',
    objectives: ['季節の行事を知る', '創造性を発揮する', '道具を安全に使う'],
    materials: ['紙皿', '絵の具', '毛糸', 'はさみ', 'のり'],
    status: 'draft', author: '佐藤結衣',
  },
  {
    id: '4',
    className: 'たんぽぽ組', classId: 'tanpopo',
    date: new Date('2025-01-14'),
    title: 'リズム遊び',
    description: 'タンバリンやカスタネットを使って、音楽に合わせてリズム遊びをします。',
    objectives: ['リズム感を養う', '音楽を楽しむ', '友達と一緒に活動する喜びを知る'],
    materials: ['タンバリン', 'カスタネット', '鈴', 'CDプレーヤー'],
    status: 'completed', author: '中村優子', approver: '田中太郎', approvedAt: new Date('2025-01-12'),
    report: {
      summary: '初めての楽器に興味津々で、積極的に参加できました。',
      achievements: ['全員が楽器に触れられた', '簡単なリズムパターンを真似できた'],
      challenges: ['楽器の取り合いがあった', '音量調整が難しい子がいた'],
      nextSteps: ['順番を守る練習を取り入れる', '個別に楽器体験の時間を設ける'],
      submittedAt: new Date('2025-01-14'),
    },
  },
  // --- 追加サンプル ---
  {
    id: '5',
    className: 'ひよこ組', classId: 'hiyoko',
    date: new Date('2025-01-14'),
    title: 'ふれあい遊び',
    description: '保育者と一緒に手遊び歌やスキンシップ遊びを楽しみます。',
    objectives: ['安心感の中で遊ぶ', '保育者との信頼関係を深める'],
    materials: ['手遊び歌カード', 'ぬいぐるみ'],
    status: 'approved', author: '渡辺大輔', approver: '佐藤花子', approvedAt: new Date('2025-01-10'),
  },
  {
    id: '6',
    className: 'うさぎ組', classId: 'usagi',
    date: new Date('2025-01-15'),
    title: '粘土で雪だるま作り',
    description: '白い紙粘土を使って雪だるまを製作します。',
    objectives: ['指先の器用さを養う', '季節感を味わう', '完成の喜びを感じる'],
    materials: ['紙粘土', 'ビーズ', 'モール', '台紙'],
    status: 'approved', author: '加藤裕介', approver: '田中太郎', approvedAt: new Date('2025-01-13'),
  },
  {
    id: '7',
    className: 'ゆり組', classId: 'yuri',
    date: new Date('2025-01-16'),
    title: 'お正月遊び大会',
    description: 'かるた・こま回し・けん玉など、日本の伝統的なお正月遊びを体験します。',
    objectives: ['日本の文化に触れる', 'ルールを理解して遊ぶ', '友達と競い合う楽しさを知る'],
    materials: ['かるた', 'こま', 'けん玉', '福笑い'],
    status: 'completed', author: '松本翔太', approver: '佐藤花子', approvedAt: new Date('2025-01-14'),
    report: {
      summary: 'かるた取りが特に盛り上がり、ひらがなへの関心も高まりました。',
      achievements: ['異なる遊びを自分で選べた', 'ルールを教え合う姿が見られた'],
      challenges: ['こま回しは難易度が高く、個別支援が必要だった'],
      nextSteps: ['こま回しの練習時間を設ける', '家庭でも遊べるよう案内を配布'],
      submittedAt: new Date('2025-01-16'),
    },
  },
  {
    id: '8',
    className: 'さくら組', classId: 'sakura',
    date: new Date('2025-01-20'),
    title: '絵の具遊び：デカルコマニー',
    description: '紙を半分に折って絵の具を転写し、左右対称の模様を楽しみます。',
    objectives: ['色の美しさを感じる', '偶然の模様を楽しむ', '表現の幅を広げる'],
    materials: ['画用紙', '絵の具', 'パレット', '新聞紙'],
    status: 'submitted', author: '鈴木美咲',
  },
  {
    id: '9',
    className: 'ひまわり組', classId: 'himawari',
    date: new Date('2025-01-20'),
    title: '氷作り実験',
    description: '水に色をつけて外に出し、翌日凍った氷を観察します。',
    objectives: ['科学的な好奇心を育む', '季節を活かした遊びを楽しむ'],
    materials: ['プラスチック容器', '食紅', '水', '観察シート'],
    status: 'approved', author: '山本健太', approver: '田中太郎', approvedAt: new Date('2025-01-17'),
  },
  {
    id: '10',
    className: 'チューリップ組', classId: 'tulip',
    date: new Date('2025-01-22'),
    title: '体操教室：跳び箱に挑戦',
    description: '段階的に跳び箱の高さを上げ、開脚跳びに挑戦します。',
    objectives: ['運動への意欲を高める', '体の使い方を学ぶ', '挑戦する気持ちを育てる'],
    materials: ['跳び箱', '踏切板', 'マット'],
    status: 'approved', author: '松本翔太', approver: '佐藤花子', approvedAt: new Date('2025-01-20'),
  },
  {
    id: '11',
    className: 'たんぽぽ組', classId: 'tanpopo',
    date: new Date('2025-01-21'),
    title: 'お絵かき：好きな食べ物',
    description: 'クレヨンを使って好きな食べ物の絵を描きます。',
    objectives: ['表現する楽しさを感じる', 'クレヨンの使い方に慣れる'],
    materials: ['画用紙', 'クレヨン'],
    status: 'draft', author: '高橋真理子',
  },
  {
    id: '12',
    className: 'ゆり組', classId: 'yuri',
    date: new Date('2025-01-23'),
    title: 'グループ製作：冬の壁面飾り',
    description: '4-5人グループで相談しながら冬の景色の壁面飾りを作ります。',
    objectives: ['協力して一つのものを作り上げる', '話し合いの力を育む', '季節感を表現する'],
    materials: ['模造紙', '折り紙', '綿', 'のり', 'はさみ'],
    status: 'submitted', author: '井上美穂',
  },
  {
    id: '13',
    className: 'ひよこ組', classId: 'hiyoko',
    date: new Date('2025-01-22'),
    title: 'シール貼り遊び',
    description: '大きなシールを台紙に貼って遊びます。指先の発達を促します。',
    objectives: ['指先の発達を促す', '集中力を養う'],
    materials: ['丸シール（大）', '台紙', 'クレヨン'],
    status: 'approved', author: '渡辺大輔', approver: '佐藤花子', approvedAt: new Date('2025-01-20'),
  },
  {
    id: '14',
    className: 'うさぎ組', classId: 'usagi',
    date: new Date('2025-01-23'),
    title: '新聞紙遊び',
    description: '新聞紙をちぎったり丸めたり、全身を使って遊びます。',
    objectives: ['全身運動を楽しむ', '素材の変化を楽しむ', '片付けまで意識する'],
    materials: ['新聞紙', 'ビニール袋', 'テープ'],
    status: 'draft', author: '加藤裕介',
  },
  {
    id: '15',
    className: 'さくら組', classId: 'sakura',
    date: new Date('2025-01-27'),
    title: 'カルタ大会',
    description: 'ひらがなかるたで遊びながら文字への興味を深めます。',
    objectives: ['ひらがなに親しむ', 'ルールを守って遊ぶ', '集中力を養う'],
    materials: ['ひらがなかるた'],
    status: 'draft', author: '鈴木美咲',
  },
  {
    id: '16',
    className: 'ひまわり組', classId: 'himawari',
    date: new Date('2025-01-27'),
    title: '節分の由来を学ぼう',
    description: '紙芝居を使って節分の由来を学び、豆まきの練習をします。',
    objectives: ['季節の行事に興味を持つ', 'お話を集中して聞く'],
    materials: ['紙芝居', '新聞紙（豆の代わり）', '鬼のイラスト'],
    status: 'draft', author: '山本健太',
  },
];

// --- ヘルパー関数 ---
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function getActivitiesForDate(activities: ClassActivity[], year: number, month: number, day: number): ClassActivity[] {
  return activities.filter(a => {
    return a.date.getFullYear() === year && a.date.getMonth() + 1 === month && a.date.getDate() === day;
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });
}

// --- 動的リストフィールド ---
function DynamicListField({ label, items, onChange, placeholder }: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-headline mb-2">{label}</label>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const updated = [...items];
                updated[idx] = e.target.value;
                onChange(updated);
              }}
              className="flex-1 px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
              placeholder={placeholder}
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== idx))}
                className="px-2 py-2 text-alert hover:bg-alert/10 rounded-lg text-xs"
              >
                削除
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, ''])}
          className="text-sm text-button hover:underline"
        >
          + 追加
        </button>
      </div>
    </div>
  );
}

// --- ActivityCard ---
function ActivityCard({
  activity,
  viewMode,
  onCreateReport,
}: {
  activity: ClassActivity;
  viewMode: ViewMode;
  onCreateReport?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[activity.status];

  return (
    <div className="bg-surface rounded-xl border border-secondary/20 overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-secondary/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                {status.label}
              </span>
            </div>
            <h3 className="font-bold text-headline">{activity.title}</h3>
            <p className="text-sm text-paragraph/70 mt-1 line-clamp-1">{activity.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-paragraph/60">担当: {activity.author}</p>
          </div>
          <svg
            className={`w-5 h-5 text-paragraph/40 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-secondary/20 p-4 bg-secondary/5">
          {viewMode === 'plan' ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-paragraph/60 uppercase mb-2">ねらい</h4>
                <ul className="space-y-1">
                  {activity.objectives.map((obj, i) => (
                    <li key={i} className="text-sm text-paragraph flex items-start gap-2">
                      <span className="text-tertiary mt-0.5">•</span>{obj}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-medium text-paragraph/60 uppercase mb-2">準備物</h4>
                <div className="flex flex-wrap gap-2">
                  {activity.materials.map((mat, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-surface rounded-lg border border-secondary/30">{mat}</span>
                  ))}
                </div>
              </div>
              {activity.approver && (
                <div className="pt-3 border-t border-secondary/20 text-xs text-paragraph/60">
                  承認: {activity.approver}（{activity.approvedAt && formatDate(activity.approvedAt)}）
                </div>
              )}
              {activity.status === 'approved' && !activity.report && onCreateReport && (
                <button
                  onClick={(e) => { e.stopPropagation(); onCreateReport(activity.id); }}
                  className="mt-2 px-4 py-2 bg-button text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  報告を作成
                </button>
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

// --- モーダル共通ラッパー ---
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-surface rounded-xl shadow-2xl border border-secondary/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
}

// --- 新規作成モーダル ---
function NewActivityModal({ onSave, onClose }: {
  onSave: (form: NewActivityForm) => void;
  onClose: () => void;
}) {
  const { staff, settings } = useApp();
  const CLASSES = settings.classes ?? [];
  const [form, setForm] = useState<NewActivityForm>({
    classId: '', className: '',
    date: new Date().toISOString().split('T')[0],
    title: '', description: '',
    objectives: [''], materials: [''],
    authorId: '',
  });
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Modal onClose={onClose}>
      <div className="sticky top-0 bg-surface border-b border-secondary/20 px-6 py-4 flex items-center justify-between rounded-t-xl">
        <h2 className="text-xl font-bold text-headline">新規活動計画</h2>
        <button onClick={onClose} className="text-paragraph/60 hover:text-paragraph">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-headline mb-2">クラス *</label>
            <select
              value={form.classId}
              onChange={(e) => {
                const cls = CLASSES.find(c => c.id === e.target.value);
                setForm(prev => ({ ...prev, classId: e.target.value, className: cls?.name || '' }));
              }}
              required
              className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
            >
              <option value="">選択してください</option>
              {CLASSES.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-headline mb-2">日付 *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
              required
              className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-headline mb-2">タイトル *</label>
          <input
            ref={titleRef}
            type="text"
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            required
            className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
            placeholder="活動のタイトル"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-headline mb-2">活動内容 *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            required rows={3}
            className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
            placeholder="活動の詳細な内容"
          />
        </div>
        <DynamicListField
          label="ねらい"
          items={form.objectives}
          onChange={(objectives) => setForm(prev => ({ ...prev, objectives }))}
          placeholder="ねらいを入力"
        />
        <DynamicListField
          label="準備物"
          items={form.materials}
          onChange={(materials) => setForm(prev => ({ ...prev, materials }))}
          placeholder="準備物を入力"
        />
        <div>
          <label className="block text-sm font-medium text-headline mb-2">担当者 *</label>
          <select
            value={form.authorId}
            onChange={(e) => setForm(prev => ({ ...prev, authorId: e.target.value }))}
            required
            className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
          >
            <option value="">選択してください</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.lastName}{s.firstName}（{s.role}）</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-4 border-t border-secondary/20">
          <button type="submit" className="flex-1 py-2.5 px-4 bg-button text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
            保存
          </button>
          <button type="button" onClick={onClose} className="py-2.5 px-4 bg-surface border border-secondary/30 text-paragraph rounded-lg hover:bg-secondary/20 transition-colors">
            キャンセル
          </button>
        </div>
      </form>
    </Modal>
  );
}

// --- 報告作成モーダル ---
function ReportModal({ activity, onSave, onClose }: {
  activity: ClassActivity;
  onSave: (report: ReportForm) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ReportForm>({
    summary: '',
    achievements: [''],
    challenges: [''],
    nextSteps: [''],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Modal onClose={onClose}>
      <div className="sticky top-0 bg-surface border-b border-secondary/20 px-6 py-4 flex items-center justify-between rounded-t-xl">
        <h2 className="text-xl font-bold text-headline">活動報告作成</h2>
        <button onClick={onClose} className="text-paragraph/60 hover:text-paragraph">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 計画の参照情報 */}
      <div className="px-6 py-4 bg-secondary/5 border-b border-secondary/20">
        <p className="text-xs text-paragraph/60 mb-1">参考: 計画内容</p>
        <h3 className="font-bold text-headline mb-1">{activity.title}</h3>
        <p className="text-sm text-paragraph/70 mb-2">{activity.description}</p>
        <div className="text-xs text-paragraph/60">
          ねらい: {activity.objectives.join('、')}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-paragraph/60">
          <span>{activity.className}</span>
          <span>|</span>
          <span>{formatDate(activity.date)}</span>
          <span>|</span>
          <span>担当: {activity.author}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-headline mb-2">活動報告 *</label>
          <textarea
            value={form.summary}
            onChange={(e) => setForm(prev => ({ ...prev, summary: e.target.value }))}
            required rows={4}
            className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
            placeholder="活動の様子や結果を記入"
          />
        </div>
        <DynamicListField
          label="成果・良かった点"
          items={form.achievements}
          onChange={(achievements) => setForm(prev => ({ ...prev, achievements }))}
          placeholder="良かった点を入力"
        />
        <DynamicListField
          label="課題・改善点"
          items={form.challenges}
          onChange={(challenges) => setForm(prev => ({ ...prev, challenges }))}
          placeholder="課題や改善点を入力"
        />
        <DynamicListField
          label="次回への申し送り"
          items={form.nextSteps}
          onChange={(nextSteps) => setForm(prev => ({ ...prev, nextSteps }))}
          placeholder="次回への申し送りを入力"
        />
        <div className="flex gap-3 pt-4 border-t border-secondary/20">
          <button type="submit" className="flex-1 py-2.5 px-4 bg-button text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
            報告を保存
          </button>
          <button type="button" onClick={onClose} className="py-2.5 px-4 bg-surface border border-secondary/30 text-paragraph rounded-lg hover:bg-secondary/20 transition-colors">
            キャンセル
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ========== メインページ ==========
export default function ClassActivityPage() {
  const { staff, settings } = useApp();
  const CLASSES = settings.classes ?? [];
  const now = new Date();

  const [activities, setActivities] = useState<ClassActivity[]>(sampleActivities);
  const [viewMode, setViewMode] = useState<ViewMode>('plan');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportActivityId, setReportActivityId] = useState<string | null>(null);

  // --- カレンダー計算 ---
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOffset = getFirstDayOfMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isToday = (day: number) => {
    return year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
  };

  // --- フィルタリング ---
  const filteredActivities = activities.filter(a => {
    return selectedClass === 'all' || a.className === selectedClass;
  });

  // --- 選択日の活動 ---
  const selectedDateActivities = selectedDate
    ? getActivitiesForDate(filteredActivities, year, month, selectedDate)
    : [];

  const groupedByClass = selectedDateActivities.reduce<Record<string, ClassActivity[]>>((acc, a) => {
    (acc[a.className] ||= []).push(a);
    return acc;
  }, {});

  // --- 月ナビゲーション ---
  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else { setMonth(m => m - 1); }
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else { setMonth(m => m + 1); }
    setSelectedDate(null);
  };

  // --- 統計 ---
  const stats = {
    total: activities.length,
    draft: activities.filter(a => a.status === 'draft').length,
    submitted: activities.filter(a => a.status === 'submitted').length,
    approved: activities.filter(a => a.status === 'approved').length,
    completed: activities.filter(a => a.status === 'completed').length,
  };

  // --- 新規作成ハンドラ ---
  const handleSaveNewActivity = (form: NewActivityForm) => {
    const author = staff.find(s => s.id === form.authorId);
    const newActivity: ClassActivity = {
      id: `new-${Date.now()}`,
      className: form.className,
      classId: form.classId,
      date: new Date(form.date + 'T00:00:00'),
      title: form.title,
      description: form.description,
      objectives: form.objectives.filter(o => o.trim()),
      materials: form.materials.filter(m => m.trim()),
      status: 'draft',
      author: author ? `${author.lastName}${author.firstName}` : '不明',
    };
    setActivities(prev => [...prev, newActivity]);
    setShowNewModal(false);
  };

  // --- 報告作成ハンドラ ---
  const handleSaveReport = (reportForm: ReportForm) => {
    if (!reportActivityId) return;
    setActivities(prev => prev.map(a => {
      if (a.id !== reportActivityId) return a;
      return {
        ...a,
        status: 'completed' as ActivityStatus,
        report: {
          summary: reportForm.summary,
          achievements: reportForm.achievements.filter(s => s.trim()),
          challenges: reportForm.challenges.filter(s => s.trim()),
          nextSteps: reportForm.nextSteps.filter(s => s.trim()),
          submittedAt: new Date(),
        },
      };
    }));
    setShowReportModal(false);
    setReportActivityId(null);
  };

  const openReportModal = (activityId: string) => {
    setReportActivityId(activityId);
    setShowReportModal(true);
  };

  const reportActivity = activities.find(a => a.id === reportActivityId);

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-headline">クラス活動</h1>
            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2 bg-button text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              新規作成
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* 計画/報告切り替え */}
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
              {CLASSES.map(cls => <option key={cls.id} value={cls.name}>{cls.name}</option>)}
            </select>

            <div className="h-6 w-px bg-secondary/30" />

            {/* 月ナビゲーション */}
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary/20 transition-colors">
                <svg className="w-5 h-5 text-paragraph" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-medium text-headline min-w-[100px] text-center">
                {year}年{month}月
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary/20 transition-colors">
                <svg className="w-5 h-5 text-paragraph" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-4 space-y-4">
        {/* カレンダーグリッド */}
        <div className="bg-surface rounded-xl border border-secondary/20 p-4">
          {/* クラス凡例 */}
          <div className="flex flex-wrap gap-3 mb-3">
            {CLASSES.map(cls => (
              <div key={cls.id} className="flex items-center gap-1.5 text-xs text-paragraph/70">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cls.color }} />
                {cls.name}
              </div>
            ))}
          </div>

          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['日', '月', '火', '水', '木', '金', '土'].map((day, idx) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-1.5 ${
                  idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-paragraph/60'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日付セル */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {days.map(day => {
              const dayActivities = getActivitiesForDate(filteredActivities, year, month, day);
              const isSelected = selectedDate === day;
              const isTodayDate = isToday(day);
              const weekend = isWeekend(year, month, day);
              const dow = new Date(year, month - 1, day).getDay();

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className={`aspect-square border rounded-lg p-1.5 cursor-pointer transition-all flex flex-col ${
                    isSelected
                      ? 'border-button bg-button/10 ring-2 ring-button/30'
                      : 'border-secondary/20 hover:border-button/50 hover:bg-secondary/5'
                  } ${weekend ? (dow === 0 ? 'bg-red-50/30' : 'bg-blue-50/30') : ''}`}
                >
                  <span className={`text-sm font-medium ${
                    isTodayDate
                      ? 'bg-button text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'
                      : dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-headline'
                  }`}>
                    {day}
                  </span>
                  {dayActivities.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-auto">
                      {CLASSES.filter(cls => dayActivities.some(a => a.classId === cls.id)).map(cls => (
                        <span
                          key={cls.id}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cls.color }}
                          title={cls.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 選択日の詳細パネル */}
        {selectedDate && (
          <div className="bg-surface rounded-xl border border-secondary/20 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-headline">
                {year}年{month}月{selectedDate}日の活動計画
              </h2>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-paragraph/60 hover:text-paragraph p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {Object.keys(groupedByClass).length > 0 ? (
              <div className="space-y-5">
                {Object.entries(groupedByClass).map(([className, classActivities]) => {
                  const cls = CLASSES.find(c => c.name === className);
                  return (
                    <div key={className}>
                      <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cls?.color }} />
                        <span className="text-headline">{className}</span>
                        <span className="text-paragraph/40 font-normal">({classActivities.length}件)</span>
                      </h3>
                      <div className="space-y-3">
                        {classActivities.map(activity => (
                          <ActivityCard
                            key={activity.id}
                            activity={activity}
                            viewMode={viewMode}
                            onCreateReport={openReportModal}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-paragraph/60 py-6">この日の活動予定はありません</p>
            )}
          </div>
        )}

        {/* 統計カード */}
        <div className="grid grid-cols-5 gap-2">
          <div className="bg-surface rounded-lg p-2.5 border border-secondary/20 text-center">
            <p className="text-xl font-bold text-headline">{stats.total}</p>
            <p className="text-xs text-paragraph/60">全体</p>
          </div>
          <div className="bg-paragraph/10 rounded-lg p-2.5 text-center">
            <p className="text-xl font-bold text-paragraph">{stats.draft}</p>
            <p className="text-xs text-paragraph/60">下書き</p>
          </div>
          <div className="bg-button/10 rounded-lg p-2.5 text-center">
            <p className="text-xl font-bold text-button">{stats.submitted}</p>
            <p className="text-xs text-paragraph/60">承認待ち</p>
          </div>
          <div className="bg-tertiary/20 rounded-lg p-2.5 text-center">
            <p className="text-xl font-bold text-tertiary">{stats.approved}</p>
            <p className="text-xs text-paragraph/60">承認済み</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-2.5 text-center">
            <p className="text-xl font-bold text-headline">{stats.completed}</p>
            <p className="text-xs text-paragraph/60">完了</p>
          </div>
        </div>
      </main>

      {/* 新規作成モーダル */}
      {showNewModal && (
        <NewActivityModal onSave={handleSaveNewActivity} onClose={() => setShowNewModal(false)} />
      )}

      {/* 報告作成モーダル */}
      {showReportModal && reportActivity && (
        <ReportModal activity={reportActivity} onSave={handleSaveReport} onClose={() => { setShowReportModal(false); setReportActivityId(null); }} />
      )}
    </div>
  );
}
