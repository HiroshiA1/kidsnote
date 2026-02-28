import { GoogleGenerativeAI } from '@google/generative-ai';
import { Rule } from '@/types/rule';
import { anonymizeText, deanonymizeText, ChildEntry, AnonymizeResult } from './anonymize';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface RulesAnswer {
  answer: string;
  referencedRuleIds: string[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askAboutRules(
  question: string,
  rules: Rule[],
  conversationHistory?: ConversationMessage[],
  children: ChildEntry[] = [],
  extraNames: string[] = []
): Promise<RulesAnswer> {
  const rulesContext = rules
    .map(r => `[ルールID: ${r.id}] 【${r.title}】\n${r.content}`)
    .join('\n\n---\n\n');

  const historyContext = conversationHistory && conversationHistory.length > 0
    ? `\n## これまでの会話履歴\n${conversationHistory.map(m => `${m.role === 'user' ? '保育士' : 'アシスタント'}: ${m.content}`).join('\n')}\n`
    : '';

  let anonymization: AnonymizeResult = {
    anonymizedText: question,
    nameMap: new Map(),
    matchedChildIds: [],
  };

  if (children.length > 0 || extraNames.length > 0) {
    anonymization = anonymizeText(question, children, extraNames);
  }

  // 会話履歴も匿名化する（過去のやり取りでの名前漏洩を防ぐ）
  const historyContextSafe = historyContext ? anonymizeText(historyContext, children, extraNames).anonymizedText : '';

  const prompt = `あなたは幼稚園・保育園の園のルールに詳しいアシスタントです。
以下の園のルールを参照して、保育士からの質問に正確に回答してください。

## 回答のルール
- 園のルールに記載されている情報のみに基づいて回答すること
- 該当するルールがある場合は、ルールの記載内容を引用して明確に示すこと
- 複数のルールが関連する場合は、優先順位をつけて説明すること
- 「〜と思います」等の曖昧表現を避け、ルールに基づく断定的な回答をすること
- 該当するルールがない場合は「該当するルールが見つかりませんでした」と回答すること
- 回答は簡潔かつ分かりやすく
- 参照したルールのIDをJSON形式で返すこと
- 会話履歴がある場合は、文脈を踏まえて回答すること

## 園のルール一覧
${rulesContext}
${historyContextSafe}
## 出力形式
以下のJSON形式で出力してください。マークダウンのコードブロックは不要です。
{"answer":"回答テキスト","referencedRuleIds":["rule-1","rule-2"]}

## 質問
${anonymization.anonymizedText}`;

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

    // 復元
    let answerText = parsed.answer;
    if (anonymization.nameMap.size > 0) {
      answerText = deanonymizeText(answerText, anonymization.nameMap);
    }

    return {
      answer: answerText || '回答を生成できませんでした。',
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
