'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { GrowthDomain, growthDomainLabels, growthLevelLabels } from '@/types/child';
import { InputMessage, GrowthData } from '@/types/intent';

// サンプルデータ
const sampleChildName = 'やまだ たろう';

const sampleEpisodes: (InputMessage & { domain?: GrowthDomain })[] = [
  {
    id: 'ep1',
    content: '今日は初めて鉄棒で逆上がりができた',
    timestamp: new Date('2025-01-08T10:30:00'),
    status: 'saved',
    isMarkedForRecord: true,
    domain: 'health',
    result: {
      intent: 'growth',
      data: {
        child_names: ['たろう'],
        summary: '初めて鉄棒で逆上がりができた',
        tags: ['運動', '達成'],
      } as GrowthData,
    },
  },
  {
    id: 'ep2',
    content: '給食を残さず食べられるようになった',
    timestamp: new Date('2025-01-06T12:00:00'),
    status: 'saved',
    isMarkedForRecord: true,
    domain: 'health',
    result: {
      intent: 'growth',
      data: {
        child_names: ['たろう'],
        summary: '給食を残さず食べられるようになった',
        tags: ['食事', '成長'],
      } as GrowthData,
    },
  },
  {
    id: 'ep3',
    content: '友達と協力してブロックで大きな城を作った',
    timestamp: new Date('2025-01-05T14:00:00'),
    status: 'saved',
    isMarkedForRecord: true,
    domain: 'relationships',
    result: {
      intent: 'growth',
      data: {
        child_names: ['たろう', 'けんた'],
        summary: '友達と協力してブロックで大きな城を作った',
        tags: ['協調性', '創作'],
      } as GrowthData,
    },
  },
  {
    id: 'ep4',
    content: '絵本の内容を自分の言葉で説明できた',
    timestamp: new Date('2025-01-10T11:00:00'),
    status: 'saved',
    isMarkedForRecord: true,
    domain: 'language',
    result: {
      intent: 'growth',
      data: {
        child_names: ['たろう'],
        summary: '絵本の内容を自分の言葉で説明できた',
        tags: ['言語', '理解力'],
      } as GrowthData,
    },
  },
];

// AIが生成する要録文章（サンプル）
const sampleGeneratedTexts: Record<GrowthDomain, string> = {
  health:
    '健康な心と体を育て、自ら健康で安全な生活をつくり出す力を養う観点から、本児は運動能力の向上が著しく、特に鉄棒での逆上がりを習得するなど、挑戦する意欲と粘り強さが見られた。また、食事面でも給食を残さず食べられるようになり、食への関心と健康的な生活習慣が身についてきている。',
  relationships:
    '他の幼児と親しみ、支え合って生活するために、自立心を育て、人と関わる力を養う観点から、本児は友達との協同的な遊びを通じて、相手の意見を聞きながら自分の考えも伝えられるようになった。ブロック遊びでは友達と役割を分担しながら大きな作品を完成させるなど、協調性の成長が見られる。',
  environment:
    '周囲の様々な環境に好奇心や探究心をもって関わり、それらを生活に取り入れていこうとする力を養う観点から、本児は身近な自然や物事への関心を深め、観察したことを言葉で表現できるようになってきている。',
  language:
    '経験したことや考えたことなどを自分なりの言葉で表現し、相手の話す言葉を聞こうとする意欲や態度を育て、言葉に対する感覚や言葉で表現する力を養う観点から、本児は絵本の内容を自分の言葉で説明できるようになるなど、語彙力と表現力が豊かになってきている。',
  expression:
    '感じたことや考えたことを自分なりに表現することを通して、豊かな感性や表現する力を養い、創造性を豊かにする観点から、本児は様々な素材を使った製作活動に意欲的に取り組み、自分なりの工夫を加えて表現することができるようになってきている。',
};

