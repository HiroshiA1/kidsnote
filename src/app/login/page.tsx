'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signInWithGoogle } from '@/lib/supabase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    const { error: authError } = await signInWithGoogle();
    if (authError) {
      setError(`Googleログインに失敗しました: ${authError.message}`);
      setGoogleLoading(false);
    }
    // 成功時は Google にリダイレクトされるため state 解除は不要
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await signIn(email, password);

    if (authError) {
      setError('メールアドレスまたはパスワードが正しくありません');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-surface rounded-2xl shadow-lg p-8 border border-secondary/20">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="w-12 h-12 bg-gradient-to-br from-button to-tertiary rounded-xl flex items-center justify-center text-white text-xl font-bold">
              K
            </span>
            <div>
              <h1 className="text-2xl font-bold text-headline">KidsNote</h1>
              <p className="text-xs text-paragraph/60">保育業務支援システム</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-paragraph mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 bg-background border border-secondary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-button/50 focus:border-button text-headline placeholder-paragraph/40"
                placeholder="example@kidsnote.jp"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-paragraph mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 bg-background border border-secondary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-button/50 focus:border-button text-headline placeholder-paragraph/40"
                placeholder="パスワードを入力"
              />
            </div>

            {error && (
              <div className="text-sm text-alert bg-alert/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 bg-button text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          {/* 区切り */}
          <div className="my-5 flex items-center gap-3 text-xs text-paragraph/50">
            <span className="flex-1 h-px bg-secondary/30" />
            <span>または</span>
            <span className="flex-1 h-px bg-secondary/30" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full py-2.5 bg-surface border border-secondary/30 text-headline rounded-lg font-medium hover:bg-secondary/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>{googleLoading ? 'リダイレクト中...' : 'Googleでログイン'}</span>
          </button>

          <p className="mt-6 text-xs text-center text-paragraph/50">
            アカウントをお持ちでない場合は管理者にお問い合わせください
          </p>
        </div>
      </div>
    </div>
  );
}
