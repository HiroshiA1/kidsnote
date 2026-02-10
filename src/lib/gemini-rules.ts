import { GoogleGenerativeAI } from '@google/generative-ai';
import { Rule } from '@/types/rule';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface RulesAnswer {
  answer: string;
  referencedRuleIds: string[];
}

export async function askAboutRules(question: string, rules: Rule[]): Promise<RulesAnswer> {
  const rulesContext = rules
    .map(r => `[ルールID: ${r.id}] 【${r.title}】\n${r.content}`)
    .join('\n\n---\n\n');

  const prompt = `あなたは幼稚園・保育園の園のルールに詳しいアシスタントです。
以下の園のルールを参照して、保育士からの質問に正確に回答してください。

## 回答のルール
- 園のルールに記載されている情報のみに基づいて回答すること
- 該当するルールがない場合は「該当するルールが見つかりませんでした」と回答すること
- 回答は簡潔かつ分かりやすく
- 参照したルールのIDをJSON形式で返すこと

## 園のルール一覧
${rulesContext}

## 出力形式
以下のJSON形式で出力してください。マークダウンのコードブロックは不要です。
{"answer":"回答テキスト","referencedRuleIds":["rule-1","rule-2"]}

## 質問
${question}`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr) as RulesAnswer;
    return {
      answer: parsed.answer || '回答を生成できませんでした。',
      referencedRuleIds: parsed.referencedRuleIds || [],
    };
  } catch (error) {
    console.error('Gemini Rules API error:', error);
    return {
      answer: 'エラーが発生しました。もう一度お試しください。',
      referencedRuleIds: [],
    };
  }
}
