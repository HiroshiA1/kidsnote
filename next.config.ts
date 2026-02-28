import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // すべてのルートに適用
        source: "/(.*)",
        headers: [
          // クリックジャッキング防止
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // MIME スニッフィング防止
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Referrer 情報の制限
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // XSS フィルター (レガシーブラウザ向け)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Permissions Policy（カメラ・マイク等の不要な権限を無効化）
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // HTTPS 強制 (本番環境でのみ有効)
          ...(isProduction
            ? [
              {
                key: "Strict-Transport-Security",
                value: "max-age=63072000; includeSubDomains; preload",
              },
            ]
            : []),
          // Content Security Policy
          // - 'self': 同一オリジンのみ許可
          // - Google Fonts / Gemini API のみ外部接続を許可
          // - style-src に 'unsafe-inline' を一時許可（Tailwind のインラインスタイル対応）
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js の動作に必要
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://generativelanguage.googleapis.com https://*.supabase.co",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
