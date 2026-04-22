'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useApp } from './AppLayout';
import { topNavItems, navSections } from '@/lib/constants/navigation';

interface Crumb {
  label: string;
  href?: string; // 最後のcrumbは href 無し(現在地)
}

/** navigation.ts の NavItem を href→label の flat map にする */
function buildStaticLabelMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of topNavItems) map.set(item.href, item.label);
  for (const section of navSections) {
    for (const item of section.items) map.set(item.href, item.label);
  }
  // トップ
  map.set('/', 'ダッシュボード');
  return map;
}

const STATIC_LABELS = buildStaticLabelMap();

/**
 * pathname から階層化されたパンくずを自動導出。
 * 例: /children/abc123 → [ダッシュボード, 園児一覧, 太郎さん]
 *     /records/growth → [ダッシュボード, 成長記録]
 */
export function Breadcrumbs() {
  const pathname = usePathname();
  const { children: childrenData, staff } = useApp();

  const crumbs = useMemo<Crumb[]>(() => {
    if (!pathname || pathname === '/') {
      return [{ label: 'ダッシュボード' }];
    }

    const segments = pathname.split('/').filter(Boolean);
    const crumbs: Crumb[] = [{ label: 'ダッシュボード', href: '/' }];

    let accumulated = '';
    for (let i = 0; i < segments.length; i++) {
      accumulated += '/' + segments[i];
      const isLast = i === segments.length - 1;

      // 動的 [id] を検出: 直前の静的セグメントが children/staff の場合
      const prev = segments[i - 1];
      const seg = segments[i];

      let label: string | null = STATIC_LABELS.get(accumulated) ?? null;

      if (!label) {
        if (prev === 'children') {
          const child = childrenData.find(c => c.id === seg);
          if (child) {
            const name = `${child.lastNameKanji || child.lastName} ${child.firstNameKanji || child.firstName}`.trim();
            label = name ? `${name}さん` : '園児詳細';
          } else {
            label = '園児詳細';
          }
        } else if (prev === 'staff' && seg !== 'attendance' && seg !== 'shifts' && seg !== 'coverage') {
          const s = staff.find(st => st.id === seg);
          label = s ? `${s.lastName} ${s.firstName}` : '職員詳細';
        } else if (seg === 'record') {
          label = '記録';
        } else {
          // fallback: セグメントそのまま(露出防止のため短縮)
          label = seg.length > 16 ? seg.slice(0, 16) + '…' : seg;
        }
      }

      crumbs.push({ label, href: isLast ? undefined : accumulated });
    }

    return crumbs;
  }, [pathname, childrenData, staff]);

  // ダッシュボードのみなら表示しない(冗長)
  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="現在地" className="max-w-6xl mx-auto px-3 sm:px-6 pt-3 pb-1">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-paragraph/70">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && (
                <svg className="w-3 h-3 text-paragraph/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
              {isLast || !c.href ? (
                <span className="text-headline font-medium" aria-current={isLast ? 'page' : undefined}>
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="hover:text-button transition-colors">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
