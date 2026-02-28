'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/components/AppLayout';
import { SchoolSettings, TeacherCount, StaffCount, LeaveRecord, ClassEnrollment, ClassInfo, defaultStaffPositions, StaffPosition } from '@/types/settings';
import { aggregateTeacherCounts, aggregateEnrollment } from '@/lib/settingsAggregation';
import { ShiftPattern } from '@/types/staffAttendance';

type TabId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

const tabs: { id: TabId; label: string }[] = [
  { id: 'H', label: 'H: クラス管理' },
  { id: 'A', label: 'A: 基本情報' },
  { id: 'B', label: 'B: 教員数' },
  { id: 'C', label: 'C: 職員数' },
  { id: 'D', label: 'D: 休職・代替' },
  { id: 'E', label: 'E: 在園者数' },
  { id: 'F', label: 'F: 修了者数' },
  { id: 'G', label: 'G: シフトパターン' },
];

const defaultColors = ['#4CAF50', '#2196F3', '#FF9800', '#FFC107', '#9E9E9E', '#E91E63', '#9C27B0', '#00BCD4'];

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

function SectionB({ settings, onUpdate }: { settings: SchoolSettings; onUpdate: (s: SchoolSettings) => void }) {
  const { staff } = useApp();
  const autoCalculated = useMemo(() => aggregateTeacherCounts(staff), [staff]);

  const handleUseAuto = () => {
    onUpdate({ ...settings, teacherCounts: autoCalculated });
  };

  const updateTeacher = (index: number, field: keyof TeacherCount, value: number) => {
    const next = [...settings.teacherCounts];
    next[index] = { ...next[index], [field]: value, isAutoCalculated: false };
    onUpdate({ ...settings, teacherCounts: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-headline">教員数（職階別×本務/兼務×男女）</h3>
        <button onClick={handleUseAuto} className="px-3 py-1.5 bg-tertiary/20 text-headline text-xs rounded-lg hover:bg-tertiary/30 transition-colors">
          職員データから自動集計
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-secondary/10">
              <th className="px-3 py-2 text-left border border-secondary/20">職階</th>
              <th className="px-3 py-2 text-center border border-secondary/20" colSpan={2}>本務</th>
              <th className="px-3 py-2 text-center border border-secondary/20" colSpan={2}>兼務</th>
              <th className="px-3 py-2 text-center border border-secondary/20">計</th>
            </tr>
            <tr className="bg-secondary/5">
              <th className="px-3 py-1 border border-secondary/20"></th>
              <th className="px-3 py-1 text-center border border-secondary/20 text-xs">男</th>
              <th className="px-3 py-1 text-center border border-secondary/20 text-xs">女</th>
              <th className="px-3 py-1 text-center border border-secondary/20 text-xs">男</th>
              <th className="px-3 py-1 text-center border border-secondary/20 text-xs">女</th>
              <th className="px-3 py-1 text-center border border-secondary/20 text-xs"></th>
            </tr>
          </thead>
          <tbody>
            {settings.teacherCounts.map((tc, i) => {
              const total = tc.fullTimeMale + tc.fullTimeFemale + tc.partTimeMale + tc.partTimeFemale;
              return (
                <tr key={tc.position} className="hover:bg-secondary/5">
                  <td className="px-3 py-2 border border-secondary/20 font-medium">{tc.position}</td>
                  <td className="px-1 py-1 border border-secondary/20">
                    <input type="number" min={0} value={tc.fullTimeMale} onChange={e => updateTeacher(i, 'fullTimeMale', parseInt(e.target.value) || 0)}
                      className="w-full text-center px-1 py-1 bg-surface border border-secondary/20 rounded text-sm focus:outline-none focus:ring-1 focus:ring-button/30" />
                  </td>
                  <td className="px-1 py-1 border border-secondary/20">
                    <input type="number" min={0} value={tc.fullTimeFemale} onChange={e => updateTeacher(i, 'fullTimeFemale', parseInt(e.target.value) || 0)}
                      className="w-full text-center px-1 py-1 bg-surface border border-secondary/20 rounded text-sm focus:outline-none focus:ring-1 focus:ring-button/30" />
                  </td>
                  <td className="px-1 py-1 border border-secondary/20">
                    <input type="number" min={0} value={tc.partTimeMale} onChange={e => updateTeacher(i, 'partTimeMale', parseInt(e.target.value) || 0)}
                      className="w-full text-center px-1 py-1 bg-surface border border-secondary/20 rounded text-sm focus:outline-none focus:ring-1 focus:ring-button/30" />
                  </td>
                  <td className="px-1 py-1 border border-secondary/20">
                    <input type="number" min={0} value={tc.partTimeFemale} onChange={e => updateTeacher(i, 'partTimeFemale', parseInt(e.target.value) || 0)}
                      className="w-full text-center px-1 py-1 bg-surface border border-secondary/20 rounded text-sm focus:outline-none focus:ring-1 focus:ring-button/30" />
                  </td>
                  <td className="px-3 py-2 text-center border border-secondary/20 font-medium">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionC({ settings, onUpdate }: { settings: SchoolSettings; onUpdate: (s: SchoolSettings) => void }) {
  const updateStaff = (index: number, field: keyof StaffCount, value: number) => {
    const next = [...settings.staffCounts];
    next[index] = { ...next[index], [field]: value };
    onUpdate({ ...settings, staffCounts: next });
  };

  const addPosition = () => {
    const available = defaultStaffPositions.filter(p => !settings.staffCounts.find(s => s.position === p));
    if (available.length === 0) return;
    onUpdate({
      ...settings,
      staffCounts: [...settings.staffCounts, { position: available[0], male: 0, female: 0 }],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-headline">職員数（事務・養護・用務等）</h3>
        <button onClick={addPosition} className="px-3 py-1.5 bg-button/10 text-button text-xs rounded-lg hover:bg-button/20 transition-colors">
          + 追加
        </button>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-secondary/10">
            <th className="px-3 py-2 text-left border border-secondary/20">職種</th>
            <th className="px-3 py-2 text-center border border-secondary/20">男</th>
            <th className="px-3 py-2 text-center border border-secondary/20">女</th>
            <th className="px-3 py-2 text-center border border-secondary/20">計</th>
          </tr>
        </thead>
        <tbody>
          {settings.staffCounts.map((sc, i) => (
            <tr key={sc.position} className="hover:bg-secondary/5">
              <td className="px-3 py-2 border border-secondary/20 font-medium">{sc.position}</td>
              <td className="px-1 py-1 border border-secondary/20">
                <input type="number" min={0} value={sc.male} onChange={e => updateStaff(i, 'male', parseInt(e.target.value) || 0)}
                  className="w-full text-center px-1 py-1 bg-surface border border-secondary/20 rounded text-sm focus:outline-none focus:ring-1 focus:ring-button/30" />
              </td>
              <td className="px-1 py-1 border border-secondary/20">
                <input type="number" min={0} value={sc.female} onChange={e => updateStaff(i, 'female', parseInt(e.target.value) || 0)}
                  className="w-full text-center px-1 py-1 bg-surface border border-secondary/20 rounded text-sm focus:outline-none focus:ring-1 focus:ring-button/30" />
              </td>
              <td className="px-3 py-2 text-center border border-secondary/20 font-medium">{sc.male + sc.female}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionD({ settings, onUpdate }: { settings: SchoolSettings; onUpdate: (s: SchoolSettings) => void }) {
  const updateLeave = (index: number, value: number) => {
    const next = [...settings.leaveRecords];
    next[index] = { ...next[index], count: value };
    onUpdate({ ...settings, leaveRecords: next });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-headline">休職・代替教員等</h3>
      <div className="grid grid-cols-2 gap-4">
        {settings.leaveRecords.map((lr, i) => (
          <div key={lr.type} className="bg-surface rounded-lg border border-secondary/20 p-4">
            <label className="block text-sm font-medium text-headline mb-2">{lr.type}</label>
            <input
              type="number" min={0} value={lr.count}
              onChange={e => updateLeave(i, parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph text-center focus:outline-none focus:ring-2 focus:ring-button/30"
            />
            <span className="text-xs text-paragraph/50 mt-1 block">人</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionE({ settings, onUpdate }: { settings: SchoolSettings; onUpdate: (s: SchoolSettings) => void }) {
  const { children } = useApp();
  const autoCalculated = useMemo(() => aggregateEnrollment(children), [children]);

  const handleUseAuto = () => {
    onUpdate({ ...settings, classEnrollments: autoCalculated });
  };

  const updateEnrollment = (index: number, field: keyof ClassEnrollment, value: number) => {
    const next = [...settings.classEnrollments];
    next[index] = { ...next[index], [field]: value, isAutoCalculated: false };
    onUpdate({ ...settings, classEnrollments: next });
  };

  const enrollments = settings.classEnrollments.length > 0 ? settings.classEnrollments : autoCalculated;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-headline">学級別在園者数（年齢別×男女）</h3>
        <button onClick={handleUseAuto} className="px-3 py-1.5 bg-tertiary/20 text-headline text-xs rounded-lg hover:bg-tertiary/30 transition-colors">
          園児データから自動集計
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-secondary/10">
              <th className="px-3 py-2 text-left border border-secondary/20">クラス</th>
              <th className="px-3 py-2 text-center border border-secondary/20" colSpan={2}>3歳児</th>
              <th className="px-3 py-2 text-center border border-secondary/20" colSpan={2}>4歳児</th>
              <th className="px-3 py-2 text-center border border-secondary/20" colSpan={2}>5歳児</th>
              <th className="px-3 py-2 text-center border border-secondary/20">合計</th>
            </tr>
            <tr className="bg-secondary/5">
              <th className="border border-secondary/20"></th>
              <th className="px-2 py-1 text-center border border-secondary/20 text-xs">男</th>
              <th className="px-2 py-1 text-center border border-secondary/20 text-xs">女</th>
              <th className="px-2 py-1 text-center border border-secondary/20 text-xs">男</th>
              <th className="px-2 py-1 text-center border border-secondary/20 text-xs">女</th>
              <th className="px-2 py-1 text-center border border-secondary/20 text-xs">男</th>
              <th className="px-2 py-1 text-center border border-secondary/20 text-xs">女</th>
              <th className="border border-secondary/20"></th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((ce, i) => {
              const total = ce.age3Male + ce.age3Female + ce.age4Male + ce.age4Female + ce.age5Male + ce.age5Female;
              return (
                <tr key={ce.className} className="hover:bg-secondary/5">
                  <td className="px-3 py-2 border border-secondary/20 font-medium">{ce.className}</td>
                  {(['age3Male', 'age3Female', 'age4Male', 'age4Female', 'age5Male', 'age5Female'] as const).map(field => (
                    <td key={field} className="px-1 py-1 border border-secondary/20">
                      <input type="number" min={0} value={ce[field]}
                        onChange={e => updateEnrollment(i, field, parseInt(e.target.value) || 0)}
                        className="w-full text-center px-1 py-1 bg-surface border border-secondary/20 rounded text-sm focus:outline-none focus:ring-1 focus:ring-button/30" />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center border border-secondary/20 font-medium">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionF({ settings, onUpdate }: { settings: SchoolSettings; onUpdate: (s: SchoolSettings) => void }) {
  const gc = settings.graduateCount;
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-headline">修了者数（前年度）</h3>
      <div className="grid grid-cols-3 gap-4 max-w-md">
        <div>
          <label className="block text-xs font-medium text-paragraph/70 mb-1">男</label>
          <input type="number" min={0} value={gc.male}
            onChange={e => onUpdate({ ...settings, graduateCount: { ...gc, male: parseInt(e.target.value) || 0 } })}
            className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph text-center focus:outline-none focus:ring-2 focus:ring-button/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-paragraph/70 mb-1">女</label>
          <input type="number" min={0} value={gc.female}
            onChange={e => onUpdate({ ...settings, graduateCount: { ...gc, female: parseInt(e.target.value) || 0 } })}
            className="w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph text-center focus:outline-none focus:ring-2 focus:ring-button/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-paragraph/70 mb-1">計</label>
          <div className="px-3 py-2 bg-secondary/10 border border-secondary/20 rounded-lg text-sm text-headline text-center font-medium">
            {gc.male + gc.female}
          </div>
        </div>
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
      color: defaultColors[patterns.length % defaultColors.length],
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
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border border-secondary/30"
                      />
                      <div className="flex gap-1 flex-wrap">
                        {defaultColors.map(c => (
                          <button
                            key={c}
                            onClick={() => setEditForm({ ...editForm, color: c })}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${editForm.color === c ? 'border-headline scale-110' : 'border-transparent hover:scale-105'}`}
                            style={{ backgroundColor: c }}
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

const classColors = ['#EC4899', '#F59E0B', '#EF4444', '#EAB308', '#FB923C', '#0EA5E9', '#A78BFA', '#10B981', '#6366F1', '#F97316', '#14B8A6', '#8B5CF6'];

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
                      <option value="年少">年少</option>
                      <option value="年中">年中</option>
                      <option value="年長">年長</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-paragraph/70 mb-1">表示色</label>
                    <div className="flex gap-1 items-center flex-wrap">
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border border-secondary/30"
                      />
                      {classColors.map(c => (
                        <button
                          key={c}
                          onClick={() => setEditForm({ ...editForm, color: c })}
                          className={`w-5 h-5 rounded-full border-2 transition-transform ${editForm.color === c ? 'border-headline scale-110' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
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

export default function SettingsPage() {
  const { settings, updateSettings, shiftPatterns, setShiftPatterns } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('H');

  const renderSection = () => {
    switch (activeTab) {
      case 'A': return <SectionA settings={settings} onUpdate={updateSettings} />;
      case 'B': return <SectionB settings={settings} onUpdate={updateSettings} />;
      case 'C': return <SectionC settings={settings} onUpdate={updateSettings} />;
      case 'D': return <SectionD settings={settings} onUpdate={updateSettings} />;
      case 'E': return <SectionE settings={settings} onUpdate={updateSettings} />;
      case 'F': return <SectionF settings={settings} onUpdate={updateSettings} />;
      case 'G': return <SectionG patterns={shiftPatterns} onUpdate={setShiftPatterns} />;
      case 'H': return <SectionH settings={settings} onUpdate={updateSettings} />;
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-xl font-bold text-headline">園の設定</h1>
          <p className="text-sm text-paragraph/60 mt-1">学校基本調査の項目構造に基づく設定</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
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
