import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface GenerateWeeklyBody {
  type: 'weekly';
  className: string;
  grade: string;
  weekStart: string;
  dailyPlans: {
    date: string;
    objectives: string[];
    content: string;
    childrenActivities: string[];
    teacherSupport: string[];
    environment: string[];
  }[];
}

interface GenerateAnnualBody {
  type: 'annual';
  className: string;
  grade: string;
  fiscalYear: number;
  educationPhilosophy?: string;
  educationPolicy?: string;
  educationGoals?: string;
  childrenSummary?: string;
}

type GenerateBody = GenerateWeeklyBody | GenerateAnnualBody;

function buildWeeklyPrompt(body: GenerateWeeklyBody): string {
  const dailySummary = body.dailyPlans.map(dp => {
    return `【${dp.date}】
ねらい: ${dp.objectives.filter(Boolean).join('、') || 'なし'}
内容: ${dp.content || 'なし'}
活動: ${dp.childrenActivities.filter(Boolean).join('���') || 'なし'}
援助: ${dp.teacherSupport.filter(Boolean).join('、') || 'なし'}
環境: ${dp.environment.filter(Boolean).join('���') || 'なし'}`;
  }).join('\n\n');

  return `あなたは保育園の保育計画を作成する専門家です。

以下の日案データから、${body.className}（${body.grade}）の${body.weekStart}週の週案を作成してください。

## ���案データ
${dailySummary}

## 出力形式（JSON）
以下の形式で出力してください。余分なテキストは不要です。
{
  "objectives": ["週のねらい1", "週のねらい2"],
  "content": "週の保育内容の概���",
  "childrenActivities": ["主な活動1", "主な活動2"],
  "teacherSupport": ["援助1", "援助2"],
  "environment": ["環境構成1"],
  "evaluation": ""
}`;
}

function buildAnnualPrompt(body: GenerateAnnualBody): string {
  const contextParts: string[] = [];
  if (body.educationPhilosophy) contextParts.push(`教育理念: ${body.educationPhilosophy}`);
  if (body.educationPolicy) contextParts.push(`教育方針: ${body.educationPolicy}`);
  if (body.educationGoals) contextParts.push(`教育目��: ${body.educationGoals}`);
  if (body.childrenSummary) contextParts.push(`園児の概況: ${body.childrenSummary}`);

  return `あなたは保育園の年間計画を作成する専門家です。

${body.fiscalYear}年度 ${body.className}（${body.grade}）の年間保育計画を作成してください。

${contextParts.length > 0 ? `## 園の情報\n${contextParts.join('\n')}\n` : ''}
## 出力形式（JSON）
以下の形式で出力してください。余分なテキストは不要です。
{
  "objectives": ["年間目標1", "年間目標2", "年間目標3"],
  "content": "年間の保育方針・内容の概要",
  "childrenActivities": ["主な活動1", "主���活動2", "主な活動3", "主な活動4"],
  "teacherSupport": ["援助の方針1", "援助の方針2", "援助の方針3"],
  "environment": ["環境構成1", "環境構成2"],
  "evaluation": ""
}`;
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY が未設定��す' }, { status: 500 });
  }

  let body: GenerateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'リクエストボディが不正です' }, { status: 400 });
  }

  const prompt = body.type === 'weekly'
    ? buildWeeklyPrompt(body)
    : buildAnnualPrompt(body);

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI応答からJSONを抽出できませんでし��' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      type: body.type,
      plan: parsed,
    });
  } catch (err) {
    console.error('Plan generation error:', err);
    return NextResponse.json(
      { error: '計画生成に失敗しました', detail: String(err) },
      { status: 500 }
    );
  }
}
