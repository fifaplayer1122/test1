export type PriorityLevel = 'very_high' | 'high' | 'medium' | 'low';

export interface TeamPriority {
  id: number;
  member_id: number;
  member_name?: string;
  member_email?: string;
  title: string;
  priority_level: PriorityLevel;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePriorityDto {
  title: string;
  priority_level: PriorityLevel;
}
