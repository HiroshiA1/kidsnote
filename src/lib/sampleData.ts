import { InputMessage } from '@/types/intent';

/**
 * ダッシュボード/各記録ページに常時マージされていたデモ用の記録サンプル群。
 *
 * 過去はハードコードで成長記録/ヒヤリハット/申し送り等を返していたが、本番運用で
 * 残り続けると混乱の元になるため空配列に変更。実際の記録は `messages` (localStorage
 * の `kidsnote_messages`) に保存される。
 */
export const sampleRecords: InputMessage[] = [];
