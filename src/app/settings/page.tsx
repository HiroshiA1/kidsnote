'use client';

import { useState } from 'react';
import { useApp } from '@/components/AppLayout';
import { SchoolSettings, ClassInfo, StaffRoleConfig, LLMProvider, llmProviderOptions, defaultStaffRoleConfigs } from '@/types/settings';
import { CalendarCategoryConfig, DEFAULT_CALENDAR_CATEGORIES } from '@/types/calendar';
import { RuleCategoryConfig, DEFAULT_RULE_CATEGORIES } from '@/types/rule';
import { ShiftPattern } from '@/types/staffAttendance';
import { topNavItems, navSections } from '@/lib/constants/navigation';

type TabId = 'A' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M';

const tabs: { id: TabId; label: string }[] = [
  { id: 'H', label: 'クラス管理' },
  { id: 'L', label: 'カレンダーカテゴリ' },
  { id: 'M', label: 'ルールカテゴリ' },
  { id: 'A', label: '基本情報' },
  { id: 'G', label: 'シフトパターン' },
  { id: 'I', label: 'スタッフ役職' },
  { id: 'J', label: 'メニュー表示' },
  { id: 'K', label: 'LLM設定' },
];

const classColors = [
  '#EF4444', '#F87171', '#EC4899', '#F472B6', '#E11D48',
  '#F59E0B', '#FBBF24', '#EAB308', '#FB923C', '#F97316',
  '#10B981', '#34D399', '#22C55E', '#4ADE80', '#14B8A6',
  '#0EA5E9', '#38BDF8', '#3B82F6', '#60A5FA', '#06B6D4',
  '#8B5CF6', '#A78BFA', '#6366F1', '#818CF8', '#A855F7',
  '#78716C', '#9CA3AF', '#64748B', '#D97706', '#BE185D',
];

function InputField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-paragraph/70 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-paragraph/70 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SectionA({ settings, onUpdate }: { settings: SchoolSettings; onUpdate: (s: SchoolSettings) => void }) {
  const info = settings.basicInfo;
  const update = (field: string, value: string | number) => {
    onUpdate({ ...settings, basicInfo: { ...info, [field]: value } });
  };

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-headline">基本情報</h3>
      <div className="grid grid-cols-2 gap-4">
        <InputField label="都道府県コード" value={info.prefectureCode} onChange={v => update('prefectureCode', v)} placeholder="例: 13" />
        <InputField label="学校コード" value={info.schoolCode} onChange={v => update('schoolCode', v)} />
        <SelectField label="設置者別" value={info.establisherType} onChange={v => update('establisherType', v)}
          options={[{ value: '国立', label: '国立' }, { value: '公立', label: '公立' }, { value: '私立', label: '私立' }]} />
        <SelectField label="本園分園別" value={info.branchType} onChange={v => update('branchType', v)}
          options={[{ value: '本園', label: '本園' }, { value: '分園', label: '分園' }]} />
        <InputField label="認可定員" value={info.authorizedCapacity} onChange={v => update('authorizedCapacity', parseInt(v) || 0)} type="number" />
        <InputField label="園名" value={info.schoolName} onChange={v => update('schoolName', v)} />
        <InputField label="郵便番号" value={info.postalCode} onChange={v => update('postalCode', v)} placeholder="例: 100-0001" />
        <InputField label="電話番号" value={info.phone} onChange={v => update('phone', v)} />
        <div className="col-span-2">
          <InputField label="住所" value={info.address} onChange={v => update('address', v)} />
        </div>
        <InputField label="FAX" value={info.fax} onChange={v => update('fax', v)} />
        <InputField label="園長名" value={info.principalName} onChange={v => update('principalName', v)} />
        <InputField label="設立年月日" value={info.establishedDate} onChange={v => update('establishedDate', v)} placeholder="例: 1990-04-01" />
      </div>
    </div>
  );
}

