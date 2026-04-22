'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from './Button';

export interface InfluenceScopeItem {
  label: string;
  count: number;
  unit?: string;
}

export interface TypedConfirmOptions {
  keyword: string;
  placeholder?: string;
}

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'info';
  influenceScope?: InfluenceScopeItem[];
  typedConfirm?: TypedConfirmOptions;
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
  const confirmVariant = isDanger ? 'destructive' : 'commit';
  const typedRequired = !!options.typedConfirm;
  // 厳密一致。空白混入を弾くことで「誤ってスペースで通る」事故を防ぐ
  const typedOk = !typedRequired || typedInput === options.typedConfirm!.keyword;

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
        <div className="flex justify-end gap-2 mt-2">
          <Button
            ref={cancelRef}
            variant="secondary"
            onClick={() => onResolve(false)}
          >
            {options.cancelLabel ?? 'キャンセル'}
          </Button>
          <Button
            variant={confirmVariant}
            disabled={!typedOk}
            onClick={() => onResolve(true)}
          >
            {options.confirmLabel ?? 'OK'}
          </Button>
        </div>
      </div>
    </div>
  );
}
