'use client';

import { useState } from 'react';
import { ChildWithGrowth } from '@/lib/childrenStore';

interface ChildEditModalProps {
  child: ChildWithGrowth;
  onSave: (child: ChildWithGrowth) => void;
  onClose: () => void;
}

export function ChildEditModal({ child, onSave, onClose }: ChildEditModalProps) {
  const [form, setForm] = useState({
    firstName: child.firstName,
    lastName: child.lastName,
    firstNameKanji: child.firstNameKanji || '',
    lastNameKanji: child.lastNameKanji || '',
    className: child.className,
    gender: child.gender,
    allergies: child.allergies.join(', '),
    characteristics: child.characteristics.join(', '),
    interests: (child.interests || []).join(', '),
    emergencyName: child.emergencyContact.name,
    emergencyPhone: child.emergencyContact.phone,
    emergencyRelationship: child.emergencyContact.relationship,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ChildWithGrowth = {
      ...child,
      firstName: form.firstName,
      lastName: form.lastName,
      firstNameKanji: form.firstNameKanji || undefined,
      lastNameKanji: form.lastNameKanji || undefined,
      className: form.className,
      gender: form.gender,
      allergies: form.allergies.split(/[,、]/).map(s => s.trim()).filter(Boolean),
      characteristics: form.characteristics.split(/[,、]/).map(s => s.trim()).filter(Boolean),
      interests: form.interests.split(/[,、]/).map(s => s.trim()).filter(Boolean),
      emergencyContact: {
        name: form.emergencyName,
        phone: form.emergencyPhone,
        relationship: form.emergencyRelationship,
      },
      updatedAt: new Date(),
    };
    onSave(updated);
  };

  const inputClass = "w-full px-3 py-2 bg-surface border border-secondary/30 rounded-lg text-sm text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30";
  const labelClass = "block text-sm font-medium text-paragraph/70 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface px-6 py-4 border-b border-secondary/20 flex items-center justify-between">
          <h2 className="text-lg font-bold text-headline">園児情報を編集</h2>
          <button onClick={onClose} className="text-paragraph/60 hover:text-paragraph text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>姓（ひらがな）</label>
              <input className={inputClass} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>名（ひらがな）</label>
              <input className={inputClass} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>姓（漢字）</label>
              <input className={inputClass} value={form.lastNameKanji} onChange={e => setForm(f => ({ ...f, lastNameKanji: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>名（漢字）</label>
              <input className={inputClass} value={form.firstNameKanji} onChange={e => setForm(f => ({ ...f, firstNameKanji: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>クラス</label>
              <input className={inputClass} value={form.className} onChange={e => setForm(f => ({ ...f, className: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>性別</label>
              <select className={inputClass} value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as 'male' | 'female' | 'other' }))}>
                <option value="male">男の子</option>
                <option value="female">女の子</option>
                <option value="other">その他</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>アレルギー（カンマ区切り）</label>
            <input className={inputClass} value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="卵, 乳製品" />
          </div>

          <div>
            <label className={labelClass}>特性・メモ（カンマ区切り）</label>
            <input className={inputClass} value={form.characteristics} onChange={e => setForm(f => ({ ...f, characteristics: e.target.value }))} placeholder="活発, 友達思い" />
          </div>

          <div>
            <label className={labelClass}>興味・関心（カンマ区切り）</label>
            <input className={inputClass} value={form.interests} onChange={e => setForm(f => ({ ...f, interests: e.target.value }))} placeholder="恐竜, サッカー" />
          </div>

          <fieldset className="border border-secondary/20 rounded-lg p-4">
            <legend className="text-sm font-medium text-paragraph/70 px-2">緊急連絡先</legend>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>氏名</label>
                <input className={inputClass} value={form.emergencyName} onChange={e => setForm(f => ({ ...f, emergencyName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>電話番号</label>
                  <input className={inputClass} value={form.emergencyPhone} onChange={e => setForm(f => ({ ...f, emergencyPhone: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>続柄</label>
                  <input className={inputClass} value={form.emergencyRelationship} onChange={e => setForm(f => ({ ...f, emergencyRelationship: e.target.value }))} />
                </div>
              </div>
            </div>
          </fieldset>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-button text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
              保存
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-secondary/30 text-paragraph rounded-lg font-medium hover:bg-secondary/50 transition-colors">
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
