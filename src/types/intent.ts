export type IntentType = 'growth' | 'incident' | 'handover' | 'child_update' | 'add_child' | 'add_staff';

export interface GrowthData {
  child_names: string[];
  summary: string;
  tags: string[];
}

export interface IncidentData {
  location: string;
  cause: string;
  severity: 'low' | 'medium' | 'high';
  child_name: string;
  description: string;
}

export interface HandoverData {
  message: string;
  target: string;
  urgent: boolean;
}

export interface ChildUpdateData {
  child_name: string;
  field: 'allergy' | 'characteristic';
  new_value: string;
}

export interface AddChildData {
  name: string;
  class_name?: string;
  birth_date?: string;
  gender?: 'male' | 'female';
  allergies?: string[];
  notes?: string;
}

export interface AddStaffData {
  name: string;
  role?: string;
  class_name?: string;
  contact?: string;
  notes?: string;
}

export interface IntentResult {
  intent: IntentType;
  data: GrowthData | IncidentData | HandoverData | ChildUpdateData | AddChildData | AddStaffData;
  confidence?: number;
}

export interface InputMessage {
  id: string;
  content: string;
  timestamp: Date;
  result?: IntentResult;
  status: 'pending' | 'processing' | 'confirmed' | 'saved';
  isMarkedForRecord?: boolean;
  linkedToGrowthRecordId?: string;
}
