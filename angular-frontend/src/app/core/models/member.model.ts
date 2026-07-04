export interface Member {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  azure_id?: string;
  created_at?: string;
}

export interface CreateMemberDto {
  name: string;
  email: string;
  role?: 'admin' | 'member';
  azure_id?: string;
}
