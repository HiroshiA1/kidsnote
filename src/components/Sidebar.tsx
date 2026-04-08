'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useApp } from './AppLayout';
import { getFiscalYearOptions, getCurrentFiscalYear } from '@/lib/fiscalYear';
import { hasMinRole, type AppRole } from '@/lib/supabase/auth';
import { topNavItems, navSections, type NavItem, type NavSection } from '@/lib/constants/navigation';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

/** NavItem をロールでフィルタ */
function filterByRole(items: NavItem[], role: AppRole | null): NavItem[] {
  if (!role) return items;
  return items.filter(item => {
    if (!item.minRole) return true;
    return hasMinRole(role, item.minRole);
  });
}

/** SVGアイコン */
function NavIcon({ paths }: { paths: string[] }) {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {paths.map((d, i) => (
        <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
      ))}
    </svg>
  );
}

/** 準備中バッジ */
function WipBadge() {
  return (
    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-paragraph/10 text-paragraph/50 whitespace-nowrap">
      準備中
    </span>
  );
}

/** ナビゲーションアイテム */
function NavItemLink({
  item,
  isActive,
  isCollapsed,
  large,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  large?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`flex items-center gap-3 px-3 ${large ? 'py-2.5' : 'py-2'} rounded-lg transition-colors ${
          isActive
            ? 'bg-button/10 text-button font-medium'
            : 'text-paragraph hover:bg-secondary/20'
        } ${isCollapsed ? 'justify-center' : ''}`}
        title={isCollapsed ? item.label : undefined}
      >
        <NavIcon paths={item.iconPaths} />
        {!isCollapsed && <span className={large ? '' : 'text-sm'}>{item.label}</span>}
        {!isCollapsed && item.wip && <WipBadge />}
      </Link>
    </li>
  );
}

/** 折りたたみ可能なセクション */
function CollapsibleSection({
  section,
  isCollapsed,
  items,
  isActive,
  checkItemActive,
  onNavigate,
}: {
  section: NavSection;
  isCollapsed: boolean;
  items: NavItem[];
  isActive: boolean;
  checkItemActive: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  const [expanded, setExpanded] = useState(section.defaultExpanded ?? true);

  return (
    <div className="mt-4">
      {!isCollapsed ? (
        section.alwaysExpanded ? (
          <p className="px-3 py-2 text-xs font-medium text-paragraph/60 uppercase tracking-wider">
            {section.label}
          </p>
        ) : (
          <button
            onClick={() => setExpanded(!expanded)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium uppercase tracking-wider ${
              isActive ? 'text-button' : 'text-paragraph/60'
            }`}
          >
            <span>{section.label}</span>
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )
      ) : (
        <div className="h-px bg-secondary/30 mx-2 my-2" />
      )}
      {(expanded || section.alwaysExpanded || isCollapsed) && (
        <ul className="mt-1 space-y-1">
          {items.map(item => (
            <NavItemLink
              key={item.href}
              item={item}
              isActive={checkItemActive(item.href)}
              isCollapsed={isCollapsed}
              large={section.alwaysExpanded}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export function Sidebar({ isCollapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentUserRole, fiscalYear, setFiscalYear } = useApp();
  const yearOptions = getFiscalYearOptions();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    // /children は /children/considerations にマッチさせない
    if (href === '/children') return pathname === '/children' || (pathname.startsWith('/children/') && !pathname.startsWith('/children/considerations'));
    return pathname.startsWith(href);
  };

  const isSectionActive = (section: NavSection) => {
    const prefixes = Array.isArray(section.activePrefix)
      ? section.activePrefix
      : [section.activePrefix];
    return prefixes.some(p => pathname.startsWith(p));
  };

  return (
    <>
      {/* モバイルオーバーレイ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-full bg-surface border-r border-secondary/20 flex flex-col z-40 transition-all duration-300
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:z-20
        `}
      >
      {/* ヘッダー */}
      <div className={`p-4 border-b border-secondary/20 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-button to-tertiary rounded-lg flex items-center justify-center text-white text-sm font-bold">
              K
            </span>
            <div>
              <h1 className="text-lg font-bold text-headline">KidsNote</h1>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-secondary/20 transition-colors text-paragraph/60 hover:text-paragraph"
        >
          {isCollapsed ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* 年度切替 */}
      {!isCollapsed && (
        <div className="px-4 pt-3 pb-2 border-b border-secondary/10">
          <label className="block text-[10px] text-paragraph/50 font-medium mb-1 uppercase tracking-wide">年度</label>
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(Number(e.target.value))}
            className="w-full px-2 py-1.5 bg-surface border border-secondary/30 rounded-md text-sm text-headline focus:outline-none focus:ring-2 focus:ring-button/30"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}年度{y === getCurrentFiscalYear() ? '（当年度）' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ナビゲーション */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {/* トップレベルナビ */}
        <ul className="space-y-1">
          {topNavItems.map(item => (
            <NavItemLink
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              isCollapsed={isCollapsed}
              large
              onNavigate={onMobileClose}
            />
          ))}
        </ul>

        {/* セクション */}
        {navSections.map(section => {
          const items = section.roleFiltered
            ? filterByRole(section.items, currentUserRole)
            : section.items;
          return (
            <CollapsibleSection
              key={section.key}
              section={section}
              isCollapsed={isCollapsed}
              items={items}
              isActive={isSectionActive(section)}
              checkItemActive={isActive}
              onNavigate={onMobileClose}
            />
          );
        })}
      </nav>

      {/* AIモードインジケーター */}
      {!isCollapsed && (
        <div className="p-3 border-t border-secondary/20">
          <div className="flex items-center gap-2 px-3 py-2 bg-tertiary/20 rounded-lg">
            <span className="w-2 h-2 bg-tertiary rounded-full animate-pulse" />
            <span className="text-xs text-paragraph">AI入力モード</span>
          </div>
        </div>
      )}
    </aside>
    </>
  );
}