function SectionG({ patterns, onUpdate }: { patterns: ShiftPattern[]; onUpdate: (p: ShiftPattern[]) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ShiftPattern | null>(null);

  const addPattern = () => {
    const newPattern: ShiftPattern = {
      id: crypto.randomUUID(),
      name: '',
      color: classColors[patterns.length % classColors.length],
      startTime: '08:30',
      endTime: '17:30',
      breakMinutes: 60,
    };
    setEditingId(newPattern.id);
    setEditForm(newPattern);
    onUpdate([...patterns, newPattern]);
  };

  const startEdit = (pattern: ShiftPattern) => {
    setEditingId(pattern.id);
    setEditForm({ ...pattern });
  };

  const saveEdit = () => {
    if (!editForm) return;
    onUpdate(patterns.map(p => p.id === editForm.id ? editForm : p));
    setEditingId(null);
    setEditForm(null);
  };

  const cancelEdit = () => {
    if (editForm && !editForm.name) {
      onUpdate(patterns.filter(p => p.id !== editForm.id));
    }
    setEditingId(null);
    setEditForm(null);
  };

  const deletePattern = (id: string) => {
    onUpdate(patterns.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-headline">シフトパターン</h3>
        <button onClick={addPattern} className="px-3 py-1.5 bg-button text-white text-xs rounded-lg hover:bg-button/90 transition-colors">
          + 新規追加
        </button>
      </div>
      <p className="text-sm text-paragraph/60">シフト表で使用するパターンを定義します。</p>

      {patterns.length === 0 && (
        <div className="text-center py-12 text-paragraph/50">
          <p className="text-lg mb-2">パターンが未登録です</p>
          <p className="text-sm">「+ 新規追加」ボタンからシフトパターンを作成してください</p>
        </div>
      )}

      <div className="space-y-3">
        {patterns.map(pattern => (
          <div key={pattern.id} className="bg-surface rounded-lg border border-secondary/20 p-4">
            {editingId === pattern.id && editForm ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-paragraph/70 mb-1">パターン名</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="例: 早番"
                      className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-paragraph/70 mb-1">表示色</label>
                    <div className="flex gap-3 items-start">
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border border-secondary/30 flex-shrink-0"
                        title="カスタムカラーを選択"
                      />
                      <div className="grid grid-cols-10 gap-1.5">
                        {classColors.map(c => (
                          <button
                            key={c}
                            onClick={() => setEditForm({ ...editForm, color: c })}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${editForm.color === c ? 'border-headline scale-110 ring-2 ring-button/30' : 'border-transparent hover:scale-110'}`}
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-paragraph/70 mb-1">開始時刻</label>
                    <input
                      type="time"
                      value={editForm.startTime}
                      onChange={e => setEditForm({ ...editForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-paragraph/70 mb-1">終了時刻</label>
                    <input
                      type="time"
                      value={editForm.endTime}
                      onChange={e => setEditForm({ ...editForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-paragraph/70 mb-1">休憩（分）</label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.breakMinutes}
                      onChange={e => setEditForm({ ...editForm, breakMinutes: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={cancelEdit} className="px-3 py-1.5 text-sm text-paragraph/70 hover:text-paragraph transition-colors">
                    キャンセル
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={!editForm.name.trim()}
                    className="px-4 py-1.5 bg-button text-white text-sm rounded-lg hover:bg-button/90 disabled:opacity-40 transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: pattern.color }} />
                  <div>
                    <span className="font-medium text-headline">{pattern.name}</span>
                    <span className="text-sm text-paragraph/60 ml-3">
                      {pattern.startTime}〜{pattern.endTime}（休憩{pattern.breakMinutes}分）
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(pattern)} className="text-xs px-2 py-1 text-button hover:bg-button/10 rounded transition-colors">
                    編集
                  </button>
                  <button onClick={() => deletePattern(pattern.id)} className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                    削除
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionH({ settings, onUpdate }: { settings: SchoolSettings; onUpdate: (s: SchoolSettings) => void }) {
  const classes = settings.classes;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ClassInfo | null>(null);

  const addClass = () => {
    const newClass: ClassInfo = {
      id: crypto.randomUUID(),
      name: '',
      grade: '年中',
      color: classColors[classes.length % classColors.length],
    };
    onUpdate({ ...settings, classes: [...classes, newClass] });
    setEditingId(newClass.id);
    setEditForm(newClass);
  };

  const startEdit = (cls: ClassInfo) => {
    setEditingId(cls.id);
    setEditForm({ ...cls });
  };

  const saveEdit = () => {
    if (!editForm) return;
    onUpdate({ ...settings, classes: classes.map(c => c.id === editForm.id ? editForm : c) });
    setEditingId(null);
    setEditForm(null);
  };

  const cancelEdit = () => {
    if (editForm && !editForm.name) {
      onUpdate({ ...settings, classes: classes.filter(c => c.id !== editForm.id) });
    }
    setEditingId(null);
    setEditForm(null);
  };

  const deleteClass = (id: string) => {
    onUpdate({ ...settings, classes: classes.filter(c => c.id !== id) });
  };

  const moveClass = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= classes.length) return;
    const next = [...classes];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onUpdate({ ...settings, classes: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-headline">クラス管理</h3>
        <button onClick={addClass} className="px-3 py-1.5 bg-button text-white text-xs rounded-lg hover:bg-button/90 transition-colors">
          + 新規追加
        </button>
      </div>
      <p className="text-sm text-paragraph/60">園のクラスを管理します。ここでの設定はクラス活動・行事・園児管理など各画面に反映されます。</p>

      {classes.length === 0 && (
        <div className="text-center py-12 text-paragraph/50">
          <p className="text-lg mb-2">クラスが未登録です</p>
          <p className="text-sm">「+ 新規追加」ボタンからクラスを作成してください</p>
        </div>
      )}

      <div className="space-y-3">
        {classes.map((cls, index) => (
          <div key={cls.id} className="bg-surface rounded-lg border border-secondary/20 p-4">
            {editingId === cls.id && editForm ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-paragraph/70 mb-1">クラス名</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="例: さくら組"
                      className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-paragraph/70 mb-1">学年</label>
                    <select
                      value={editForm.grade}
                      onChange={e => setEditForm({ ...editForm, grade: e.target.value as ClassInfo['grade'] })}
                      className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
                    >
                      <option value="未就園児">未就園児</option>
                      <option value="満3歳児">満3歳児</option>
                      <option value="年少">年少</option>
                      <option value="年中">年中</option>
                      <option value="年長">年長</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-paragraph/70 mb-1">表示色</label>
                    <div className="flex gap-3 items-start">
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border border-secondary/30 flex-shrink-0"
                        title="カスタムカラーを選択"
                      />
                      <div className="grid grid-cols-10 gap-1.5">
                        {classColors.map(c => (
                          <button
                            key={c}
                            onClick={() => setEditForm({ ...editForm, color: c })}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${editForm.color === c ? 'border-headline scale-110 ring-2 ring-button/30' : 'border-transparent hover:scale-110'}`}
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={cancelEdit} className="px-3 py-1.5 text-sm text-paragraph/70 hover:text-paragraph transition-colors">
                    キャンセル
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={!editForm.name.trim()}
                    className="px-4 py-1.5 bg-button text-white text-sm rounded-lg hover:bg-button/90 disabled:opacity-40 transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveClass(index, -1)}
                      disabled={index === 0}
                      className="text-paragraph/40 hover:text-paragraph disabled:opacity-20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveClass(index, 1)}
                      disabled={index === classes.length - 1}
                      className="text-paragraph/40 hover:text-paragraph disabled:opacity-20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cls.color }} />
                  <div>
                    <span className="font-medium text-headline">{cls.name}</span>
                    <span className="text-sm text-paragraph/60 ml-3">{cls.grade}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(cls)} className="text-xs px-2 py-1 text-button hover:bg-button/10 rounded transition-colors">
                    編集
                  </button>
                  <button onClick={() => deleteClass(cls.id)} className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                    削除
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionI({ settings, onUpdate }: { settings: SchoolSettings; onUpdate: (s: SchoolSettings) => void }) {
  const roles = settings.staffRoleConfigs ?? defaultStaffRoleConfigs;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const addRole = () => {
    const newRole: StaffRoleConfig = {
      id: crypto.randomUUID(),
      name: '',
      displayOrder: roles.length,
    };
    onUpdate({ ...settings, staffRoleConfigs: [...roles, newRole] });
    setEditingId(newRole.id);
    setEditName('');
  };

  const startEdit = (role: StaffRoleConfig) => {
    setEditingId(role.id);
    setEditName(role.name);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updated = roles.map(r => r.id === editingId ? { ...r, name: editName } : r);
    onUpdate({ ...settings, staffRoleConfigs: updated });
    setEditingId(null);
    setEditName('');
  };

  const cancelEdit = () => {
    if (editingId && !roles.find(r => r.id === editingId)?.name) {
      onUpdate({ ...settings, staffRoleConfigs: roles.filter(r => r.id !== editingId) });
    }
    setEditingId(null);
    setEditName('');
  };

  const deleteRole = (id: string) => {
    const updated = roles.filter(r => r.id !== id).map((r, i) => ({ ...r, displayOrder: i }));
    onUpdate({ ...settings, staffRoleConfigs: updated });
  };

  const moveRole = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= roles.length) return;
    const next = [...roles];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    const reordered = next.map((r, i) => ({ ...r, displayOrder: i }));
    onUpdate({ ...settings, staffRoleConfigs: reordered });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-headline">スタッフ役職設定</h3>
        <button onClick={addRole} className="px-3 py-1.5 bg-button text-white text-xs rounded-lg hover:bg-button/90 transition-colors">
          + 新規追加
        </button>
      </div>
      <p className="text-sm text-paragraph/60">スタッフの役職を管理します。ここでの設定は職員一覧・シフト管理などに反映されます。</p>

      {roles.length === 0 && (
        <div className="text-center py-12 text-paragraph/50">
          <p className="text-lg mb-2">役職が未登録です</p>
          <p className="text-sm">「+ 新規追加」ボタンから役職を作成してください</p>
        </div>
      )}

      <div className="space-y-2">
        {roles.map((role, index) => (
          <div key={role.id} className="bg-surface rounded-lg border border-secondary/20 p-3">
            {editingId === role.id ? (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="例: 園長"
                  className="flex-1 px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter' && editName.trim()) saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                />
                <button onClick={cancelEdit} className="px-3 py-1.5 text-sm text-paragraph/70 hover:text-paragraph">キャンセル</button>
                <button onClick={saveEdit} disabled={!editName.trim()} className="px-4 py-1.5 bg-button text-white text-sm rounded-lg hover:bg-button/90 disabled:opacity-40">保存</button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveRole(index, -1)} disabled={index === 0} className="text-paragraph/40 hover:text-paragraph disabled:opacity-20">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button onClick={() => moveRole(index, 1)} disabled={index === roles.length - 1} className="text-paragraph/40 hover:text-paragraph disabled:opacity-20">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                  <span className="font-medium text-headline">{role.name}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(role)} className="text-xs px-2 py-1 text-button hover:bg-button/10 rounded">編集</button>
                  <button onClick={() => deleteRole(role.id)} className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded">削除</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionJ({ settings, onUpdate }: { settings: SchoolSettings; onUpdate: (s: SchoolSettings) => void }) {
  const hiddenItems = settings.menuVisibility?.hiddenItems ?? [];

  // navigation.ts のすべてのメニュー項目を収集
  const allItems = [
    ...topNavItems.map(item => ({ href: item.href, label: item.label, section: 'トップ' })),
    ...navSections.flatMap(section =>
      section.items.map(item => ({ href: item.href, label: item.label, section: section.label }))
    ),
  ];

  const toggleItem = (href: string) => {
    // 設定ページ自身は非表示不可
    if (href === '/settings') return;
    const current = new Set(hiddenItems);
    if (current.has(href)) {
      current.delete(href);
    } else {
      current.add(href);
    }
    onUpdate({
      ...settings,
      menuVisibility: { hiddenItems: Array.from(current) },
    });
  };

  const groupedItems: { section: string; items: typeof allItems }[] = [];
  for (const item of allItems) {
    const existing = groupedItems.find(g => g.section === item.section);
    if (existing) {
      existing.items.push(item);
    } else {
      groupedItems.push({ section: item.section, items: [item] });
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-headline">メニュー表示設定</h3>
      <p className="text-sm text-paragraph/60">サイドバーに表示するメニュー項目を選択します。非表示にした項目はサイドバーから隠れます。</p>

      <div className="space-y-4">
        {groupedItems.map(group => (
          <div key={group.section}>
            <h4 className="text-xs font-medium text-paragraph/60 uppercase tracking-wider mb-2">{group.section}</h4>
            <div className="space-y-1">
              {group.items.map(item => {
                const isHidden = hiddenItems.includes(item.href);
                const isSettings = item.href === '/settings';
                return (
                  <label
                    key={item.href}
                    className={`flex items-center justify-between p-3 rounded-lg border border-secondary/20 ${isSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-secondary/10'}`}
                  >
                    <span className="text-sm text-headline">{item.label}</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={!isHidden}
                        onChange={() => toggleItem(item.href)}
                        disabled={isSettings}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-paragraph/20 peer-checked:bg-button rounded-full transition-colors" />
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionK({ settings, onUpdate }: { settings: SchoolSettings; onUpdate: (s: SchoolSettings) => void }) {
  const config = settings.llmConfig ?? { provider: 'gemini' as LLMProvider, apiKey: '', model: '' };
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const updateConfig = (patch: Partial<typeof config>) => {
    const next = { ...config, ...patch };
    // プロバイダー変更時にモデルをリセット
    if (patch.provider && patch.provider !== config.provider) {
      next.model = llmProviderOptions[patch.provider].models[0].id;
    }
    onUpdate({ ...settings, llmConfig: next });
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/llm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: config.provider, apiKey: config.apiKey, model: config.model }),
      });
      const json = await res.json();
      setTestResult({ ok: res.ok, message: json.message ?? json.error ?? '不明なエラー' });
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : '接続失敗' });
    } finally {
      setTesting(false);
    }
  };

  const providerOpts = Object.entries(llmProviderOptions).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));

  const modelOpts = llmProviderOptions[config.provider]?.models ?? [];

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-headline">音声メモLLM設定</h3>
      <p className="text-sm text-paragraph/60">音声メモの文字起こし・要約に使用するLLMプロバイダーを設定します。</p>

      <div className="space-y-4 max-w-lg">
        <SelectField
          label="プロバイダー"
          value={config.provider}
          onChange={v => updateConfig({ provider: v as LLMProvider })}
          options={providerOpts}
        />

        <div>
          <label className="block text-xs font-medium text-paragraph/70 mb-1">APIキー</label>
          <input
            type="password"
            value={config.apiKey}
            onChange={e => updateConfig({ apiKey: e.target.value })}
            placeholder="sk-... / AIza..."
            className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph font-mono focus:outline-none focus:ring-2 focus:ring-button/30"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-paragraph/70 mb-1">モデル</label>
          <select
            value={config.model || modelOpts[0]?.id || ''}
            onChange={e => updateConfig({ model: e.target.value })}
            className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
          >
            {modelOpts.map(m => (
              <option key={m.id} value={m.id}>{m.label} ({m.id})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runTest}
            disabled={testing || !config.apiKey}
            className="px-4 py-2 bg-button text-white text-sm rounded-lg hover:bg-button/90 disabled:opacity-40 transition-colors"
          >
            {testing ? '接続テスト中...' : '接続テスト'}
          </button>
          {testResult && (
            <span className={`text-sm ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.ok ? '接続成功' : testResult.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionL({ settings, onUpdate }: { settings: SchoolSettings; onUpdate: (s: SchoolSettings) => void }) {
  const categories = settings.calendarCategories ?? DEFAULT_CALENDAR_CATEGORIES;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CalendarCategoryConfig | null>(null);

  const addCategory = () => {
    const newCat: CalendarCategoryConfig = {
      id: crypto.randomUUID(),
      name: '',
      color: classColors[categories.length % classColors.length],
      displayOrder: categories.length,
    };
    onUpdate({ ...settings, calendarCategories: [...categories, newCat] });
    setEditingId(newCat.id);
    setEditForm(newCat);
  };

  const startEdit = (cat: CalendarCategoryConfig) => {
    setEditingId(cat.id);
    setEditForm({ ...cat });
  };

  const saveEdit = () => {
    if (!editForm) return;
    onUpdate({ ...settings, calendarCategories: categories.map(c => c.id === editForm.id ? editForm : c) });
    setEditingId(null);
    setEditForm(null);
  };

  const cancelEdit = () => {
    if (editForm && !editForm.name) {
      onUpdate({ ...settings, calendarCategories: categories.filter(c => c.id !== editForm.id) });
    }
    setEditingId(null);
    setEditForm(null);
  };

  const deleteCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat?.name === 'その他') return;
    const updated = categories.filter(c => c.id !== id).map((c, i) => ({ ...c, displayOrder: i }));
    onUpdate({ ...settings, calendarCategories: updated });
  };

  const moveCategory = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;
    const next = [...categories];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    const reordered = next.map((c, i) => ({ ...c, displayOrder: i }));
    onUpdate({ ...settings, calendarCategories: reordered });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-headline">カレンダーカテゴリ</h3>
        <button onClick={addCategory} className="px-3 py-1.5 bg-button text-white text-xs rounded-lg hover:bg-button/90 transition-colors">
          + 新規追加
        </button>
      </div>
      <p className="text-sm text-paragraph/60">カレンダーの予定に使うカテゴリを管理します。色を変更するとカレンダー上の表示に反映されます。</p>

      {categories.length === 0 && (
        <div className="text-center py-12 text-paragraph/50">
          <p className="text-lg mb-2">カテゴリが未登録です</p>
          <p className="text-sm">「+ 新規追加」ボタンからカテゴリを作成してください</p>
        </div>
      )}

      <div className="space-y-3">
        {categories.map((cat, index) => (
          <div key={cat.id} className="bg-surface rounded-lg border border-secondary/20 p-4">
            {editingId === cat.id && editForm ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-paragraph/70 mb-1">カテゴリ名</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="例: 行事"
                      className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-paragraph/70 mb-1">表示色</label>
                    <div className="flex gap-3 items-start">
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border border-secondary/30 flex-shrink-0"
                        title="カスタムカラーを選択"
                      />
                      <div className="grid grid-cols-10 gap-1.5">
                        {classColors.map(c => (
                          <button
                            key={c}
                            onClick={() => setEditForm({ ...editForm, color: c })}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${editForm.color === c ? 'border-headline scale-110 ring-2 ring-button/30' : 'border-transparent hover:scale-110'}`}
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={cancelEdit} className="px-3 py-1.5 text-sm text-paragraph/70 hover:text-paragraph transition-colors">
                    キャンセル
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={!editForm.name.trim()}
                    className="px-4 py-1.5 bg-button text-white text-sm rounded-lg hover:bg-button/90 disabled:opacity-40 transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveCategory(index, -1)}
                      disabled={index === 0}
                      className="text-paragraph/40 hover:text-paragraph disabled:opacity-20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveCategory(index, 1)}
                      disabled={index === categories.length - 1}
                      className="text-paragraph/40 hover:text-paragraph disabled:opacity-20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-medium text-headline">{cat.name}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(cat)} className="text-xs px-2 py-1 text-button hover:bg-button/10 rounded transition-colors">
                    編集
                  </button>
                  {cat.name !== 'その他' ? (
                    <button onClick={() => deleteCategory(cat.id)} className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                      削除
                    </button>
                  ) : (
                    <span className="text-xs px-2 py-1 text-paragraph/30">削除不可</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionM({ settings, onUpdate }: { settings: SchoolSettings; onUpdate: (s: SchoolSettings) => void }) {
  const categories = settings.ruleCategories ?? DEFAULT_RULE_CATEGORIES;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RuleCategoryConfig | null>(null);

  const addCategory = () => {
    const newCat: RuleCategoryConfig = {
      id: crypto.randomUUID(),
      name: '',
      icon: '📌',
      displayOrder: categories.length,
      isBuiltIn: false,
    };
    onUpdate({ ...settings, ruleCategories: [...categories, newCat] });
    setEditingId(newCat.id);
    setEditForm(newCat);
  };

  const startEdit = (cat: RuleCategoryConfig) => {
    setEditingId(cat.id);
    setEditForm({ ...cat });
  };

  const saveEdit = () => {
    if (!editForm) return;
    onUpdate({ ...settings, ruleCategories: categories.map(c => c.id === editForm.id ? editForm : c) });
    setEditingId(null);
    setEditForm(null);
  };

  const cancelEdit = () => {
    if (editForm && !editForm.name) {
      onUpdate({ ...settings, ruleCategories: categories.filter(c => c.id !== editForm.id) });
    }
    setEditingId(null);
    setEditForm(null);
  };

  const deleteCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat?.isBuiltIn) return;
    const updated = categories.filter(c => c.id !== id).map((c, i) => ({ ...c, displayOrder: i }));
    onUpdate({ ...settings, ruleCategories: updated });
  };

  const moveCategory = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;
    const next = [...categories];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    const reordered = next.map((c, i) => ({ ...c, displayOrder: i }));
    onUpdate({ ...settings, ruleCategories: reordered });
  };

  const emojiPresets = ['📌', '📚', '🎨', '🌱', '🏃', '🍽️', '🎵', '🔬', '🤝', '💪', '🌍', '✨', '📖', '🎯', '💬', '🛡️', '🏥', '⚠️', '🚨', '📋'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-headline">ルールカテゴリ</h3>
        <button onClick={addCategory} className="px-3 py-1.5 bg-button text-white text-xs rounded-lg hover:bg-button/90 transition-colors">
          + 新規追加
        </button>
      </div>
      <p className="text-sm text-paragraph/60">園のルールに使うカテゴリを管理します。教育理念・方針・目標はAIが計画作成時に参照します。</p>

      <div className="space-y-3">
        {categories.map((cat, index) => (
          <div key={cat.id} className="bg-surface rounded-lg border border-secondary/20 p-4">
            {editingId === cat.id && editForm ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-paragraph/70 mb-1">カテゴリ名</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="例: 食育"
                      className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-paragraph/70 mb-1">アイコン</label>
                    <div className="flex gap-3 items-start">
                      <input
                        type="text"
                        value={editForm.icon}
                        onChange={e => setEditForm({ ...editForm, icon: e.target.value })}
                        className="w-16 px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-button/30"
                        maxLength={2}
                      />
                      <div className="grid grid-cols-10 gap-1.5">
                        {emojiPresets.map(em => (
                          <button
                            key={em}
                            onClick={() => setEditForm({ ...editForm, icon: em })}
                            className={`w-7 h-7 rounded text-sm flex items-center justify-center border transition-all ${editForm.icon === em ? 'border-button bg-button/10 scale-110' : 'border-secondary/20 hover:bg-secondary/10'}`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={cancelEdit} className="px-3 py-1.5 text-sm text-paragraph/70 hover:text-paragraph transition-colors">
                    キャンセル
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={!editForm.name.trim()}
                    className="px-4 py-1.5 bg-button text-white text-sm rounded-lg hover:bg-button/90 disabled:opacity-40 transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveCategory(index, -1)}
                      disabled={index === 0}
                      className="text-paragraph/40 hover:text-paragraph disabled:opacity-20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveCategory(index, 1)}
                      disabled={index === categories.length - 1}
                      className="text-paragraph/40 hover:text-paragraph disabled:opacity-20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-medium text-headline">{cat.name}</span>
                  {cat.isBuiltIn && <span className="text-[10px] px-1.5 py-0.5 bg-secondary/15 text-paragraph/50 rounded">組込</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(cat)} className="text-xs px-2 py-1 text-button hover:bg-button/10 rounded transition-colors">
                    編集
                  </button>
                  {!cat.isBuiltIn ? (
                    <button onClick={() => deleteCategory(cat.id)} className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                      削除
                    </button>
                  ) : (
                    <span className="text-xs px-2 py-1 text-paragraph/30">削除不可</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings, shiftPatterns, setShiftPatterns } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('H');

  const renderSection = () => {
    switch (activeTab) {
      case 'A': return <SectionA settings={settings} onUpdate={updateSettings} />;
      case 'G': return <SectionG patterns={shiftPatterns} onUpdate={setShiftPatterns} />;
      case 'H': return <SectionH settings={settings} onUpdate={updateSettings} />;
      case 'I': return <SectionI settings={settings} onUpdate={updateSettings} />;
      case 'J': return <SectionJ settings={settings} onUpdate={updateSettings} />;
      case 'K': return <SectionK settings={settings} onUpdate={updateSettings} />;
      case 'L': return <SectionL settings={settings} onUpdate={updateSettings} />;
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4">
          <h1 className="text-xl font-bold text-headline">園の設定</h1>
          <p className="text-sm text-paragraph/60 mt-1">クラス・役職・メニュー表示・LLM接続などの管理</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6">
        {/* タブ */}
        <div className="flex gap-1 mb-6 overflow-x-auto border-b border-secondary/20">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab.id
                  ? 'border-button text-button'
                  : 'border-transparent text-paragraph/60 hover:text-paragraph hover:border-secondary/30'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* セクション内容 */}
        <div className="bg-surface rounded-xl p-6 shadow-sm">
          {renderSection()}
        </div>

        <p className="text-xs text-paragraph/40 mt-4 text-center">
          変更は自動的に保存されます
        </p>
      </main>
    </div>
  );
}
