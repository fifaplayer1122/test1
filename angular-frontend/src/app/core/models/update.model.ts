export interface TeamUpdate {
  id: number;
  member_id: number;
  member_name?: string;
  member_email?: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateUpdateDto {
  content: string;
}
