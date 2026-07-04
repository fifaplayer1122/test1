export type ApprovalCategory = 'software' | 'hardware' | 'service' | 'travel' | 'access' | 'other';
export type ApprovalPriority = 'Urgent' | 'Normal' | 'Low';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: number;
  member_id: number;
  member_name?: string;
  member_email?: string;
  title: string;
  category: ApprovalCategory;
  reason: string;
  cost: number;
  priority: ApprovalPriority;
  status: ApprovalStatus;
  decision_notes?: string;
  decided_by?: string;
  decided_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateApprovalDto {
  title: string;
  category: ApprovalCategory;
  reason: string;
  cost: number;
  priority: ApprovalPriority;
}

export interface DecideApprovalDto {
  status: 'approved' | 'rejected';
  decision_notes?: string;
}
