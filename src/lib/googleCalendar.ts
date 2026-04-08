/**
 * Google Calendar 連携（クライアントサイド）
 *
 * - Google Identity Services (GIS) Token Client を使ってアクセストークンを取得
 * - 取得したトークンはメモリのみ保持（ページリロードで再認証が必要）
 * - MVP: アプリ → Google の push only
 */

import { CalendarEvent } from '@/types/calendar';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
    };
  }
}

let accessToken: string | null = null;
let tokenExpiresAt = 0;
let gisLoaded = false;

function loadGisScript(): Promise<void> {
  if (gisLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${GIS_SRC}"]`)) {
      gisLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('GIS スクリプトの読み込みに失敗しました'));
    document.head.appendChild(script);
  });
}

export function isGoogleCalendarConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && !!process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;
}

export function getCalendarId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID ?? 'primary';
}

export function isConnected(): boolean {
  return !!accessToken && Date.now() < tokenExpiresAt;
}

/** ユーザー操作起点で呼ぶ（アクセストークン取得） */
export async function connectGoogleCalendar(): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID が未設定です');
  await loadGisScript();
  const google = window.google;
  if (!google) throw new Error('Google Identity Services が利用できません');

  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error ?? 'トークン取得に失敗しました'));
          return;
        }
        accessToken = response.access_token;
        // GIS のアクセストークンは通常 3600 秒。安全マージン 60 秒。
        tokenExpiresAt = Date.now() + (3600 - 60) * 1000;
        resolve();
      },
    });
    client.requestAccessToken({ prompt: 'consent' });
  });
}

export function disconnectGoogleCalendar(): void {
  accessToken = null;
  tokenExpiresAt = 0;
}

/** CalendarEvent を Google Calendar API 形式に変換 */
function toGoogleEvent(ev: CalendarEvent): Record<string, unknown> {
  if (ev.allDay || !ev.startTime) {
    return {
      summary: ev.title,
      description: [ev.description, ev.notesForStaff && `【申し送り】${ev.notesForStaff}`, ev.preparationNotes && `【事前準備】${ev.preparationNotes}`, ev.handoverNotes && `【引き継ぎ】${ev.handoverNotes}`].filter(Boolean).join('\n\n'),
      location: ev.location,
      start: { date: ev.date },
      end: { date: ev.date },
      status: ev.status === 'cancelled' ? 'cancelled' : 'confirmed',
    };
  }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    summary: ev.title,
    description: [ev.description, ev.notesForStaff && `【申し送り】${ev.notesForStaff}`, ev.preparationNotes && `【事前準備】${ev.preparationNotes}`, ev.handoverNotes && `【引き継ぎ】${ev.handoverNotes}`].filter(Boolean).join('\n\n'),
    location: ev.location,
    start: { dateTime: `${ev.date}T${ev.startTime}:00`, timeZone: tz },
    end: { dateTime: `${ev.date}T${ev.endTime ?? ev.startTime}:00`, timeZone: tz },
    status: ev.status === 'cancelled' ? 'cancelled' : 'confirmed',
  };
}

async function apiFetch(path: string, init: RequestInit): Promise<Response> {
  if (!isConnected()) throw new Error('Google Calendar に未接続です');
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google API エラー (${res.status}): ${text}`);
  }
  return res;
}

/** 予定を Google Calendar に作成。googleEventId を返す。 */
export async function pushEventToGoogle(ev: CalendarEvent): Promise<string> {
  const calendarId = encodeURIComponent(getCalendarId());
  const res = await apiFetch(`/calendars/${calendarId}/events`, {
    method: 'POST',
    body: JSON.stringify(toGoogleEvent(ev)),
  });
  const data = await res.json();
  return data.id as string;
}

export async function updateGoogleEvent(ev: CalendarEvent, googleEventId: string): Promise<void> {
  const calendarId = encodeURIComponent(getCalendarId());
  await apiFetch(`/calendars/${calendarId}/events/${encodeURIComponent(googleEventId)}`, {
    method: 'PUT',
    body: JSON.stringify(toGoogleEvent(ev)),
  });
}

export async function deleteGoogleEvent(googleEventId: string): Promise<void> {
  const calendarId = encodeURIComponent(getCalendarId());
  await apiFetch(`/calendars/${calendarId}/events/${encodeURIComponent(googleEventId)}`, {
    method: 'DELETE',
  });
}
