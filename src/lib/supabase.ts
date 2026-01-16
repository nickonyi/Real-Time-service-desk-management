import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Category = {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
};

export type Priority = {
  id: string;
  name: string;
  level: number;
  color: string;
  created_at: string;
};

export type Status = {
  id: string;
  name: string;
  order: number;
  color: string;
  is_closed: boolean;
  created_at: string;
};

export type Ticket = {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  category_id: string;
  priority_id: string;
  status_id: string;
  requester_name: string;
  requester_email: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
};

export type TicketWithRelations = Ticket & {
  categories: Category;
  priorities: Priority;
  statuses: Status;
};

export type TicketComment = {
  id: string;
  ticket_id: string;
  comment: string;
  author_name: string;
  is_internal: boolean;
  created_at: string;
};