function DomainSection({
  domain,
  episodes,
  generatedText,
  onRegenerate,
  onEdit,
  isGenerating,
}: {
  domain: GrowthDomain;
  episodes: typeof sampleEpisodes;
  generatedText: string;
  onRegenerate: () => void;
  onEdit: (text: string) => void;
  isGenerating: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(generatedText);
  const domainEpisodes = episodes.filter(ep => ep.domain === domain);

  const handleSave = () => {
    onEdit(editText);
    setIsEditing(false);
  };

  return (
    <div className="border border-secondary/30 rounded-xl overflow-hidden">
      <div className="bg-secondary/20 px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold text-headline">{growthDomainLabels[domain]}</h3>
        <span className="text-xs text-paragraph/60">
          根拠エピソード: {domainEpisodes.length}件
        </span>
      </div>

      {/* 根拠エピソード */}
      {domainEpisodes.length > 0 && (
        <div className="px-4 py-3 bg-surface/50 border-b border-secondary/20">
          <p className="text-xs text-paragraph/60 mb-2">根拠となるエピソード:</p>
          <ul className="space-y-1">
            {domainEpisodes.map(ep => (
              <li key={ep.id} className="text-sm text-paragraph flex items-start gap-2">
                <span className="text-tertiary">•</span>
                <span>{(ep.result?.data as GrowthData)?.summary || ep.content}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 生成された文章 */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="w-full h-40 p-3 border border-secondary/30 rounded-lg text-sm text-paragraph bg-surface focus:outline-none focus:ring-2 focus:ring-button/30"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-button text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setEditText(generatedText);
                  setIsEditing(false);
                }}
                className="px-4 py-2 bg-secondary/30 text-paragraph rounded-lg text-sm hover:bg-secondary/50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-paragraph leading-relaxed whitespace-pre-wrap">
              {isGenerating ? (
                <span className="text-paragraph/50 animate-pulse">
                  AIが文章を生成中...
                </span>
              ) : (
                generatedText
              )}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setIsEditing(true)}
                disabled={isGenerating}
                className="px-3 py-1 text-xs bg-surface border border-secondary/30 text-paragraph rounded-lg hover:bg-secondary/20 transition-colors disabled:opacity-50"
              >
                編集
              </button>
              <button
                onClick={onRegenerate}
                disabled={isGenerating}
                className="px-3 py-1 text-xs bg-surface border border-secondary/30 text-paragraph rounded-lg hover:bg-secondary/20 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                再生成
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecordPage() {
  const params = useParams();
  const [generatedTexts, setGeneratedTexts] = useState(sampleGeneratedTexts);
  const [isGenerating, setIsGenerating] = useState<GrowthDomain | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('2024-2025');

  const handleRegenerate = async (domain: GrowthDomain) => {
    setIsGenerating(domain);
    // 実際にはここでGemini APIを呼び出す
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsGenerating(null);
  };

  const handleEdit = (domain: GrowthDomain, text: string) => {
    setGeneratedTexts(prev => ({ ...prev, [domain]: text }));
  };

  const handleExport = () => {
    // 実際にはPDFやWord形式でエクスポート
    alert('要録をエクスポートしました（実装予定）');
  };

  const domains: GrowthDomain[] = ['health', 'relationships', 'environment', 'language', 'expression'];

  return (
    <div className="min-h-screen pb-8">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/children/${params.id}`}
              className="text-paragraph/60 hover:text-paragraph transition-colors text-sm"
            >
              ← 園児詳細に戻る
            </Link>
            <h1 className="text-xl font-bold text-headline">要録作成</h1>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-button text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            エクスポート
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 基本情報 */}
        <section className="bg-surface rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-headline">{sampleChildName}</h2>
              <p className="text-sm text-paragraph/60">幼児指導要録</p>
            </div>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
            >
              <option value="2024-2025">2024年度</option>
              <option value="2023-2024">2023年度</option>
            </select>
          </div>
          <p className="text-sm text-paragraph/70">
            要録用にマークされたエピソードを基に、AIが5領域ごとの記述文を生成します。
            生成された文章は編集・再生成が可能です。
          </p>
        </section>

        {/* 5領域セクション */}
        <div className="space-y-4">
          {domains.map(domain => (
            <DomainSection
              key={domain}
              domain={domain}
              episodes={sampleEpisodes}
              generatedText={generatedTexts[domain]}
              onRegenerate={() => handleRegenerate(domain)}
              onEdit={(text) => handleEdit(domain, text)}
              isGenerating={isGenerating === domain}
            />
          ))}
        </div>

        {/* 全体のまとめ */}
        <section className="bg-surface rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-headline mb-4">指導上参考となる事項</h3>
          <textarea
            placeholder="その他、指導上参考となる事項を記入..."
            className="w-full h-32 p-3 border border-secondary/30 rounded-lg text-sm text-paragraph bg-surface focus:outline-none focus:ring-2 focus:ring-button/30"
          />
        </section>
      </main>
    </div>
  );
}
