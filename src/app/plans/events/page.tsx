'use client';

import { useState } from 'react';

type EventStatus = 'planning' | 'preparation' | 'completed' | 'reviewed';
type ViewMode = 'timeline' | 'list';

interface EventTask {
  id: string;
  title: string;
  assignee: string;
  dueDate: Date;
  completed: boolean;
  category: '準備' | '当日' | '事後';
}

interface EventHandover {
  id: string;
  category: '改善点' | '継続事項' | '注意点' | '備品';
  content: string;
  priority: 'high' | 'medium' | 'low';
}

interface Event {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  description: string;
  status: EventStatus;
  location: string;
  targetClasses: string[];
  coordinator: string;
  tasks: EventTask[];
  handovers: EventHandover[];
  report?: {
    summary: string;
    participants: number;
    highlights: string[];
    issues: string[];
    submittedAt: Date;
    submittedBy: string;
  };
}

const sampleEvents: Event[] = [
  {
    id: '1',
    title: 'クリスマス会',
    date: new Date(2024, 11, 20),
    description: '園全体で行うクリスマスイベント。各クラスの出し物とサンタクロース登場。',
    status: 'preparation',
    location: 'ホール',
    targetClasses: ['全クラス'],
    coordinator: '田中園長',
    tasks: [
      { id: 't1', title: 'サンタ衣装の準備', assignee: '佐藤先生', dueDate: new Date(2024, 11, 15), completed: true, category: '準備' },
      { id: 't2', title: 'プレゼントの手配', assignee: '鈴木先生', dueDate: new Date(2024, 11, 18), completed: true, category: '準備' },
      { id: 't3', title: 'ホールの飾り付け', assignee: 'ひまわり組担任', dueDate: new Date(2024, 11, 19), completed: false, category: '準備' },
      { id: 't4', title: '各クラス出し物リハーサル', assignee: '各担任', dueDate: new Date(2024, 11, 19), completed: false, category: '準備' },
      { id: 't5', title: '保護者への案内配布', assignee: '事務', dueDate: new Date(2024, 11, 10), completed: true, category: '準備' },
      { id: 't6', title: '写真撮影', assignee: '山田先生', dueDate: new Date(2024, 11, 20), completed: false, category: '当日' },
      { id: 't7', title: '後片付け', assignee: '全職員', dueDate: new Date(2024, 11, 20), completed: false, category: '当日' },
    ],
    handovers: [],
  },
  {
    id: '2',
    title: '秋の遠足',
    date: new Date(2024, 10, 15),
    description: '年中・年長組合同の秋の遠足。近隣の公園で自然観察。',
    status: 'reviewed',
    location: 'みどり公園',
    targetClasses: ['年中組', '年長組'],
    coordinator: '佐藤主任',
    tasks: [
      { id: 't8', title: 'バス手配', assignee: '事務', dueDate: new Date(2024, 10, 1), completed: true, category: '準備' },
      { id: 't9', title: 'お弁当の確認', assignee: '各担任', dueDate: new Date(2024, 10, 14), completed: true, category: '準備' },
      { id: 't10', title: '救急セット準備', assignee: '看護師', dueDate: new Date(2024, 10, 14), completed: true, category: '準備' },
      { id: 't11', title: '写真整理・共有', assignee: '山田先生', dueDate: new Date(2024, 10, 20), completed: true, category: '事後' },
    ],
    handovers: [
      { id: 'h1', category: '改善点', content: 'トイレ休憩のタイミングをもう少し早めに設定する', priority: 'high' },
      { id: 'h2', category: '継続事項', content: 'バディシステムが効果的だったため次回も継続', priority: 'medium' },
      { id: 'h3', category: '注意点', content: '公園の遊具は一部工事中だったので事前確認必要', priority: 'medium' },
      { id: 'h4', category: '備品', content: 'ビニールシートが足りなかったので追加購入', priority: 'low' },
    ],
    report: {
      summary: '天候に恵まれ、予定通り実施。子どもたちは自然の中で元気に活動できた。',
      participants: 45,
      highlights: ['どんぐり拾いが大盛況', '異年齢交流が活発に行われた', '保護者ボランティア3名が参加'],
      issues: ['帰りのバスで1名が車酔い', 'お弁当の時間が少し押した'],
      submittedAt: new Date(2024, 10, 16),
      submittedBy: '佐藤主任',
    },
  },
  {
    id: '3',
    title: '運動会',
    date: new Date(2024, 9, 10),
    description: '年間最大のイベント。各クラスの演技とかけっこ、親子競技を実施。',
    status: 'completed',
    location: '園庭',
    targetClasses: ['全クラス'],
    coordinator: '田中園長',
    tasks: [
      { id: 't12', title: 'プログラム作成', assignee: '佐藤主任', dueDate: new Date(2024, 8, 20), completed: true, category: '準備' },
      { id: 't13', title: '音響機器確認', assignee: '鈴木先生', dueDate: new Date(2024, 9, 5), completed: true, category: '準備' },
      { id: 't14', title: 'テント設営', assignee: '全職員', dueDate: new Date(2024, 9, 9), completed: true, category: '準備' },
      { id: 't15', title: '報告書作成', assignee: '佐藤主任', dueDate: new Date(2024, 9, 17), completed: false, category: '事後' },
    ],
    handovers: [],
  },
  {
    id: '4',
    title: '節分の会',
    date: new Date(2025, 1, 3),
    description: '豆まきと鬼の登場。季節の行事を楽しむ。',
    status: 'planning',
    location: 'ホール・各教室',
    targetClasses: ['全クラス'],
    coordinator: '高橋先生',
    tasks: [
      { id: 't16', title: '鬼の衣装準備', assignee: '未定', dueDate: new Date(2025, 0, 27), completed: false, category: '準備' },
      { id: 't17', title: '豆の手配', assignee: '事務', dueDate: new Date(2025, 0, 30), completed: false, category: '準備' },
    ],
    handovers: [],
  },
];

