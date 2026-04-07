import { GoogleGenerativeAI } from '@google/generative-ai';
import { IntentResult, IntentType, GrowthData, AddChildData, AddStaffData, RuleQueryData } from '@/types/intent';
import { SAFETY_KEYWORDS } from './safetyKeywords';
import { anonymizeText, deanonymizeResult, type AnonymizeResult, type ChildEntry } from './anonymize';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const CLASSIFICATION_PROMPT = `あなたは幼稚園・保育園の業務支援AIです。
保育士からの入力テキストを分析し、以下の7つのカテゴリのいずれかに分類してください。

## 分類の優先順位（重要：この順番で判定してください）

### 1. add_child（園児追加）- 最優先で判定
以下のキーワードが含まれる場合は必ず add_child:
- 「入園」「新入園」「入園しました」「入園します」
- 「新しい園児」「新しく来た」「転園してきた」
- 「〜組に入りました」（クラス配属の文脈で）
- 「登録」「追加」（園児の文脈で）

### 2. add_staff（職員追加）
以下のキーワードが含まれる場合は add_staff:
- 「入職」「新任」「着任」「赴任」
- 「新しい先生」「新しい職員」
- 「〜先生が来ました」「配属されました」

### 3. rule_query（ルール質問）
園のルール・規則・マニュアル・手順についての質問
- 「ルール」「規則」「決まり」「対応方法」「マニュアル」「手順」等のキーワード
- 「〜はどうすればいい？」「〜の時はどうする？」「〜の対応は？」等の質問形式
- 「〜を教えて」「〜について知りたい」（ルール・手順に関するもの）

### 4. incident（ヒヤリハット）
怪我・事故・危険な出来事・ヒヤリとした場面

### 5. child_update（園児情報更新）
既存園児のアレルギー情報の変更・特性の追加など
※「入園」を含まない、既存園児の情報更新のみ

### 6. handover（申し送り）
保護者からの連絡・職員間の伝達事項・お迎え変更など

### 7. growth（成長記録）
園児の成長・発達・できたこと・日常の様子
※上記のどれにも該当しない場合

## 出力形式
必ず以下のJSON形式で出力してください。マークダウンのコードブロックは不要です。

成長記録の場合:
{"intent":"growth","data":{"child_names":["園児名"],"summary":"要約","tags":["タグ"]},"confidence":0.95}

ヒヤリハットの場合:
{"intent":"incident","data":{"location":"場所","cause":"要因","severity":"low/medium/high","child_name":"園児名","description":"説明"},"confidence":0.95}

申し送りの場合:
{"intent":"handover","data":{"message":"内容","target":"宛先","urgent":true/false},"confidence":0.95}

園児情報更新の場合:
{"intent":"child_update","data":{"child_name":"園児名","field":"allergy/characteristic","new_value":"新しい値"},"confidence":0.95}

園児追加の場合:
{"intent":"add_child","data":{"name":"園児名","class_name":"クラス名","birth_date":"生年月日","gender":"male/female","allergies":["アレルギー"],"notes":"備考"},"confidence":0.95}

職員追加の場合:
{"intent":"add_staff","data":{"name":"職員名","role":"役職","class_name":"担当クラス","contact":"連絡先","notes":"備考"},"confidence":0.95}

ルール質問の場合:
{"intent":"rule_query","data":{"question":"質問内容"},"confidence":0.95}

## その他のルール
- 園児名・職員名は「〜くん」「〜ちゃん」「〜さん」「〜先生」を除いた名前のみ抽出
- 場所が不明な場合は"不明"
- severityは怪我の程度: low(軽微な擦り傷等), medium(通院が必要そう), high(重大な怪我)
- urgentは"至急""すぐ"などの緊急性を示す言葉がある場合true
- tagsは「初めて」「成長」「感情」「社会性」「言語」「運動」などから適切なものを選択
- confidenceは分類の確信度(0.0-1.0)
- genderはmale(男の子)またはfemale(女の子)
- 年齢から生年月日を推測（例: 5歳 → 5年前の年を birth_date に）
- 不明な項目はnullまたは省略

入力テキスト:
`;

// テキストから名前を抽出
function extractName(text: string): string {
  // 「〜くん」「〜ちゃん」「〜さん」「〜先生」付きの名前を抽出
  const suffixPattern = /([一-龯]+[一-龯]*|[ぁ-んァ-ヶー]+)(くん|ちゃん|さん|先生)/;
  const suffixMatch = text.match(suffixPattern);
  if (suffixMatch) {
    return suffixMatch[1];
  }

  // フルネームパターン（漢字2-6文字）
  const kanjiNameMatch = text.match(/([一-龯]{2,6})/);
  if (kanjiNameMatch) {
    return kanjiNameMatch[1];
  }

  // ひらがな/カタカナの名前
  const kanaNameMatch = text.match(/([ぁ-んァ-ヶー]{2,8})/);
  if (kanaNameMatch) {
    return kanaNameMatch[1];
  }

  return '不明';
}

// テキストからクラス名を抽出
function extractClassName(text: string): string | undefined {
  const classMatch = text.match(/([ぁ-んァ-ン一-龯]+組)/);
  return classMatch ? classMatch[1] : undefined;
}

