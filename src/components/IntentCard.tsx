'use client';

import { IntentResult, IntentType, GrowthData, IncidentData, HandoverData, ChildUpdateData, AddChildData, AddStaffData } from '@/types/intent';

interface IntentCardProps {
  result: IntentResult;
  originalText: string;
  onConfirm: () => void;
  onEdit: (newIntent: IntentType) => void;
  onCancel: () => void;
  onLinkToGrowth?: () => void;
  onMarkForRecord?: () => void;
  isMarkedForRecord?: boolean;
}

const intentConfig: Record<IntentType, { label: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  growth: {
    label: '成長記録',
    color: 'text-headline',
    bgColor: 'bg-tertiary/30',
    borderColor: 'border-tertiary',
    icon: '🌱',
  },
  incident: {
    label: 'ヒヤリハット',
    color: 'text-headline',
    bgColor: 'bg-alert/20',
    borderColor: 'border-alert',
    icon: '⚠️',
  },
  handover: {
    label: '申し送り',
    color: 'text-headline',
    bgColor: 'bg-secondary/30',
    borderColor: 'border-button',
    icon: '📝',
  },
  child_update: {
    label: '園児情報更新',
    color: 'text-headline',
    bgColor: 'bg-surface',
    borderColor: 'border-paragraph/30',
    icon: '👤',
  },
  add_child: {
    label: '園児追加',
    color: 'text-headline',
    bgColor: 'bg-button/10',
    borderColor: 'border-button',
    icon: '👶',
  },
  add_staff: {
    label: '職員追加',
    color: 'text-headline',
    bgColor: 'bg-tertiary/20',
    borderColor: 'border-tertiary',
    icon: '👩‍🏫',
  },
};

