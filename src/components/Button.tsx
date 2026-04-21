'use client';

import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';

/**
 * ボタンの意味論カテゴリ。Codex×CC合意(2026-04-21)に基づく:
 * - destructive: 結果・記録・入力済み内容を失わせる (削除・退園・破棄) → 48px, alert色
 * - commit: 状態を永続化・外部送信・AI結果採用 (保存・送信・確定) → 48px, button色
 * - secondary: 永続的結果を残さない (切替・表示・閉じる・展開・選択) → 44px
 */
export type ButtonVariant = 'destructive' | 'commit' | 'secondary';
export type ButtonSize = 'md' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  destructive:
    'bg-alert text-white hover:bg-alert/90 disabled:opacity-50 disabled:cursor-not-allowed',
  commit:
    'bg-button text-white hover:bg-button/90 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-surface text-paragraph border border-secondary/40 hover:bg-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed',
};

const sizeClasses: Record<ButtonSize, Record<ButtonVariant, string>> = {
  md: {
    destructive: 'min-h-12 min-w-12 px-5 text-sm font-medium',
    commit: 'min-h-12 min-w-12 px-5 text-sm font-medium',
    secondary: 'min-h-11 min-w-11 px-4 text-sm',
  },
  icon: {
    destructive: 'w-12 h-12',
    commit: 'w-12 h-12',
    secondary: 'w-11 h-11',
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size = 'md', className = '', children, ...rest },
  ref,
) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-button/40';
  return (
    <button
      ref={ref}
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size][variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});
