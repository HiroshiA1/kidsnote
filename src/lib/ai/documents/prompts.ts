/**
 * 文書生成用プロンプトテンプレート
 * 各関数は匿名化済みテキストを受け取る前提
 */

export type DocumentType = 'record' | 'guardian_update' | 'growth_summary';

export const PROMPT_VERSION = 'v1.0.0';

interface PromptInput {
  /** 匿名化済みの園児プロフィール文 */
  childProfile: string;
  /** 匿名化済みの成長レベル概要 */
  growthSummary: string;
  /** 匿名化済みのエピソード一覧（時系列） */
  episodes: string;
  /** 期間（任意） */
  periodLabel?: string;
}

/** 指導要録向けプロンプト：年度末提出書類想定。フォーマル、所見・成長の評価 */
export function buildRecordPrompt(input: PromptInput): string {
  return `あなたは幼児教育の専門家です。以下の園児情報と観察記録から、指導要録に記載する所見文を作成してください。

【出力要件】
- 文体: 「である調」のフォーマル文
- 構成:
  1. 健康・生活面
  2. 人間関係・社会性
  3. 環境への関わり・知的発達
  4. 言葉
  5. 表現
  6. 総合所見（200字程度）
- 各セクションは150字以内、箇条書きではなく文章で記述
- 観察記録に基づく具体的な事実を交えること
- 推測や憶測を断定的に書かないこと
- 名前は仮名（園児A 等）のまま記載すること

【園児プロフィール】
${input.childProfile}

【成長レベル】
${input.growthSummary}

【観察記録（${input.periodLabel ?? '全期間'}）】
${input.episodes}

上記を踏まえて、指導要録の所見を作成してください。マークダウンの見出し（## 健康・生活面 など）で各セクションを区切ってください。`;
}

/** 保護者へ伝える最近の様子：温かみのあるカジュアルな文体 */
export function buildGuardianUpdatePrompt(input: PromptInput): string {
  return `あなたは幼稚園の担任教諭です。保護者の方に園でのお子さまの最近の様子をお伝えする文章を作成してください。

【出力要件】
- 文体: 丁寧だが温かみのある「ですます調」
- 長さ: 300〜400字程度
- 内容:
  - 最近頑張っていること
  - 友達との関わり
  - 興味を持って取り組んでいること
  - 保護者へのちょっとしたお願いや共有事項（あれば）
- 専門用語や評価的表現は避け、保護者が安心して読める文章にする
- 具体的なエピソードを1〜2個含めると良い
- 名前は仮名（園児A 等）のまま記載すること

【園児プロフィール】
${input.childProfile}

【観察記録（${input.periodLabel ?? '最近'}）】
${input.episodes}

上記を踏まえて、保護者向けのお便り文を作成してください。冒頭は「最近の○○さんの様子をお伝えします。」のように始めてください。`;
}

/** 期間内の成長まとめ：成長の変化に焦点 */
export function buildGrowthSummaryPrompt(input: PromptInput): string {
  return `あなたは幼児教育の専門家です。以下の園児情報と観察記録から、指定期間内の成長の変化をまとめた文章を作成してください。

【出力要件】
- 文体: 「ですます調」の丁寧な文章
- 構成（マークダウン見出し使用）:
  ## この期間で見られた成長
  ## 印象的なエピソード
  ## 今後の関わり方の提案
- 各セクション100〜200字程度
- 具体的なエピソードを根拠として示すこと
- 5領域（健康・人間関係・環境・言葉・表現）の視点を意識すること
- 名前は仮名（園児A 等）のまま記載すること

【園児プロフィール】
${input.childProfile}

【成長レベル（現時点）】
${input.growthSummary}

【観察記録（${input.periodLabel ?? '対象期間'}）】
${input.episodes}

上記を踏まえて、成長まとめを作成してください。`;
}

export function buildPrompt(type: DocumentType, input: PromptInput): string {
  switch (type) {
    case 'record':
      return buildRecordPrompt(input);
    case 'guardian_update':
      return buildGuardianUpdatePrompt(input);
    case 'growth_summary':
      return buildGrowthSummaryPrompt(input);
  }
}

export const documentTypeLabels: Record<DocumentType, string> = {
  record: '指導要録（所見）',
  guardian_update: '保護者向け：最近の様子',
  growth_summary: '期間内の成長まとめ',
};
