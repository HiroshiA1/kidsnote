import { Rule } from '@/types/rule';

/**
 * 園ルールの初期サンプル群。
 *
 * 過去はハードコードでデモ用ルール 8 件程度を返していたが、本番運用での混乱を避ける
 * ため空配列に変更。useHydration が初回ロード時のフォールバック値として参照する。
 */
export const sampleRules: Rule[] = [];
