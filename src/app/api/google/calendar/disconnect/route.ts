import { NextResponse } from 'next/server';
import { resolveCallerMembership } from '@/lib/api/membership';
import { createAdminClient } from '@/lib/supabase/admin';
import { revokeGoogleToken } from '@/lib/googleOAuth';

/**
 * POST /api/google/calendar/disconnect
 *
 * 自分自身の Google 連携を解除。
 * - Google 側で refresh_token を revoke (失敗してもアプリ側 DB を消すのを優先)
 * - staff レコードの google_email / google_refresh_token をクリア
 */
export async function POST(request: Request) {
  const r = await resolveCallerMembership(request);
  if (r.error) return r.error;
  const { membership } = r;

  if (!membership.staffId) {
    return NextResponse.json(
      { error: '自分の職員プロフィールが見つかりません' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // 既存の refresh_token を取得 (revoke 用)
  const { data: existing, error: selErr } = await admin
    .from('staff')
    .select('google_refresh_token')
    .eq('id', membership.staffId)
    .eq('organization_id', membership.organizationId)
    .single();

  if (selErr) {
    return NextResponse.json({ error: `スタッフ情報の取得に失敗しました: ${selErr.message}` }, { status: 500 });
  }

  if (existing?.google_refresh_token) {
    await revokeGoogleToken(existing.google_refresh_token);
  }

  const { error: updateErr } = await admin
    .from('staff')
    .update({ google_email: null, google_refresh_token: null })
    .eq('id', membership.staffId)
    .eq('organization_id', membership.organizationId);

  if (updateErr) {
    return NextResponse.json({ error: `連携解除に失敗しました: ${updateErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
