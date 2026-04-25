'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Staff, StaffStatus } from '@/components/AppLayout';
import { mapSupabaseStaff, SupabaseStaffRow } from '@/lib/staffMapper';

/**
 * Supabase 上の staff を canonical source として取得する hook。
 *
 * 設計意図:
 * - staff は画面間で同じ state を見せるため、fetch を単一の場所 (AppLayout) に集約する
 * - status を明示 (`loading` | `ready` | `error` | `unauthenticated`) して、
 *   呼び出し側が「何を描画するか」を決め打ちできるようにする
 * - `initialStaff` のような local seed fallback は持たない(偽データを表示しない)
 * - 追加/更新後の再取得用に `refetch` を公開
 */
export function useSupabaseStaff() {
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [status, setStatus] = useState<StaffStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  // StrictMode 二重 mount 下で初回 fetch が競合しないように直近要求を識別
  const reqIdRef = useRef(0);

  const refetch = useCallback(async () => {
    const myReqId = ++reqIdRef.current;
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/staff', { cache: 'no-store' });
      if (reqIdRef.current !== myReqId) return; // 古いレスポンスは捨てる
      if (res.status === 401) {
        setStaff(null);
        setStatus('unauthenticated');
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? '取得失敗');
      }
      const json = (await res.json()) as { staff: SupabaseStaffRow[] };
      if (reqIdRef.current !== myReqId) return;
      setStaff(json.staff.map(mapSupabaseStaff));
      setStatus('ready');
    } catch (err) {
      if (reqIdRef.current !== myReqId) return;
      setError(err instanceof Error ? err.message : '取得失敗');
      setStaff(null);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { staff, status, error, refetch };
}