const statusConfig: Record<EventStatus, { label: string; color: string; bgColor: string }> = {
  planning: { label: '企画中', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  preparation: { label: '準備中', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  completed: { label: '実施済', color: 'text-green-600', bgColor: 'bg-green-100' },
  reviewed: { label: '振返り済', color: 'text-purple-600', bgColor: 'bg-purple-100' },
};

const priorityConfig: Record<string, { color: string; bgColor: string }> = {
  high: { color: 'text-alert', bgColor: 'bg-alert/10' },
  medium: { color: 'text-amber-600', bgColor: 'bg-amber-50' },
  low: { color: 'text-paragraph/60', bgColor: 'bg-secondary/20' },
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>(sampleEvents);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'handovers' | 'report'>('tasks');

  const filteredEvents = events.filter(event =>
    statusFilter === 'all' || event.status === statusFilter
  ).sort((a, b) => b.date.getTime() - a.date.getTime());

  const toggleTask = (eventId: string, taskId: string) => {
    setEvents(prev => prev.map(event => {
      if (event.id !== eventId) return event;
      return {
        ...event,
        tasks: event.tasks.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        ),
      };
    }));
  };

  const getTaskProgress = (tasks: EventTask[]) => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
  };

  const stats = {
    planning: events.filter(e => e.status === 'planning').length,
    preparation: events.filter(e => e.status === 'preparation').length,
    completed: events.filter(e => e.status === 'completed').length,
    reviewed: events.filter(e => e.status === 'reviewed').length,
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-headline">行事</h1>
        <button className="px-4 py-2 bg-button text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新規行事
        </button>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface p-4 rounded-xl border border-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-headline">{stats.planning}</p>
              <p className="text-sm text-paragraph/60">企画中</p>
            </div>
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-headline">{stats.preparation}</p>
              <p className="text-sm text-paragraph/60">準備中</p>
            </div>
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-headline">{stats.completed}</p>
              <p className="text-sm text-paragraph/60">実施済</p>
            </div>
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-headline">{stats.reviewed}</p>
              <p className="text-sm text-paragraph/60">振返り済</p>
            </div>
          </div>
        </div>
      </div>

      {/* フィルターとビュー切り替え */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EventStatus | 'all')}
            className="px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-paragraph"
          >
            <option value="all">全てのステータス</option>
            <option value="planning">企画中</option>
            <option value="preparation">準備中</option>
            <option value="completed">実施済</option>
            <option value="reviewed">振返り済</option>
          </select>
        </div>

        <div className="flex bg-secondary/30 rounded-lg p-1">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'timeline' ? 'bg-surface text-headline shadow' : 'text-paragraph/60 hover:text-paragraph'
            }`}
          >
            タイムライン
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'list' ? 'bg-surface text-headline shadow' : 'text-paragraph/60 hover:text-paragraph'
            }`}
          >
            リスト
          </button>
        </div>
      </div>

      {/* 行事一覧 */}
      <div className="space-y-4">
        {filteredEvents.map((event) => {
          const isExpanded = expandedEvent === event.id;
          const taskProgress = getTaskProgress(event.tasks);
          const config = statusConfig[event.status];

          return (
            <div
              key={event.id}
              className="bg-surface rounded-xl border border-secondary/30 overflow-hidden"
            >
              {/* ヘッダー */}
              <div
                className="p-4 cursor-pointer hover:bg-secondary/10 transition-colors"
                onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color} ${config.bgColor}`}>
                        {config.label}
                      </span>
                      <span className="text-sm text-paragraph/60">
                        {event.date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-headline mb-1">{event.title}</h3>
                    <p className="text-sm text-paragraph/80">{event.description}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-paragraph/60">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {event.coordinator}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {event.targetClasses.join(', ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {/* タスク進捗 */}
                    {event.tasks.length > 0 && (
                      <div className="text-right">
                        <div className="text-sm text-paragraph/60 mb-1">
                          タスク {event.tasks.filter(t => t.completed).length}/{event.tasks.length}
                        </div>
                        <div className="w-24 h-2 bg-secondary/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-button transition-all"
                            style={{ width: `${taskProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <svg
                      className={`w-5 h-5 text-paragraph/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 展開コンテンツ */}
              {isExpanded && (
                <div className="border-t border-secondary/30">
                  {/* タブ */}
                  <div className="flex border-b border-secondary/30">
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'tasks'
                          ? 'text-button border-b-2 border-button'
                          : 'text-paragraph/60 hover:text-paragraph'
                      }`}
                    >
                      タスク ({event.tasks.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('handovers')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'handovers'
                          ? 'text-button border-b-2 border-button'
                          : 'text-paragraph/60 hover:text-paragraph'
                      }`}
                    >
                      申し送り ({event.handovers.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('report')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'report'
                          ? 'text-button border-b-2 border-button'
                          : 'text-paragraph/60 hover:text-paragraph'
                      }`}
                    >
                      報告書
                    </button>
                  </div>

                  <div className="p-4">
                    {/* タスクタブ */}
                    {activeTab === 'tasks' && (
                      <div className="space-y-4">
                        {['準備', '当日', '事後'].map((category) => {
                          const categoryTasks = event.tasks.filter(t => t.category === category);
                          if (categoryTasks.length === 0) return null;

                          return (
                            <div key={category}>
                              <h4 className="text-sm font-medium text-paragraph/60 mb-2">{category}</h4>
                              <div className="space-y-2">
                                {categoryTasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg"
                                  >
                                    <button
                                      onClick={() => toggleTask(event.id, task.id)}
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                        task.completed
                                          ? 'bg-button border-button text-white'
                                          : 'border-secondary/50 hover:border-button'
                                      }`}
                                    >
                                      {task.completed && (
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </button>
                                    <div className="flex-1">
                                      <span className={`text-sm ${task.completed ? 'text-paragraph/50 line-through' : 'text-headline'}`}>
                                        {task.title}
                                      </span>
                                    </div>
                                    <span className="text-xs text-paragraph/60 bg-secondary/30 px-2 py-1 rounded">
                                      {task.assignee}
                                    </span>
                                    <span className="text-xs text-paragraph/60">
                                      {task.dueDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {event.tasks.length === 0 && (
                          <p className="text-center text-paragraph/50 py-4">タスクがありません</p>
                        )}
                        <button className="w-full py-2 border-2 border-dashed border-secondary/50 rounded-lg text-paragraph/60 hover:border-button hover:text-button transition-colors flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          タスクを追加
                        </button>
                      </div>
                    )}

                    {/* 申し送りタブ */}
                    {activeTab === 'handovers' && (
                      <div className="space-y-4">
                        {event.handovers.length > 0 ? (
                          <div className="grid gap-3">
                            {event.handovers.map((handover) => {
                              const pConfig = priorityConfig[handover.priority];
                              return (
                                <div
                                  key={handover.id}
                                  className={`p-3 rounded-lg border ${pConfig.bgColor} border-secondary/20`}
                                >
                                  <div className="flex items-start gap-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${pConfig.color} bg-white/50`}>
                                      {handover.category}
                                    </span>
                                    <p className="flex-1 text-sm text-paragraph">{handover.content}</p>
                                    {handover.priority === 'high' && (
                                      <svg className="w-4 h-4 text-alert flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-center text-paragraph/50 py-4">申し送り事項がありません</p>
                        )}
                        <button className="w-full py-2 border-2 border-dashed border-secondary/50 rounded-lg text-paragraph/60 hover:border-button hover:text-button transition-colors flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          申し送りを追加
                        </button>
                      </div>
                    )}

                    {/* 報告書タブ */}
                    {activeTab === 'report' && (
                      <div>
                        {event.report ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-paragraph/60">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {event.report.submittedBy}
                              </div>
                              <span className="text-sm text-paragraph/60">
                                {event.report.submittedAt.toLocaleDateString('ja-JP')} 提出
                              </span>
                            </div>

                            <div className="p-4 bg-secondary/10 rounded-lg">
                              <h4 className="text-sm font-medium text-headline mb-2">概要</h4>
                              <p className="text-sm text-paragraph">{event.report.summary}</p>
                              <div className="mt-3 flex items-center gap-2">
                                <span className="px-2 py-1 bg-button/10 text-button text-xs rounded">
                                  参加者 {event.report.participants}名
                                </span>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="p-4 bg-green-50 rounded-lg">
                                <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  良かった点
                                </h4>
                                <ul className="space-y-1">
                                  {event.report.highlights.map((h, i) => (
                                    <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                                      <span className="text-green-500 mt-1">•</span>
                                      {h}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="p-4 bg-amber-50 rounded-lg">
                                <h4 className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  課題・反省点
                                </h4>
                                <ul className="space-y-1">
                                  {event.report.issues.map((issue, i) => (
                                    <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                                      <span className="text-amber-500 mt-1">•</span>
                                      {issue}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <svg className="w-12 h-12 mx-auto text-paragraph/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-paragraph/50 mb-4">報告書がまだ作成されていません</p>
                            <button className="px-4 py-2 bg-button text-white rounded-lg hover:opacity-90 transition-opacity">
                              報告書を作成
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-paragraph/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-paragraph/60">該当する行事がありません</p>
        </div>
      )}
    </div>
  );
}
