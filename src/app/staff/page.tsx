'use client';

import { useState } from 'react';
import { useApp, Staff } from '@/components/AppLayout';

const roleColors: Record<Staff['role'], string> = {
  '園長': 'bg-button text-white',
  '主任': 'bg-tertiary text-headline',
  '担任': 'bg-secondary text-headline',
  '副担任': 'bg-secondary/50 text-headline',
  'パート': 'bg-paragraph/20 text-paragraph',
};

function StaffCard({ staff }: { staff: Staff }) {
  const yearsOfService = Math.floor(
    (new Date().getTime() - staff.hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="bg-surface rounded-xl p-4 shadow-sm border border-secondary/20 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-button/10 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-button">
              {staff.lastName.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-headline">
              {staff.lastName} {staff.firstName}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[staff.role]}`}>
              {staff.role}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {staff.classAssignment && (
          <div className="flex items-center gap-2 text-paragraph/70">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>{staff.classAssignment}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-paragraph/70">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>勤続{yearsOfService}年</span>
        </div>
      </div>

      {staff.qualifications.length > 0 && (
        <div className="mt-3 pt-3 border-t border-paragraph/10">
          <div className="flex flex-wrap gap-1">
            {staff.qualifications.map((qual, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-tertiary/20 rounded-full text-paragraph">
                {qual}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffPage() {
  const { staff: staffData } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const roles = [...new Set(staffData.map(s => s.role))];

  const filteredStaff = staffData.filter(staff => {
    const matchesSearch =
      staff.firstName.includes(searchQuery) ||
      staff.lastName.includes(searchQuery);
    const matchesRole = selectedRole === 'all' || staff.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-secondary/20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-headline">職員一覧</h1>
          <span className="text-sm text-paragraph/60">{filteredStaff.length}名</span>
        </div>
      </header>

      {/* 検索・フィルター */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-paragraph/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="名前で検索..."
              className="w-full pl-10 pr-4 py-2 bg-surface border border-secondary/30 rounded-lg text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
            />
          </div>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="px-4 py-2 bg-surface border border-secondary/30 rounded-lg text-paragraph focus:outline-none focus:ring-2 focus:ring-button/30"
          >
            <option value="all">全職種</option>
            {roles.map(role => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 pb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredStaff.map(staff => (
            <StaffCard key={staff.id} staff={staff} />
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-secondary/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-paragraph/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-headline mb-2">
              該当する職員がいません
            </h2>
            <p className="text-paragraph/70">
              検索条件を変更してください
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