// テキストからアレルギー情報を抽出
function extractAllergies(text: string): string[] {
  const allergies: string[] = [];
  const allergyKeywords = ['卵', '乳', '小麦', 'そば', '落花生', 'えび', 'かに', 'ナッツ', '魚', '大豆'];

  for (const keyword of allergyKeywords) {
    if (text.includes(keyword)) {
      allergies.push(keyword);
    }
  }

  // 「〜アレルギー」パターン
  const allergyMatch = text.match(/([一-龯ぁ-んァ-ン]+)アレルギー/g);
  if (allergyMatch) {
    for (const match of allergyMatch) {
      const allergen = match.replace('アレルギー', '');
      if (!allergies.includes(allergen)) {
        allergies.push(allergen);
      }
    }
  }

  return allergies;
}

// テキストから年齢・生年を抽出
function extractBirthInfo(text: string): string | undefined {
  const ageMatch = text.match(/(\d+)歳/);
  if (ageMatch) {
    const age = parseInt(ageMatch[1]);
    const birthYear = new Date().getFullYear() - age;
    return `${birthYear}年`;
  }
  return undefined;
}

// intentに応じてデータを変換
function convertToIntent(text: string, intent: IntentType, originalResult: IntentResult): IntentResult {
  if (intent === 'add_child') {
    const name = extractName(text);
    const data: AddChildData = {
      name,
      class_name: extractClassName(text),
      birth_date: extractBirthInfo(text),
      allergies: extractAllergies(text),
    };
    return { intent: 'add_child', data, confidence: 0.9 };
  }

  if (intent === 'add_staff') {
    const name = extractName(text);
    const data: AddStaffData = {
      name,
      class_name: extractClassName(text),
    };
    return { intent: 'add_staff', data, confidence: 0.9 };
  }

  if (intent === 'rule_query') {
    const data: RuleQueryData = { question: text };
    return { intent: 'rule_query', data, confidence: 0.9 };
  }

  // その他の場合は元のデータを使用
  return { ...originalResult, intent };
}

// キーワードベースの事前判定（AIより優先）
function preClassifyByKeyword(text: string): IntentType | null {
  const lowerText = text.toLowerCase();

  // 園児追加のキーワード
  const addChildKeywords = ['入園', '新入園', '転園してき', '新しい園児', '園児を追加', '園児登録'];
  if (addChildKeywords.some(kw => text.includes(kw))) {
    return 'add_child';
  }

  // 職員追加のキーワード
  const addStaffKeywords = ['入職', '新任', '着任', '赴任', '新しい先生', '新しい職員', '先生が来ました', '職員を追加', '職員登録'];
  if (addStaffKeywords.some(kw => text.includes(kw))) {
    return 'add_staff';
  }

  // ルール質問のキーワード
  const ruleQueryKeywords = ['ルール', '規則', '決まり', '対応方法', 'マニュアル', '手順'];
  const ruleQueryPatterns = [/どうすればいい/, /どうする？/, /の対応は/, /を教えて/, /について知りたい/];
  if (ruleQueryKeywords.some(kw => text.includes(kw)) ||
    ruleQueryPatterns.some(p => p.test(text))) {
    return 'rule_query';
  }

  // ヒヤリハットのキーワード（共有辞書）
  if (SAFETY_KEYWORDS.some(kw => text.includes(kw))) {
    return 'incident';
  }

  return null;
}

/** 分類結果（園児紐付け情報を含む） */
export interface ClassifyResult {
  intent: IntentResult;
  /** 匿名化時にテキスト内で検出された園児ID */
  matchedChildIds: string[];
}

export async function classifyIntent(
  text: string,
  children: ChildEntry[] = [],
  extraNames: string[] = [],
): Promise<ClassifyResult> {
  // キーワードベースの事前判定
  const preClassified = preClassifyByKeyword(text);

  // 匿名化: 園児名を仮名に置換してからAPIに送信 + 園児ID特定
  let anonymization: AnonymizeResult = {
    anonymizedText: text,
    nameMap: new Map(),
    matchedChildIds: [],
  };
  if (children.length > 0 || extraNames.length > 0) {
    anonymization = anonymizeText(text, children, extraNames);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

    // 匿名化済みテキストをAPIに送信
    const result = await model.generateContent(CLASSIFICATION_PROMPT + anonymization.anonymizedText);
    const response = result.response.text();

    // JSONを抽出（マークダウンのコードブロックがある場合も対応）
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let parsed = JSON.parse(jsonStr) as IntentResult;

    // 匿名化された名前を元に戻す
    if (anonymization.nameMap.size > 0) {
      parsed = deanonymizeResult(parsed, anonymization.nameMap);
    }

    // バリデーション
    if (!isValidIntent(parsed)) {
      throw new Error('Invalid intent structure');
    }

    // キーワード事前判定がある場合はintentを上書きし、データも変換
    if (preClassified && parsed.intent !== preClassified) {
      return {
        intent: convertToIntent(text, preClassified, parsed),
        matchedChildIds: anonymization.matchedChildIds,
      };
    }

    return {
      intent: parsed,
      matchedChildIds: anonymization.matchedChildIds,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      intent: {
        intent: preClassified || 'growth',
        data: {
          child_names: [],
          summary: text,
          tags: [],
        } as GrowthData,
        confidence: 0,
      },
      matchedChildIds: anonymization.matchedChildIds,
    };
  }
}

function isValidIntent(result: unknown): result is IntentResult {
  if (!result || typeof result !== 'object') return false;

  const r = result as Record<string, unknown>;
  if (!r.intent || !r.data) return false;

  const validIntents: IntentType[] = ['growth', 'incident', 'handover', 'child_update', 'add_child', 'add_staff', 'rule_query'];
  if (!validIntents.includes(r.intent as IntentType)) return false;

  return true;
}