function GrowthCardContent({ data }: { data: GrowthData }) {
  return (
    <div className="space-y-2">
      {data.child_names.length > 0 && (
        <p className="text-sm">
          <span className="font-medium">対象園児:</span> {data.child_names.join('、')}
        </p>
      )}
      <p className="text-sm">{data.summary}</p>
      {data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.tags.map((tag, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-tertiary/50 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function IncidentCardContent({ data }: { data: IncidentData }) {
  const severityLabels = { low: '軽微', medium: '中程度', high: '重大' };
  const severityColors = { low: 'bg-tertiary', medium: 'bg-secondary', high: 'bg-alert' };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${severityColors[data.severity]} text-headline`}>
          {severityLabels[data.severity]}
        </span>
        {data.child_name && (
          <span className="text-sm font-medium">{data.child_name}</span>
        )}
      </div>
      <p className="text-sm">{data.description}</p>
      <div className="flex gap-4 text-xs text-paragraph/80">
        <span>場所: {data.location}</span>
        <span>要因: {data.cause}</span>
      </div>
    </div>
  );
}

function HandoverCardContent({ data }: { data: HandoverData }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {data.urgent && (
          <span className="text-xs px-2 py-0.5 bg-alert rounded-full text-white">
            至急
          </span>
        )}
        <span className="text-xs text-paragraph/80">宛先: {data.target}</span>
      </div>
      <p className="text-sm">{data.message}</p>
    </div>
  );
}

function ChildUpdateCardContent({ data }: { data: ChildUpdateData }) {
  const fieldLabels = { allergy: 'アレルギー情報', characteristic: '特性' };

  return (
    <div className="space-y-2">
      <p className="text-sm">
        <span className="font-medium">{data.child_name}</span>の{fieldLabels[data.field]}を更新
      </p>
      <p className="text-sm bg-surface/50 p-2 rounded">
        {data.new_value}
      </p>
    </div>
  );
}

function AddChildCardContent({ data }: { data: AddChildData }) {
  const genderLabels = { male: '男の子', female: '女の子' };

  return (
    <div className="space-y-2">
      <p className="text-sm">
        <span className="font-medium text-lg">{data.name}</span>
        {data.gender && (
          <span className="ml-2 text-xs px-2 py-0.5 bg-button/20 rounded-full">
            {genderLabels[data.gender]}
          </span>
        )}
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs text-paragraph/80">
        {data.class_name && <span>クラス: {data.class_name}</span>}
        {data.birth_date && <span>生年月日: {data.birth_date}</span>}
      </div>
      {data.allergies && data.allergies.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-paragraph/60">アレルギー:</span>
          {data.allergies.map((allergy, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-alert/20 rounded-full">
              {allergy}
            </span>
          ))}
        </div>
      )}
      {data.notes && (
        <p className="text-xs text-paragraph/70 bg-surface/50 p-2 rounded">
          {data.notes}
        </p>
      )}
    </div>
  );
}

function AddStaffCardContent({ data }: { data: AddStaffData }) {
  return (
    <div className="space-y-2">
      <p className="text-sm">
        <span className="font-medium text-lg">{data.name}</span>
        {data.role && (
          <span className="ml-2 text-xs px-2 py-0.5 bg-tertiary/30 rounded-full">
            {data.role}
          </span>
        )}
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs text-paragraph/80">
        {data.class_name && <span>担当クラス: {data.class_name}</span>}
        {data.contact && <span>連絡先: {data.contact}</span>}
      </div>
      {data.notes && (
        <p className="text-xs text-paragraph/70 bg-surface/50 p-2 rounded">
          {data.notes}
        </p>
      )}
    </div>
  );
}

export function IntentCard({
  result,
  originalText,
  onConfirm,
  onEdit,
  onCancel,
  onLinkToGrowth,
  onMarkForRecord,
  isMarkedForRecord = false
}: IntentCardProps) {
  const config = intentConfig[result.intent];

  const renderContent = () => {
    switch (result.intent) {
      case 'growth':
        return <GrowthCardContent data={result.data as GrowthData} />;
      case 'incident':
        return <IncidentCardContent data={result.data as IncidentData} />;
      case 'handover':
        return <HandoverCardContent data={result.data as HandoverData} />;
      case 'child_update':
        return <ChildUpdateCardContent data={result.data as ChildUpdateData} />;
      case 'add_child':
        return <AddChildCardContent data={result.data as AddChildData} />;
      case 'add_staff':
        return <AddStaffCardContent data={result.data as AddStaffData} />;
    }
  };

  return (
    <div className={`${config.bgColor} border-l-4 ${config.borderColor} rounded-lg p-4 shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className={`font-medium ${config.color}`}>{config.label}</span>
        </div>
        <div className="flex gap-1">
          {Object.entries(intentConfig).map(([key, value]) => (
            key !== result.intent && (
              <button
                key={key}
                onClick={() => onEdit(key as IntentType)}
                className="text-xs px-2 py-1 bg-surface/80 rounded hover:bg-surface text-paragraph/70 hover:text-paragraph transition-colors"
                title={`${value.label}に変更`}
              >
                {value.icon}
              </button>
            )
          ))}
        </div>
      </div>

      <div className="mb-3 text-xs text-paragraph/60 bg-surface/30 p-2 rounded">
        入力: {originalText}
      </div>

      {renderContent()}

      {/* アクションボタン: 個別記録へ反映 / 要録用フラグ */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-paragraph/10">
        {onLinkToGrowth && (
          <button
            onClick={onLinkToGrowth}
            className="flex-1 py-2 px-3 text-sm bg-tertiary/30 text-headline rounded-lg hover:bg-tertiary/50 transition-colors flex items-center justify-center gap-2"
            title="このエピソードを根拠として園児の成長記録を更新"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            成長記録へ反映
          </button>
        )}
        {onMarkForRecord && (
          <button
            onClick={onMarkForRecord}
            className={`flex-1 py-2 px-3 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${
              isMarkedForRecord
                ? 'bg-button text-white'
                : 'bg-secondary/30 text-headline hover:bg-secondary/50'
            }`}
            title="年度末の指導要録に使用するエピソードとしてマーク"
          >
            <svg className="w-4 h-4" fill={isMarkedForRecord ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {isMarkedForRecord ? '要録用にマーク済' : '要録用にマーク'}
          </button>
        )}
      </div>

      {/* 保存・キャンセルボタン */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={onConfirm}
          className="flex-1 py-2 px-4 bg-button text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          保存する
        </button>
        <button
          onClick={onCancel}
          className="py-2 px-4 bg-surface text-paragraph rounded-lg hover:bg-secondary/20 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
