/*
  # Service Desk Ticketing System Schema

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Category name (IT, HR, Facilities, etc.)
      - `description` (text) - Category description
      - `color` (text) - Display color for UI
      - `created_at` (timestamptz)
    
    - `priorities`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Priority level (Low, Medium, High, Critical)
      - `level` (integer) - Numeric level for sorting
      - `color` (text) - Display color for UI
      - `created_at` (timestamptz)
    
    - `statuses`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Status name (Open, In Progress, Resolved, Closed)
      - `order` (integer) - Display order
      - `color` (text) - Display color for UI
      - `is_closed` (boolean) - Whether this status means ticket is closed
      - `created_at` (timestamptz)
    
    - `tickets`
      - `id` (uuid, primary key)
      - `ticket_number` (text, unique) - Auto-generated ticket number
      - `title` (text) - Ticket title/subject
      - `description` (text) - Detailed description
      - `category_id` (uuid, foreign key)
      - `priority_id` (uuid, foreign key)
      - `status_id` (uuid, foreign key)
      - `requester_name` (text) - Person reporting the issue
      - `requester_email` (text) - Contact email
      - `assigned_to` (text) - Assigned staff member
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `resolved_at` (timestamptz, nullable)
      - `closed_at` (timestamptz, nullable)
    
    - `ticket_comments`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, foreign key)
      - `comment` (text) - Comment text
      - `author_name` (text) - Who wrote the comment
      - `is_internal` (boolean) - Internal note vs public comment
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access for categories, priorities, and statuses
    - Public access for tickets and comments (service desk system)
    
  3. Important Notes
    - Ticket numbers are auto-generated using format SD-YYYYMMDD-XXXX
    - Indexes added for performance on frequently queried columns
    - Timestamps track ticket lifecycle
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);

-- Create priorities table
CREATE TABLE IF NOT EXISTS priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  level integer NOT NULL,
  color text DEFAULT '#6b7280',
  created_at timestamptz DEFAULT now()
);

-- Create statuses table
CREATE TABLE IF NOT EXISTS statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  "order" integer NOT NULL,
  color text DEFAULT '#6b7280',
  is_closed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  category_id uuid REFERENCES categories(id) NOT NULL,
  priority_id uuid REFERENCES priorities(id) NOT NULL,
  status_id uuid REFERENCES statuses(id) NOT NULL,
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  assigned_to text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  closed_at timestamptz
);

-- Create ticket_comments table
CREATE TABLE IF NOT EXISTS ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  comment text NOT NULL,
  author_name text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status_id);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_comments_ticket ON ticket_comments(ticket_id);

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  date_part text;
  sequence_num integer;
  ticket_num text;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM tickets
  WHERE ticket_number LIKE 'SD-' || date_part || '-%';
  
  ticket_num := 'SD-' || date_part || '-' || LPAD(sequence_num::text, 4, '0');
  
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticket_timestamp
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default categories
INSERT INTO categories (name, description, color) VALUES
  ('IT Support', 'Technical issues, software, hardware', '#3b82f6'),
  ('HR', 'Human resources inquiries', '#8b5cf6'),
  ('Facilities', 'Office maintenance, equipment', '#10b981'),
  ('Finance', 'Billing, expenses, payments', '#f59e0b'),
  ('General', 'Other requests', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Insert default priorities
INSERT INTO priorities (name, level, color) VALUES
  ('Low', 1, '#10b981'),
  ('Medium', 2, '#f59e0b'),
  ('High', 3, '#ef4444'),
  ('Critical', 4, '#dc2626')
ON CONFLICT (name) DO NOTHING;

-- Insert default statuses
INSERT INTO statuses (name, "order", color, is_closed) VALUES
  ('Open', 1, '#3b82f6', false),
  ('In Progress', 2, '#f59e0b', false),
  ('Waiting', 3, '#8b5cf6', false),
  ('Resolved', 4, '#10b981', false),
  ('Closed', 5, '#6b7280', true)
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (public read)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

-- RLS Policies for priorities (public read)
CREATE POLICY "Anyone can view priorities"
  ON priorities FOR SELECT
  USING (true);

-- RLS Policies for statuses (public read)
CREATE POLICY "Anyone can view statuses"
  ON statuses FOR SELECT
  USING (true);

-- RLS Policies for tickets (public access for service desk)
CREATE POLICY "Anyone can view tickets"
  ON tickets FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update tickets"
  ON tickets FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete tickets"
  ON tickets FOR DELETE
  USING (true);

-- RLS Policies for ticket_comments (public access)
CREATE POLICY "Anyone can view comments"
  ON ticket_comments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create comments"
  ON ticket_comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update comments"
  ON ticket_comments FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete comments"
  ON ticket_comments FOR DELETE
  USING (true);