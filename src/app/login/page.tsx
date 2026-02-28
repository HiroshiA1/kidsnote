'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/supabase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
              disabled={loading}
              className="w-full py-2.5 bg-button text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-paragraph/50">
            アカウントをお持ちでない場合は管理者にお問い合わせください
          </p>
        </div>
      </div>
    </div>
  );
}
