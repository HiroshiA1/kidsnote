import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/AppLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KidsNote - 幼稚園業務管理システム",
  description: "保育の瞬間を逃さず記録し、AIが全ての事務処理を代行する",
  openGraph: {
    title: "KidsNote - 幼稚園業務管理システム",
    description: "保育の瞬間を逃さず記録し、AIが全ての事務処理を代行する",
    type: "website",
    locale: "ja_JP",
    siteName: "KidsNote",
  },
  twitter: {
    card: "summary_large_image",
    title: "KidsNote - 幼稚園業務管理システム",
    description: "保育の瞬間を逃さず記録し、AIが全ての事務処理を代行する",
  },
};

/**
 * ハイドレート前に localStorage からテーマ/サイドバー配置を読み取り、
 * <html> の data-theme / data-sidebar 属性を設定することで初期描画の "flash" を回避する。
 * - data-theme: 'light' | 'dark' | 'auto'(未設定扱い)
 * - data-sidebar: 'left' | 'right'(未設定時は 'left' 相当)
 *   サイドバー位置は現ログイン中スタッフ(kidsnote_current_staff_id)別に
 *   'kidsnote:sidebar-position:${staffId}' で保存する設計。ログイン前は 'default' キー。
 */
const prefInitScript = `
(function() {
  try {
    var t = localStorage.getItem('kidsnote:theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    }
    var sidRaw = localStorage.getItem('kidsnote_current_staff_id');
    var sid = null;
    if (sidRaw) {
      try { sid = JSON.parse(sidRaw); } catch (_) { sid = null; }
    }
    var pos = null;
    if (sid) pos = localStorage.getItem('kidsnote:sidebar-position:' + sid);
    if (pos !== 'left' && pos !== 'right') {
      pos = localStorage.getItem('kidsnote:sidebar-position:default');
    }
    document.documentElement.setAttribute('data-sidebar', pos === 'right' ? 'right' : 'left');
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
