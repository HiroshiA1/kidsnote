import { GoogleGenerativeAI } from '@google/generative-ai';
import { IntentResult, IntentType, GrowthData, AddChildData, AddStaffData, RuleQueryData, DeleteChildData, AddRuleData } from '@/types/intent';
import { SAFETY_KEYWORDS } from './safetyKeywords';
import { DELETE_CHILD_KEYWORDS } from './constants/deleteKeywords';
import { anonymizeText, deanonymizeResult, type AnonymizeResult, type ChildEntry } from './anonymize';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const CLASSIFICATION_PROMPT = `あなたは幼稚園・保育園の業務支援AIです。
保育士からの入力テキストを分析し、以下の9つのカテゴリのいずれかに分類してください。

## 分類の優先順位（重要：この順番で判定してください）

### 1. delete_child（園児削除）- 最優先で慎重判定
**極めて慎重に判定すること。誤起動すると取り返しがつかない。**
以下の**明示的な削除語が原文に含まれる場合のみ** delete_child:
- 「削除」「消して」「消す」「消去」「退園」「除籍」
- かつ 対象園児名が特定できること
「取り消し」「キャンセル」は削除と混同されやすいので delete_child とはしない。
該当する削除語がなければ絶対に delete_child と分類してはならない。

### 2. add_rule（ルール追加）
園に新しいルールを追加する意図:
- 「新しいルール」「ルールを追加」「規則を決めた」「〜を決まりにする」
- 「今後〜する」「これから〜に変える」（明示的な方針転換）
既存ルールへの質問(rule_query)とは区別すること。

### 3. add_child（園児追加）
以下のキーワードが含まれる場合は必ず add_child:
- 「入園」「新入園」「入園しました」「入園します」
- 「新しい園児」「新しく来た」「転園してきた」
- 「〜組に入りました」（クラス配属の文脈で）
- 「登録」「追加」（園児の文脈で）

### 4. add_staff（職員追加）
以下のキーワードが含まれる場合は add_staff:
- 「入職」「新任」「着任」「赴任」
- 「新しい先生」「新しい職員」
- 「〜先生が来ました」「配属されました」

### 5. rule_query（ルール質問）
園のルール・規則・マニュアル・手順についての質問
- 「ルール」「規則」「決まり」「対応方法」「マニュアル」「手順」等のキーワード
- 「〜はどうすればいい？」「〜の時はどうする？」「〜の対応は？」等の質問形式
- 「〜を教えて」「〜について知りたい」（ルール・手順に関するもの）

### 6. incident（ヒヤリハット）
怪我・事故・危険な出来事・ヒヤリとした場面

### 7. child_update（園児情報更新）
既存園児のアレルギー情報の変更・特性の追加など
※「入園」を含まない、既存園児の情報更新のみ

### 8. handover（申し送り）
保護者からの連絡・職員間の伝達事項・お迎え変更など

### 9. growth（成長記録）
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

園児削除の場合（原文に削除語が明示されている場合のみ）:
{"intent":"delete_child","data":{"target_name":"園児名","class_hint":"クラス名や年齢(任意)","matched_keyword":"削除/消して/退園 など原文で検出した語"},"confidence":0.6}

ルール追加の場合:
{"intent":"add_rule","data":{"title":"ルールのタイトル","content":"ルール本文","category":"safety/health/parents/daily_life/allergy/emergency/other のいずれか","related_rule_ids":[]},"confidence":0.8}

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

  if (intent === 'delete_child') {
    const name = extractName(text);
    const className = extractClassName(text);
    const matchedKeyword = DELETE_CHILD_KEYWORDS.find(kw => text.includes(kw));
    const data: DeleteChildData = {
      target_name: name,
      class_hint: className,
      matched_keyword: matchedKeyword,
    };
    // 破壊的操作は confidence を低めに固定し autoSave 経路を絶対に通さない
    return { intent: 'delete_child', data, confidence: 0.6 };
  }

  if (intent === 'add_rule') {
    // AI本体が title/content/category を構造化する。フォールバックとして原文を content に入れる
    const data: AddRuleData = {
      title: text.slice(0, 30),
      content: text,
      category: 'other',
      related_rule_ids: [],
    };
    return { intent: 'add_rule', data, confidence: 0.7 };
  }

  // その他の場合は元のデータを使用
  return { ...originalResult, intent };
}

/** ルール追加のキーワード(rule_query と区別するため明確な追加意図のみ) */
const ADD_RULE_KEYWORDS = ['新しいルール', 'ルールを追加', '規則を追加', '規則を決め', 'ルールを決め', '今後', 'これから', '決まりにする', '決まりに追加'];

/** delete_child の pre-classify に要求する対象語(誤分類防止のため、単純な削除語だけでは発火させない) */
const DELETE_CHILD_CONTEXT_WORDS = ['園児', '名簿', '退園', '除籍', 'さん', 'ちゃん', 'くん'];

// キーワードベースの事前判定（AIより優先）
function preClassifyByKeyword(text: string): IntentType | null {
  // 園児削除: 明示削除語 AND 対象を示唆する語(園児/名簿/退園/除籍/さん・ちゃん・くん)の併存
  // 「記録を消す」「メモを消す」「予定を削除」など日常語との誤マッチを防ぐ
  const hasDeleteKw = DELETE_CHILD_KEYWORDS.some(kw => text.includes(kw));
  const hasContextKw = DELETE_CHILD_CONTEXT_WORDS.some(kw => text.includes(kw));
  if (hasDeleteKw && hasContextKw) {
    return 'delete_child';
  }

  // ルール追加のキーワード (rule_query より先に判定)
  if (ADD_RULE_KEYWORDS.some(kw => text.includes(kw))) {
    return 'add_rule';
  }

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
  /** AIに送る text がコンテキスト前置を含む場合、破壊的操作のガード判定には純粋な原文のみを使う */
  rawTextForGuard?: string,
): Promise<ClassifyResult> {
  // キーワード事前判定は(前置コンテキストを含まない)原文に対して実施する
  const guardText = rawTextForGuard ?? text;
  const preClassified = preClassifyByKeyword(guardText);

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

    // ── 破壊的操作の二重ガード ────────────────────────
    // AI が delete_child と返しても、原文(前置コンテキスト除外)に明示削除語+文脈語が
    // 無ければ信用しない。preClassifyByKeyword と同じ基準を適用する。
    if (parsed.intent === 'delete_child') {
      const hasDeleteKw = DELETE_CHILD_KEYWORDS.some(kw => guardText.includes(kw));
      const hasContextKw = DELETE_CHILD_CONTEXT_WORDS.some(kw => guardText.includes(kw));
      if (!hasDeleteKw || !hasContextKw) {
        // 誤分類と判断 — growth にフォールバック(名前なし削除文の false positive 表示を防ぐ)
        parsed = {
          intent: 'growth',
          data: { child_names: [], summary: text, tags: [] } as GrowthData,
          confidence: 0,
        };
      } else {
        // confidence は 0.7 を超えないように圧縮(autoSave閾値 0.9 に決して到達しないため)
        parsed = { ...parsed, confidence: Math.min(parsed.confidence ?? 0.6, 0.7) };
      }
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
    // preClassified が何であっても、data 形状が GrowthData しか組み立てられない以上、
    // intent と data の整合性を守るため常に growth にフォールバックする。
    // (delete_child/add_rule/add_child/add_staff などの誤intentを残すと後段UIが壊れる)
    return {
      intent: {
        intent: 'growth',
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

  const validIntents: IntentType[] = ['growth', 'incident', 'handover', 'child_update', 'add_child', 'add_staff', 'rule_query', 'delete_child', 'add_rule'];
  if (!validIntents.includes(r.intent as IntentType)) return false;

  return true;
}
