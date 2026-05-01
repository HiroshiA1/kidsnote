import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveCallerMembership } from '@/lib/api/membership';

/**
 * POST /api/staff/[id]/restore — 退職処理の取り消し。
 *
 * 設計:
 * - staff.archived_at と archive_reason をクリアするのみ。
 * - membership (= ログイン用アカウント) は復元しない: 復職時の再ログイン手段は別途
 *   `POST /api/staff/[id]/account` で管理者がメール+パスワードを再発行する想定。
 *   理由: 旧 membership を取って置く設計は archived_at だけでは表現しきれず、
 *   退職時のロール (主任→担任など降格運用) を勝手に復元するのも危険なため。
 * - 認可: admin のみ。
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: staffId } = await params;

  const r = await resolveCallerMembership(request);
  if (r.error) return r.error;
  const { membership: callerMembership } = r;
  if (callerMembership.role !== 'admin') {
    return NextResponse.json({ error: '復職処理は管理者のみ実行できます' }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: target, error: targetErr } = await admin
    .from('staff')
    .select('id, organization_id, archived_at')
    .eq('id', staffId)
    .single();

  if (targetErr || !target) {
    return NextResponse.json({ error: '対象スタッフが見つかりません' }, { status: 404 });
  }
  if (target.organization_id !== callerMembership.organizationId) {
    return NextResponse.json({ error: '対象スタッフが見つかりません' }, { status: 404 });
  }
  if (!target.archived_at) {
    return NextResponse.json({ error: 'このスタッフは退職処理されていません' }, { status: 409 });
  }

  const { error: restoreErr } = await admin
    .from('staff')
    .update({ archived_at: null, archive_reason: null })
    .eq('id', staffId);

  if (restoreErr) {
    return NextResponse.json(
      { error: `復職処理に失敗しました: ${restoreErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
