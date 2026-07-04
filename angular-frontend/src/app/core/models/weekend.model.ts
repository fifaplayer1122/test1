export type WeekendStatus = 'available' | 'partial' | 'unavailable';

export interface WeekendAvailability {
  id: number;
  member_id: number;
  member_name?: string;
  member_email?: string;
  saturday_status: WeekendStatus;
  saturday_time?: string;
  saturday_details?: string;
  sunday_status: WeekendStatus;
  sunday_time?: string;
  sunday_details?: string;
  week_of?: string;
  updated_at?: string;
}

export interface UpdateWeekendDto {
  saturday_status: WeekendStatus;
  saturday_time?: string;
  saturday_details?: string;
  sunday_status: WeekendStatus;
  sunday_time?: string;
  sunday_details?: string;
}
