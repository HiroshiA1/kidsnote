export interface NewYearClassSetup {
  classId: string;
  className: string;
  grade: '未就園児' | '満3歳児' | '年少' | '年中' | '年長';
  color: string;
  assignedTeacherId?: string;
  assignedSubTeacherId?: string;
}

export interface ChildClassAssignment {
  childId: string;
  fromClassId: string;
  toClassId: string;
  fromGrade: string;
  toGrade: string;
}

export type NewYearSetupStatus = 'draft' | 'in_progress' | 'confirmed';

export interface NewYearSetup {
  id: string;
  targetFiscalYear: number;
  classes: NewYearClassSetup[];
  childAssignments: ChildClassAssignment[];
  annualPlanGenerated: boolean;
  status: NewYearSetupStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const GRADE_ORDER: string[] = ['未就園児', '満3歳児', '年少', '年中', '年長'];

export function getNextGrade(current: string): string {
  const idx = GRADE_ORDER.indexOf(current);
  if (idx < 0 || idx >= GRADE_ORDER.length - 1) return current;
  return GRADE_ORDER[idx + 1];
}
