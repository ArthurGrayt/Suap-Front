export interface Task {
  id: string;
  suap_id: string;
  subject: string;
  clean_subject?: string;
  discipline_id: string;
  title: string;
  description: string | null;
  etapa: string | null;
  requested_at: string | null;
  deadline: string;
  submission_count: number;
  attachment_url: string | null;
  submitted_at?: string | null;
  status: 'pending' | 'expired' | 'completed';
  notified_critical: boolean;
  created_at: string;
  updated_at: string;
}
