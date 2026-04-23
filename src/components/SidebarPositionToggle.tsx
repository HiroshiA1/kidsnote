'use client';

import { useApp, SidebarPosition } from './AppLayout';

/**
 * サイドバー位置の切替 UI。
 * 現在ログイン中のスタッフ別に localStorage へ保存する(AppLayout 側の責務)。
 * モバイルの drawer は常に左からのため、ここでの切替は md 以上の固定レイアウトにのみ効く。
 */
export function SidebarPositionToggle() {
  const { sidebarPosition, setSidebarPosition } = useApp();

  const options: { value: SidebarPosition; label: string; description: string }[] = [
    { value: 'left', label: '左側', description: '標準配置' },
    { value: 'right', label: '右側', description: '右手持ちで親指が届きやすい' },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-headline">サイドバー位置</p>
      <p className="text-xs text-paragraph/60">
        iPad を片手で持つ際のリーチに応じて左右を入れ替えられます。職員ごとに端末ローカルに記憶します。
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map(opt => {
          const selected = sidebarPosition === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSidebarPosition(opt.value)}
              aria-pressed={selected}
              className={`min-h-12 px-4 py-2 rounded-lg border transition-colors text-left ${
                selected
                  ? 'border-button bg-button/10 text-headline'
                  : 'border-secondary/40 bg-surface text-paragraph hover:bg-secondary/10'
              }`}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-paragraph/60">{opt.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
