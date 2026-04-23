'use client';

import { useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { Button, ButtonVariant } from './Button';

export interface InfluenceScopeItem {
  label: string;
  count: number;
  unit?: string;
}

export interface TypedConfirmOptions {
  keyword: string;
  placeholder?: string;
}

/**
 * 長押し確定オプション。pointer デバイス (touch / mouse / pen) 経由のクリックは
 * 指定時間の押下継続を要求する。キーボード・支援技術からの click はそのまま通す。
 * 不可逆削除など「accidental touch を物理的に防ぎたい」操作のみ opt-in で有効化する。
 */
export interface LongPressOptions {
  /** 押下継続時間(ms)。既定 1000 */
  durationMs?: number;
  /** ボタン下に表示する案内文。既定「n秒長押しで確定」 */
  hint?: string;
}

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'info';
  influenceScope?: InfluenceScopeItem[];
  typedConfirm?: TypedConfirmOptions;
  longPress?: LongPressOptions;
}

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
  /** openConfirm 呼び出し時にフォーカスしていた要素(閉じ時にフォーカスを戻す) */
  openerFocus: HTMLElement | null;
}

/**
 * 確認ダイアログキュー管理フック。
 * 同時に複数の openConfirm が呼ばれてもキューに積まれ、前から順に表示される。
 * (以前は単一stateで置換していたため、前件resolveが false で捨てられる仕様だった)
 */
export function useConfirm() {
  const [queue, setQueue] = useState<PendingConfirm[]>([]);

  const openConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>(resolve => {
      const openerFocus =
        typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
      setQueue(prev => [...prev, { options, resolve, openerFocus }]);
    });
  }, []);

  const handleResolve = useCallback((value: boolean) => {
    setQueue(prev => {
      if (prev.length === 0) return prev;
      const [front, ...rest] = prev;
      front.resolve(value);
      return rest;
    });
  }, []);

  // 現在表示される1件のみ返す(互換性のため pending という名前を維持)
  const pending = queue[0] ?? null;

  return { openConfirm, pending, resolveConfirm: handleResolve };
}

interface ConfirmDialogContainerProps {
  pending: PendingConfirm | null;
  onResolve: (value: boolean) => void;
}

