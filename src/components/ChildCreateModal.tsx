'use client';

import { useState } from 'react';
import { ChildWithGrowth } from '@/lib/childrenStore';
import { GrowthDomain } from '@/types/child';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (child: ChildWithGrowth) => void;
}

const GRADES = ['年少', '年中', '年長'] as const;

const DEFAULT_DOMAINS: GrowthDomain[] = [
  'health',
  'relationships',
  'environment',
  'language',
  'expression',
];

export default function ChildCreateModal({ open, onClose, onCreate }: Props) {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastNameKanji, setLastNameKanji] = useState('');
  const [firstNameKanji, setFirstNameKanji] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [grade, setGrade] = useState<(typeof GRADES)[number]>('年中');
  const [className, setClassName] = useState('');
  const [allergies, setAllergies] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setLastName('');
    setFirstName('');
    setLastNameKanji('');
    setFirstNameKanji('');
    setBirthDate('');
    setGender('male');
    setGrade('年中');
    setClassName('');
    setAllergies('');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName || !firstName || !className) {
      setError('姓・名・クラスは必須です');
      return;
    }
    const now = new Date();
    const newChild: ChildWithGrowth = {
      id: `child-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      firstName,
      lastName,
      firstNameKanji: firstNameKanji || undefined,
      lastNameKanji: lastNameKanji || undefined,
      birthDate: birthDate ? new Date(birthDate) : new Date(),
      classId: className,
      className,
      grade,
      gender,
      allergies: allergies.split(/[,、]/).map((s) => s.trim()).filter(Boolean),
      characteristics: [],
      interests: [],
      relationships: [],
      emergencyContact: { name: '', phone: '', relationship: '' },
      createdAt: now,
      updatedAt: now,
      growthLevels: DEFAULT_DOMAINS.map((domain) => ({
        domain,
        level: 1 as const,
        lastUpdated: now,
        linkedEpisodeIds: [],
      })),
    };
    onCreate(newChild);
    reset();
    onClose();
  };

  const inputClass =
    'w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30';
  const labelClass = 'block text-xs text-paragraph/70 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-secondary/20 flex items-center justify-between sticky top-0 bg-surface">
          <h2 className="text-lg font-bold text-headline">園児を追加</h2>
          <button onClick={onClose} className="text-paragraph/60 hover:text-paragraph">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>姓（ひらがな）*</label>
              <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>名（ひらがな）*</label>
              <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>姓（漢字）</label>
              <input className={inputClass} value={lastNameKanji} onChange={(e) => setLastNameKanji(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>名（漢字）</label>
              <input className={inputClass} value={firstNameKanji} onChange={(e) => setFirstNameKanji(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>生年月日</label>
              <input type="date" className={inputClass} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>性別</label>
              <select className={inputClass} value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}>
                <option value="male">男の子</option>
                <option value="female">女の子</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>学年 *</label>
              <select className={inputClass} value={grade} onChange={(e) => setGrade(e.target.value as (typeof GRADES)[number])}>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>クラス *</label>
              <input className={inputClass} value={className} onChange={(e) => setClassName(e.target.value)} placeholder="例: さくら組" required />
            </div>
          </div>
          <div>
            <label className={labelClass}>アレルギー（カンマ区切り）</label>
            <input className={inputClass} value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="卵, 乳製品" />
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-secondary/30 rounded-lg text-paragraph hover:bg-secondary/10">
              キャンセル
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-button text-white rounded-lg hover:bg-button/90">
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
