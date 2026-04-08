'use client';

import { useState, useEffect } from 'react';
import { useApp } from './AppLayout';
import {
  isGoogleCalendarConfigured,
  isConnected,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  pushEventToGoogle,
} from '@/lib/googleCalendar';

export function GoogleCalendarConnect() {
  const { calendarEvents, updateCalendarEvent, addToast } = useApp();
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);

  // 初期状態反映（メモリトークンなので基本は未接続）
  useEffect(() => {
    setConnected(isConnected());
  }, []);

  if (!isGoogleCalendarConfigured()) {
    return (
      <span
        className="text-[10px] text-paragraph/50 px-2 py-1 border border-dashed border-secondary/30 rounded"
        title="NEXT_PUBLIC_GOOGLE_CLIENT_ID と NEXT_PUBLIC_GOOGLE_CALENDAR_ID を設定してください"
      >
        Google未設定
      </span>
    );
  }

  const handleConnect = async () => {
    setBusy(true);
    try {
      await connectGoogleCalendar();
      setConnected(true);
      addToast({ type: 'success', message: 'Google Calendar に接続しました' });
    } catch (e) {
      addToast({ type: 'error', message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogleCalendar();
    setConnected(false);
    addToast({ type: 'info', message: 'Google Calendar から切断しました' });
  };

  const handleSyncAll = async () => {
    if (!connected) return;
    setBusy(true);
    let ok = 0;
    let ng = 0;
    for (const ev of calendarEvents) {
      if (ev.googleEventId) continue;
      try {
        const id = await pushEventToGoogle(ev);
        updateCalendarEvent({ ...ev, googleEventId: id });
        ok++;
      } catch {
        ng++;
      }
    }
    addToast({
      type: ng === 0 ? 'success' : 'error',
      message: `同期完了: 成功 ${ok}件 / 失敗 ${ng}件`,
    });
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-1">
      {connected ? (
        <>
          <button
            onClick={handleSyncAll}
            disabled={busy}
            className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-50"
            title="未同期の予定をGoogleにエクスポート"
          >
            {busy ? '同期中...' : '一括同期'}
          </button>
          <button
            onClick={handleDisconnect}
            className="text-xs px-2 py-1 rounded border border-secondary/30 hover:bg-secondary/20"
          >
            切断
          </button>
        </>
      ) : (
        <button
          onClick={handleConnect}
          disabled={busy}
          className="text-xs px-3 py-1.5 rounded border border-secondary/30 hover:bg-secondary/20 disabled:opacity-50 flex items-center gap-1"
        >
          <svg className="w-3 h-3" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M45 24c0-1.5-.1-2.9-.4-4.3H24v8.1h11.8c-.5 2.8-2.1 5.2-4.5 6.8v5.6h7.3C42.9 36.2 45 30.6 45 24z"/>
            <path fill="#34A853" d="M24 45c6.1 0 11.2-2 14.9-5.4l-7.3-5.6c-2 1.4-4.6 2.2-7.6 2.2-5.8 0-10.8-3.9-12.6-9.2H4v5.8C7.8 40.1 15.3 45 24 45z"/>
            <path fill="#FBBC04" d="M11.4 27c-.4-1.4-.7-2.8-.7-4.3s.2-2.9.7-4.3v-5.8H4C2.2 16.2 1 20 1 24c0 4 1.2 7.8 3 11.1l7.4-8.1z"/>
            <path fill="#EA4335" d="M24 9.5c3.3 0 6.3 1.1 8.6 3.4l6.5-6.5C35.2 2.5 30.1 0 24 0 15.3 0 7.8 4.9 4 12.1l7.4 5.8C13.2 13.4 18.2 9.5 24 9.5z"/>
          </svg>
          Google連携
        </button>
      )}
    </div>
  );
}
