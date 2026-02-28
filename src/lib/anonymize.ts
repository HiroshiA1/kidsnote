/**
 * テキスト匿名化ユーティリティ
 *
 * Gemini API に送信する前に園児名・職員名を仮名（園児A, 園児B…）に置換し、
 * API のレスポンスを受けた後に元の名前に復元する。
 *
 * 匿名化時に登録済み園児との紐付けも同時に行い、
 * AI の出力に依存しない確実な園児特定を実現する。
 *
 * 個人情報保護法に基づき、外部 AI サービスへの実名送信を防止する。
 */

/** 園児情報（匿名化＋紐付け用） */
export interface ChildEntry {
    id: string;
    /** この園児に関連するすべての名前表記（ひらがな・漢字・フルネーム等） */
    names: string[];
}

/** 匿名化結果 */
export interface AnonymizeResult {
    /** 匿名化後のテキスト */
    anonymizedText: string;
    /** 仮名 → 元の名前 のマッピング */
    nameMap: Map<string, string>;
    /** テキスト内で検出された園児IDリスト（登録済み園児のみ） */
    matchedChildIds: string[];
}

/**
 * テキスト内の名前を仮名に置換し、同時に園児IDを特定する
 *
 * @param text 入力テキスト
 * @param children 登録済み園児の名前情報（IDとすべての名前表記）
 * @param extraNames 職員名など園児以外の名前（匿名化対象だがID紐付けなし）
 * @returns 匿名化済みテキスト、マッピング、マッチした園児ID
 */
export function anonymizeText(
    text: string,
    children: ChildEntry[] = [],
    extraNames: string[] = [],
): AnonymizeResult {
    const nameMap = new Map<string, string>();
    const matchedChildIds = new Set<string>();
    let anonymized = text;
    let counter = 0;

    // 園児名を名前→園児IDのマップに変換
    const nameToChildId = new Map<string, string>();
    const allChildNames: string[] = [];
    for (const child of children) {
        for (const name of child.names) {
            if (name.length >= 2) {
                nameToChildId.set(name, child.id);
                allChildNames.push(name);
            }
        }
    }

    // 全名前（園児 + その他）を長い順にソート（部分一致の問題を防ぐ）
    const allNames = [...allChildNames, ...extraNames.filter(n => n.length >= 2)];
    const sortedNames = [...new Set(allNames)].sort((a, b) => b.length - a.length);

    // 敬称リスト
    const suffixes = ['くん', 'ちゃん', 'さん', '先生', '君', ''];

    for (const name of sortedNames) {
        // 既にマッピング済みの名前はスキップ
        if ([...nameMap.values()].includes(name)) {
            // ただし園児IDの紐付けは行う
            const childId = nameToChildId.get(name);
            if (childId) matchedChildIds.add(childId);
            continue;
        }

        let found = false;

        for (const suffix of suffixes) {
            const pattern = name + suffix;
            if (anonymized.includes(pattern)) {
                counter++;
                const placeholder = `園児${numberToLabel(counter)}`;
                nameMap.set(placeholder, name);

                // 園児IDを記録
                const childId = nameToChildId.get(name);
                if (childId) matchedChildIds.add(childId);

                // 敬称付きのパターンを先に置換
                if (suffix) {
                    anonymized = anonymized.replaceAll(pattern, placeholder);
                }
                anonymized = anonymized.replaceAll(name, placeholder);
                found = true;
                break;
            }
        }

        // 敬称なしでもマッチ
        if (!found && anonymized.includes(name)) {
            counter++;
            const placeholder = `園児${numberToLabel(counter)}`;
            nameMap.set(placeholder, name);
            anonymized = anonymized.replaceAll(name, placeholder);

            const childId = nameToChildId.get(name);
            if (childId) matchedChildIds.add(childId);
        }
    }

    return {
        anonymizedText: anonymized,
        nameMap,
        matchedChildIds: [...matchedChildIds],
    };
}

/**
 * AI の結果テキスト内の仮名を元の名前に復元する
 */
export function deanonymizeText(text: string, nameMap: Map<string, string>): string {
    let restored = text;
    for (const [placeholder, original] of nameMap) {
        restored = restored.replaceAll(placeholder, original);
    }
    return restored;
}

/**
 * IntentResult の data 内の名前フィールドを復元する
 */
export function deanonymizeResult<T>(result: T, nameMap: Map<string, string>): T {
    if (!result || typeof result !== 'object' || nameMap.size === 0) return result;

    const json = JSON.stringify(result);
    const restored = deanonymizeText(json, nameMap);
    try {
        return JSON.parse(restored) as T;
    } catch {
        return result;
    }
}

/** 番号をアルファベットラベルに変換（1→A, 2→B, ... 27→AA） */
function numberToLabel(n: number): string {
    let label = '';
    let num = n;
    while (num > 0) {
        num--;
        label = String.fromCharCode(65 + (num % 26)) + label;
        num = Math.floor(num / 26);
    }
    return label;
}
