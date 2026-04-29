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
  const { currentUserRole, currentStaffId, staff, fiscalYear, setFiscalYear, settings, sidebarPosition } = useApp();
  // 現在ログイン中のユーザー (Supabase staff から導出)。staff 取得前/未ログイン時は null
  const currentStaff = currentStaffId ? staff.find(s => s.id === currentStaffId) ?? null : null;
  const hiddenItems = settings.menuVisibility?.hiddenItems ?? [];
  const yearOptions = getFiscalYearOptions();
  // モバイルの drawer は常に左から出す (Codex 合意: 利き手切替は md+ の固定レイアウトのみ)
  // md+ で sidebarPosition='right' のときだけ右端に固定し直す
  const isRight = sidebarPosition === 'right';

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    // /children は /children/considerations および /children/archived にマッチさせない
    if (href === '/children') return pathname === '/children' || (pathname.startsWith('/children/') && !pathname.startsWith('/children/considerations') && !pathname.startsWith('/children/archived'));
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
        className={`fixed top-0 h-full bg-surface border-secondary/20 flex flex-col z-40 transition-all duration-300
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:z-20
          left-0 ${isRight ? 'md:left-auto md:right-0' : ''}
          border-r ${isRight ? 'md:border-r-0 md:border-l' : ''}
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
          aria-label={isCollapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
          className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-secondary/20 transition-colors text-paragraph/60 hover:text-paragraph"
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

      {/* 現在のアカウント表示 — 別アプリと混同しないよう常時可視化 */}
      {currentStaff && !isCollapsed && (
        <div className="px-4 py-3 border-b border-secondary/10">
          <p className="text-[10px] text-paragraph/50 font-medium mb-1.5 uppercase tracking-wide">ログイン中</p>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-button/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-button">
                {(currentStaff.lastName || currentStaff.firstName || '?').charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-headline truncate">
                {currentStaff.lastName} {currentStaff.firstName}
              </p>
              <p className="text-xs text-paragraph/60 truncate">{currentStaff.role}</p>
            </div>
          </div>
        </div>
      )}
      {currentStaff && isCollapsed && (
        <div
          className="p-3 border-b border-secondary/10 flex justify-center"
          title={`${currentStaff.lastName} ${currentStaff.firstName}(${currentStaff.role})`}
        >
          <div className="w-9 h-9 bg-button/10 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-button">
              {(currentStaff.lastName || currentStaff.firstName || '?').charAt(0)}
            </span>
          </div>
        </div>
      )}

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
          {topNavItems.filter(item => !hiddenItems.includes(item.href)).map(item => (
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
          let items = section.roleFiltered
            ? filterByRole(section.items, currentUserRole)
            : section.items;
          items = items.filter(item => !hiddenItems.includes(item.href));
          if (items.length === 0) return null;
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

    </aside>
    </>
  );
}
