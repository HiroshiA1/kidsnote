import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { anonymizeText, deanonymizeText, type ChildEntry } from '@/lib/anonymize';
import { buildPrompt, type DocumentType, PROMPT_VERSION } from '@/lib/ai/documents/prompts';

interface GenerateBody {
  type: DocumentType;
  child: {
    id: string;
    lastName: string;
    firstName: string;
    lastNameKanji?: string;
    firstNameKanji?: string;
    grade?: string;
    className?: string;
    gender?: 'male' | 'female' | 'other';
    age?: number;
    allergies?: string[];
    characteristics?: string[];
    interests?: string[];
    growthLevels?: { domain: string; level: number }[];
  };
  episodes: { date: string; content: string; tags?: string[] }[];
  periodLabel?: string;
}

function formatChildProfile(child: GenerateBody['child']): string {
  const fullName = `${child.lastNameKanji ?? child.lastName} ${child.firstNameKanji ?? child.firstName}`.trim();
  const lines = [`氏名: ${fullName}`];
  if (child.grade) lines.push(`学年: ${child.grade}`);
  if (child.className) lines.push(`クラス: ${child.className}`);
  if (child.age != null) lines.push(`年齢: ${child.age}歳`);
  if (child.gender) {
    const g = child.gender === 'male' ? '男児' : child.gender === 'female' ? '女児' : 'その他';
    lines.push(`性別: ${g}`);
  }
  if (child.allergies?.length) lines.push(`アレルギー: ${child.allergies.join(', ')}`);
  if (child.characteristics?.length) lines.push(`特性: ${child.characteristics.join(', ')}`);
  if (child.interests?.length) lines.push(`興味・関心: ${child.interests.join(', ')}`);
  return lines.join('\n');
}

function formatGrowthLevels(growthLevels?: { domain: string; level: number }[]): string {
  if (!growthLevels?.length) return '（記録なし）';
  const labels: Record<string, string> = {
    health: '健康',
    relationships: '人間関係',
    environment: '環境',
    language: '言葉',
    expression: '表現',
  };
  return growthLevels
    .map((gl) => `- ${labels[gl.domain] ?? gl.domain}: Lv.${gl.level}`)
    .join('\n');
}

function formatEpisodes(episodes: GenerateBody['episodes']): string {
  if (!episodes.length) return '（該当期間に観察記録がありません）';
  return episodes
    .map((ep, i) => {
      const tagStr = ep.tags?.length ? ` [${ep.tags.join(', ')}]` : '';
      return `${i + 1}. ${ep.date}${tagStr}\n   ${ep.content}`;
    })
    .join('\n\n');
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY が未設定です' }, { status: 500 });
  }

  let body: GenerateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'リクエストボディが不正です' }, { status: 400 });
  }

  const { type, child, episodes, periodLabel } = body;
  if (!type || !child) {
    return NextResponse.json({ error: 'type, child は必須です' }, { status: 400 });
  }
  if (!['record', 'guardian_update', 'growth_summary'].includes(type)) {
    return NextResponse.json({ error: 'type が不正です' }, { status: 400 });
  }

  // ===== 1. プロフィール・成長・エピソードを文字列化 =====
  const profileRaw = formatChildProfile(child);
  const growthRaw = formatGrowthLevels(child.growthLevels);
  const episodesRaw = formatEpisodes(episodes);

  // ===== 2. 匿名化（名前のみ） =====
  // 対象園児の全名前バリエーション
  const childNames: string[] = [
    child.firstName,
    child.lastName,
    child.firstNameKanji ?? '',
    child.lastNameKanji ?? '',
    `${child.lastName}${child.firstName}`,
    `${child.lastNameKanji ?? ''}${child.firstNameKanji ?? ''}`,
    `${child.lastName} ${child.firstName}`,
    `${child.lastNameKanji ?? ''} ${child.firstNameKanji ?? ''}`,
  ].filter(Boolean);

  const childEntries: ChildEntry[] = [{ id: child.id, names: childNames }];

  const combinedText = `${profileRaw}\n\n${growthRaw}\n\n${episodesRaw}`;
  const anonymized = anonymizeText(combinedText, childEntries);

  // 匿名化後のテキストを各セクションに戻す（粗いがプロンプトに渡すには十分）
  const [anonProfile, anonGrowth, anonEpisodes] = anonymized.anonymizedText.split('\n\n');

  const prompt = buildPrompt(type, {
    childProfile: anonProfile ?? profileRaw,
    growthSummary: anonGrowth ?? growthRaw,
    episodes: anonEpisodes ?? episodesRaw,
    periodLabel,
  });

  // ===== 3. Gemini 呼び出し =====
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const generatedAnonymized = result.response.text();

    // ===== 4. 復元 =====
    const restored = deanonymizeText(generatedAnonymized, anonymized.nameMap);

    return NextResponse.json({
      success: true,
      type,
      content: restored,
      promptVersion: PROMPT_VERSION,
      model: 'gemini-2.0-flash-exp',
      meta: {
        episodeCount: episodes.length,
        periodLabel: periodLabel ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '生成に失敗しました';
    return NextResponse.json({ error: `生成エラー: ${message}` }, { status: 500 });
  }
}