export function ConfirmDialogContainer({ pending, onResolve }: ConfirmDialogContainerProps) {
  const [typedInput, setTypedInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // 今消えた pending の openerFocus を覚えておき、pending が null になったタイミングで戻す
  const lastOpenerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (pending) {
      lastOpenerRef.current = pending.openerFocus;
      setTypedInput('');
      setTimeout(() => {
        if (pending.options.typedConfirm) {
          inputRef.current?.focus();
        } else {
          cancelRef.current?.focus();
        }
      }, 0);
    } else if (lastOpenerRef.current) {
      const opener = lastOpenerRef.current;
      lastOpenerRef.current = null;
      // opener が既に DOM から外れている場合(例: 元のpopupが消えた等)は body にフォールバック
      const stillInDom = opener.isConnected;
      if (stillInDom && typeof opener.focus === 'function') {
        opener.focus();
      } else if (typeof document !== 'undefined') {
        document.body?.focus?.();
      }
    }
  }, [pending]);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onResolve(false);
        return;
      }
      // Tab フォーカストラップ: ダイアログ外へ出さない
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, onResolve]);

  if (!pending) return null;

  const { options } = pending;
  const isDanger = options.type === 'danger';
  const confirmVariant: ButtonVariant = isDanger ? 'destructive' : 'commit';
  const typedRequired = !!options.typedConfirm;
  // 厳密一致。空白混入を弾くことで「誤ってスペースで通る」事故を防ぐ
  const typedOk = !typedRequired || typedInput === options.typedConfirm!.keyword;
  const longPressOn = !!options.longPress;
  const longPressDuration = options.longPress?.durationMs ?? 1000;
  const longPressHint =
    options.longPress?.hint ?? `${Math.max(1, Math.round(longPressDuration / 1000))}秒長押しで確定`;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={() => onResolve(false)}
    >
      <div
        ref={dialogRef}
        className="bg-surface rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-bold text-headline mb-2">
          {options.title}
        </h2>
        {options.message && (
          <p className="text-sm text-paragraph/80 whitespace-pre-line mb-4">{options.message}</p>
        )}
        {options.influenceScope && options.influenceScope.length > 0 && (
          <div className="mb-4 p-3 bg-secondary/20 rounded-lg">
            <p className="text-xs font-medium text-paragraph/60 mb-2">関連データ</p>
            <ul className="space-y-1">
              {options.influenceScope.map(item => (
                <li key={item.label} className="text-sm text-paragraph flex justify-between">
                  <span>{item.label}</span>
                  <span className="font-medium">
                    {item.count}
                    {item.unit ?? '件'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {isDanger && (
          <p className="text-sm text-alert mb-4">この操作は取り消せません。</p>
        )}
        {typedRequired && (
          <div className="mb-4">
            <label className="block text-xs text-paragraph/70 mb-1">
              続行するには「{options.typedConfirm!.keyword}」と入力してください
            </label>
            <input
              ref={inputRef}
              type="text"
              value={typedInput}
              onChange={e => setTypedInput(e.target.value)}
              placeholder={options.typedConfirm!.placeholder ?? options.typedConfirm!.keyword}
              className="w-full px-3 py-2 border border-secondary/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-alert/40"
              autoComplete="off"
            />
          </div>
        )}
        {longPressOn && (
          <p className="text-xs text-paragraph/60 mb-2 text-right" aria-live="polite">
            {longPressHint}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-2">
          <Button
            ref={cancelRef}
            variant="secondary"
            onClick={() => onResolve(false)}
          >
            {options.cancelLabel ?? 'キャンセル'}
          </Button>
          {longPressOn ? (
            <LongPressButton
              variant={confirmVariant}
              disabled={!typedOk}
              durationMs={longPressDuration}
              onConfirm={() => onResolve(true)}
            >
              {options.confirmLabel ?? 'OK'}
            </LongPressButton>
          ) : (
            <Button
              variant={confirmVariant}
              disabled={!typedOk}
              onClick={() => onResolve(true)}
            >
              {options.confirmLabel ?? 'OK'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 長押し確定ボタン。Codex レビュー反映版:
 * - pointer (touch/mouse/pen) 由来: 主ボタン (`e.button === 0 && e.isPrimary`) のみ受理。
 *   pointerdown で setPointerCapture して指ずれを追従し、40px を超える移動でキャンセル。
 *   pointer 由来の click は `suppressClickRef` で必ず握りつぶす (preventDefault に依存しない二重防御)。
 *   suppressClickRef は safeguard として 600ms で自動解除する(click が来なかったケースの取り残し防止)。
 * - キーボード / 支援技術: pointerdown を伴わない click (`e.detail === 0`) のみ許可して即確定。
 *   accidental touch 防止と a11y を両立する。
 * - 成立時 onConfirm → 呼び出し側でダイアログが閉じ、unmount effect で RAF/タイマーを解放。
 */
function LongPressButton({
  variant,
  disabled,
  durationMs,
  onConfirm,
  children,
}: {
  variant: ButtonVariant;
  disabled?: boolean;
  durationMs: number;
  onConfirm: () => void;
  children: ReactNode;
}) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const suppressTimerRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  /** pointer 位置ずれ許容 (px)。タブレットで指が自然に揺れても許容する */
  const MAX_DRIFT_PX = 40;
  /** click 抑止フラグの安全解除タイマー (ms)。pointer 経由の click は ≲ 数十msで来るので十分 */
  const SUPPRESS_WINDOW_MS = 600;

  const stopTimer = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setProgress(0);
    startPosRef.current = null;
  }, []);

  // unmount 時にタイマー/RAF/クリック抑止タイマーを必ず解放
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (suppressTimerRef.current !== null) window.clearTimeout(suppressTimerRef.current);
    };
  }, []);

  const armSuppressClick = () => {
    suppressClickRef.current = true;
    if (suppressTimerRef.current !== null) window.clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
      suppressTimerRef.current = null;
    }, SUPPRESS_WINDOW_MS);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    // 主ボタンのみ受理。右クリック・補助ボタン・補助ペンボタンは無視して通常ブラウザ挙動に任せる
    if (e.button !== 0 || !e.isPrimary) return;
    e.preventDefault();
    // pointer 由来の click は長押し成立可否にかかわらず握りつぶす(二重確定防止)
    armSuppressClick();
    activePointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 一部環境(古い WebView 等) で setPointerCapture が投げる場合は無視
    }
    startTimeRef.current = performance.now();
    startPosRef.current = { x: e.clientX, y: e.clientY };
    const tick = () => {
      const elapsed = performance.now() - startTimeRef.current;
      const ratio = Math.min(elapsed / durationMs, 1);
      setProgress(ratio);
      if (ratio < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setProgress(0);
        startPosRef.current = null;
        onConfirm();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    // long-press 中でないなら無視
    if (rafRef.current === null || !startPosRef.current) return;
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    if (dx * dx + dy * dy > MAX_DRIFT_PX * MAX_DRIFT_PX) {
      stopTimer();
    }
  };

  const handlePointerRelease = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;
    activePointerIdRef.current = null;
    stopTimer();
  };

  /**
   * setPointerCapture が失敗した古い WebView 等のフォールバック。
   * capture 成功環境では pointerleave は発火しない (pointer は button に tied) ので、
   * 正常環境の UX を損なわず、例外経路の暴走だけ防ぐ。
   */
  const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;
    activePointerIdRef.current = null;
    stopTimer();
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // pointer 経由の click (mouse/touch/pen) は必ずここで捨てる
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      if (suppressTimerRef.current !== null) {
        window.clearTimeout(suppressTimerRef.current);
        suppressTimerRef.current = null;
      }
      return;
    }
    // キーボード/支援技術経由の activation は e.detail === 0 で識別できる
    if (e.detail === 0) {
      onConfirm();
    }
  };

  return (
    <Button
      variant={variant}
      disabled={disabled}
      className="relative overflow-hidden select-none"
      style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerRelease}
      onPointerCancel={handlePointerRelease}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-white/30 pointer-events-none"
        style={{ width: `${progress * 100}%`, transition: 'none' }}
      />
      <span className="relative z-10">{children}</span>
    </Button>
  );
}
