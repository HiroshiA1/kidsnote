import { Child, GrowthLevel } from '@/types/child';
import { GrowthEvaluation } from '@/types/growth';

/**
 * UI 側で使う Child の拡張型。`Child` は DB 1 対 1 のフィールドのみ持ち、
 * 成長レベル/学年/評価は派生情報なのでここで合体させる。
 *
 * 参照箇所が多いため、サンプル定義を空にした後も型 export は本ファイルに残す。
 * (将来 `Child` 型の再構成と合わせて移動するならその時。)
 */
export type ChildWithGrowth = Child & {
  growthLevels: GrowthLevel[];
  grade: string;
  growthEvaluations?: GrowthEvaluation[];
};

/**
 * 園児の初期サンプルデータ。
 *
 * 過去はハードコードのデモ園児を多数返していたが、本番運用では混乱の元になるため
 * 空配列に変更。新規環境では何も表示されず、Supabase 化が完了したら API 経由で取得する。
 *
 * - **既に localStorage に保存済みのサンプルは消えない**: ブラウザ側で
 *   `localStorage.removeItem('kidsnote:children')` してリロードすると初期化される。
 */
export const initialChildren: ChildWithGrowth[] = [];
