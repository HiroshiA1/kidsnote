'use client';

import { useApp } from './AppLayout';
import { IntentResult, GrowthData, IncidentData, HandoverData, ChildUpdateData, AddChildData, AddStaffData, RuleQueryData } from '@/types/intent';
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
  }
}
