'use client';

import { useApp } from './AppLayout';
import { IntentResult, GrowthData, IncidentData, HandoverData, ChildUpdateData, AddChildData, AddStaffData, RuleQueryData, DeleteChildData, AddRuleData, DeleteRuleData, UpdateRuleData, AddCalendarEventData } from '@/types/intent';
import { ChildLinks } from './ChildLink';
import { severityLabels, severityColors, genderLabels, fieldLabels } from '@/lib/formatters';

type RuleAnswer = { answer: string; referencedRuleIds: string[] };

interface IntentContentRendererProps {
  result: IntentResult;
  mode: 'full' | 'compact';
  linkedChildIds?: string[];
  ruleAnswer?: RuleAnswer;
}

function GrowthContent({ data, linkedChildIds, compact }: { data: GrowthData; linkedChildIds?: string[]; compact: boolean }) {
  return (
    <div className={`${compact ? 'text-sm space-y-1' : 'space-y-2'}`}>
      {(linkedChildIds && linkedChildIds.length > 0) ? (
        <p className={compact ? '' : 'text-sm'}>
          <span className="font-medium">{compact ? '対象:' : '対象園児:'}</span> <ChildLinks childIds={linkedChildIds} />
        </p>
      ) : data.child_names.length > 0 && (
        <p className={compact ? '' : 'text-sm'}>
          <span className="font-medium">{compact ? '対象:' : '対象園児:'}</span> {data.child_names.join('、')}
        </p>
      )}
      <p className={compact ? '' : 'text-sm'}>{data.summary}</p>
      {data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.tags.map((tag, i) => (
            <span key={i} className={`text-xs ${compact ? 'px-1.5 py-0.5' : 'px-2 py-0.5'} bg-tertiary/50 rounded-full`}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function IncidentContent({ data, linkedChildIds, compact }: { data: IncidentData; linkedChildIds?: string[]; compact: boolean }) {
  return (
    <div className={`${compact ? 'text-sm space-y-1' : 'space-y-2'}`}>
      <div className="flex items-center gap-2">
        <span className={`text-xs ${compact ? 'px-1.5 py-0.5' : 'px-2 py-0.5'} rounded-full ${severityColors[data.severity]} text-headline`}>
          {severityLabels[data.severity]}
        </span>
        {linkedChildIds && linkedChildIds.length > 0 ? (
          <span className={`${compact ? '' : 'text-sm'} font-medium`}><ChildLinks childIds={linkedChildIds} /></span>
        ) : data.child_name && (
          <span className={`${compact ? '' : 'text-sm'} font-medium`}>{data.child_name}</span>
        )}
      </div>
      <p className={compact ? '' : 'text-sm'}>{data.description}</p>
      {!compact && (
        <div className="flex gap-4 text-xs text-paragraph/80">
          <span>場所: {data.location}</span>
          <span>要因: {data.cause}</span>
        </div>
      )}
    </div>
  );
}

function HandoverContent({ data, compact }: { data: HandoverData; compact: boolean }) {
  return (
    <div className={`${compact ? 'text-sm space-y-1' : 'space-y-2'}`}>
      <div className="flex items-center gap-2">
        {data.urgent && (
          <span className={`text-xs ${compact ? 'px-1.5 py-0.5' : 'px-2 py-0.5'} bg-alert rounded-full text-white`}>
            至急
          </span>
        )}
        <span className="text-xs text-paragraph/80">宛先: {data.target}</span>
      </div>
      <p className={compact ? '' : 'text-sm'}>{data.message}</p>
    </div>
  );
}

function ChildUpdateContent({ data, linkedChildIds, compact }: { data: ChildUpdateData; linkedChildIds?: string[]; compact: boolean }) {
  return (
    <div className={compact ? 'text-sm' : 'space-y-2'}>
      <p className={compact ? '' : 'text-sm'}>
        <span className="font-medium">
          {linkedChildIds && linkedChildIds.length > 0
            ? <ChildLinks childIds={linkedChildIds} />
            : data.child_name}
        </span>の{fieldLabels[data.field]}を更新
      </p>
      <p className={`${compact ? 'bg-surface/50 p-1.5 rounded mt-1 text-xs' : 'text-sm bg-surface/50 p-2 rounded'}`}>
        {data.new_value}
      </p>
    </div>
  );
}

function AddChildContent({ data, compact }: { data: AddChildData; compact: boolean }) {
  return (
    <div className={`${compact ? 'text-sm space-y-1' : 'space-y-2'}`}>
      <p className={compact ? '' : 'text-sm'}>
        <span className={`font-medium ${compact ? '' : 'text-lg'}`}>{data.name}</span>
        {data.gender && (
          <span className={`${compact ? 'ml-1 text-xs px-1.5' : 'ml-2 text-xs px-2'} py-0.5 bg-button/20 rounded-full`}>
            {genderLabels[data.gender]}
          </span>
        )}
      </p>
      <div className={`${compact ? 'text-xs text-paragraph/80 flex gap-3' : 'grid grid-cols-2 gap-2 text-xs text-paragraph/80'}`}>
        {data.class_name && <span>クラス: {data.class_name}</span>}
        {data.birth_date && <span>生年月日: {data.birth_date}</span>}
      </div>
      {!compact && data.allergies && data.allergies.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-paragraph/60">アレルギー:</span>
          {data.allergies.map((allergy, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-alert/20 rounded-full">{allergy}</span>
          ))}
        </div>
      )}
      {!compact && data.notes && (
        <p className="text-xs text-paragraph/70 bg-surface/50 p-2 rounded">{data.notes}</p>
      )}
    </div>
  );
}

function AddStaffContent({ data, compact }: { data: AddStaffData; compact: boolean }) {
  return (
    <div className={`${compact ? 'text-sm space-y-1' : 'space-y-2'}`}>
      <p className={compact ? '' : 'text-sm'}>
        <span className={`font-medium ${compact ? '' : 'text-lg'}`}>{data.name}</span>
        {data.role && (
          <span className={`${compact ? 'ml-1 text-xs px-1.5' : 'ml-2 text-xs px-2'} py-0.5 bg-tertiary/30 rounded-full`}>
            {data.role}
          </span>
        )}
      </p>
      <div className={`${compact ? 'text-xs text-paragraph/80 flex gap-3' : 'grid grid-cols-2 gap-2 text-xs text-paragraph/80'}`}>
        {data.class_name && <span>{compact ? '担当:' : '担当クラス:'} {data.class_name}</span>}
        {data.contact && <span>連絡先: {data.contact}</span>}
      </div>
      {!compact && data.notes && (
        <p className="text-xs text-paragraph/70 bg-surface/50 p-2 rounded">{data.notes}</p>
      )}
    </div>
  );
}

function RuleQueryContent({ data, ruleAnswer, compact }: { data: RuleQueryData; ruleAnswer?: RuleAnswer; compact: boolean }) {
  const { rules } = useApp();

  return (
    <div className={`${compact ? 'text-sm space-y-2' : 'space-y-3'}`}>
      <p className={`${compact ? '' : 'text-sm'} font-medium`}>{data.question}</p>
      {ruleAnswer ? (
        <div className={`bg-surface/50 ${compact ? 'p-2 rounded-lg text-xs space-y-1' : 'p-3 rounded-lg space-y-2'}`}>
          <p className={`${compact ? '' : 'text-sm'} whitespace-pre-wrap`}>{ruleAnswer.answer}</p>
          {ruleAnswer.referencedRuleIds.length > 0 && (
            <div className={`${compact ? 'flex flex-wrap gap-1 pt-1' : 'pt-2'} border-t border-paragraph/10`}>
              {!compact && <p className="text-xs text-paragraph/50 mb-1">参照ルール:</p>}
              <div className="flex flex-wrap gap-1">
                {ruleAnswer.referencedRuleIds
                  .map(id => rules.find(r => r.id === id))
                  .filter(Boolean)
                  .map(rule => (
                    <span key={rule!.id} className="text-xs px-1.5 py-0.5 rounded-full bg-button/10 text-paragraph/70">
                      {rule!.title}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} text-paragraph/50`}>
          <div className="w-2 h-2 bg-paragraph/30 rounded-full animate-bounce" />
          回答を取得中...
        </div>
      )}
    </div>
  );
}

function DeleteChildContent({ data, compact }: { data: DeleteChildData; compact: boolean }) {
  const textCls = compact ? 'text-xs' : 'text-sm';
  return (
    <div className={`${textCls} space-y-1`}>
      <p className="font-medium text-alert">AIが削除対象と判定: {data.target_name}</p>
      {data.class_hint && <p className="text-paragraph/70">クラス手がかり: {data.class_hint}</p>}
      {data.matched_keyword && (
        <p className="text-paragraph/50 text-[11px]">原文で検出: 「{data.matched_keyword}」</p>
      )}
      <p className="text-paragraph/60 text-[11px]">
        確定前に対象園児を特定し、園児情報ページと同じ確認ダイアログを表示します。
      </p>
    </div>
  );
}

function AddRuleContent({ data, compact }: { data: AddRuleData; compact: boolean }) {
  const textCls = compact ? 'text-xs' : 'text-sm';
  return (
    <div className={`${textCls} space-y-1`}>
      <p className="font-medium text-headline">{data.title || '(タイトル未設定)'}</p>
      <p className="text-paragraph/70 whitespace-pre-wrap line-clamp-4">{data.content}</p>
      <p className="text-paragraph/50 text-[11px]">
        カテゴリ: {data.category || 'other'} / 確定ボタンで編集モーダルが開きます
      </p>
    </div>
  );
}

function DeleteRuleContent({ data, compact }: { data: DeleteRuleData; compact: boolean }) {
  const textCls = compact ? 'text-xs' : 'text-sm';
  return (
    <div className={`${textCls} space-y-1`}>
      <p className="font-medium text-alert">AIが削除対象と判定したルール: {data.target_title_hint}</p>
      {data.matched_keyword && (
        <p className="text-paragraph/50 text-[11px]">原文で検出: 「{data.matched_keyword}」</p>
      )}
      <p className="text-paragraph/60 text-[11px]">
        確定前に対象ルールを特定し、確認ダイアログを表示します。
      </p>
    </div>
  );
}

function UpdateRuleContent({ data, compact }: { data: UpdateRuleData; compact: boolean }) {
  const textCls = compact ? 'text-xs' : 'text-sm';
  return (
    <div className={`${textCls} space-y-1`}>
      <p className="font-medium text-headline">AIが更新対象と判定したルール: {data.target_title_hint}</p>
      {data.updated_title && <p className="text-paragraph/70">新タイトル: {data.updated_title}</p>}
      {data.updated_content && (
        <p className="text-paragraph/70 whitespace-pre-wrap line-clamp-3">新内容: {data.updated_content}</p>
      )}
      {data.updated_category && <p className="text-paragraph/60 text-[11px]">新カテゴリ: {data.updated_category}</p>}
      <p className="text-paragraph/60 text-[11px]">確定ボタンで編集モーダルが開きます。</p>
    </div>
  );
}

function AddCalendarEventContent({ data, compact }: { data: AddCalendarEventData; compact: boolean }) {
  const textCls = compact ? 'text-xs' : 'text-sm';
  return (
    <div className={`${textCls} space-y-1`}>
      <p className="font-medium text-headline">{data.title || '(タイトル未設定)'}</p>
      <p className="text-paragraph/70">
        {data.date ?? '日付未定'}
        {data.all_day ? ' / 終日' : (data.start_time ? ` ${data.start_time}${data.end_time ? '–' + data.end_time : ''}` : '')}
      </p>
      {data.location && <p className="text-paragraph/60 text-[11px]">場所: {data.location}</p>}
      {data.description && <p className="text-paragraph/70 line-clamp-2">{data.description}</p>}
      <p className="text-paragraph/60 text-[11px]">確定ボタンで予定モーダルが開きます。</p>
    </div>
  );
}

export function IntentContentRenderer({ result, mode, linkedChildIds, ruleAnswer }: IntentContentRendererProps) {
  const compact = mode === 'compact';

  switch (result.intent) {
    case 'growth':
      return <GrowthContent data={result.data as GrowthData} linkedChildIds={linkedChildIds} compact={compact} />;
    case 'incident':
      return <IncidentContent data={result.data as IncidentData} linkedChildIds={linkedChildIds} compact={compact} />;
    case 'handover':
      return <HandoverContent data={result.data as HandoverData} compact={compact} />;
    case 'child_update':
      return <ChildUpdateContent data={result.data as ChildUpdateData} linkedChildIds={linkedChildIds} compact={compact} />;
    case 'add_child':
      return <AddChildContent data={result.data as AddChildData} compact={compact} />;
    case 'add_staff':
      return <AddStaffContent data={result.data as AddStaffData} compact={compact} />;
    case 'rule_query':
      return <RuleQueryContent data={result.data as RuleQueryData} ruleAnswer={ruleAnswer} compact={compact} />;
    case 'delete_child':
      return <DeleteChildContent data={result.data as DeleteChildData} compact={compact} />;
    case 'add_rule':
      return <AddRuleContent data={result.data as AddRuleData} compact={compact} />;
    case 'delete_rule':
      return <DeleteRuleContent data={result.data as DeleteRuleData} compact={compact} />;
    case 'update_rule':
      return <UpdateRuleContent data={result.data as UpdateRuleData} compact={compact} />;
    case 'add_calendar_event':
      return <AddCalendarEventContent data={result.data as AddCalendarEventData} compact={compact} />;
  }
}
