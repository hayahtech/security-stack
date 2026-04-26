
-- Add recurrence columns to bills table
ALTER TABLE public.bills 
  ADD COLUMN IF NOT EXISTS recurrence_day integer,
  ADD COLUMN IF NOT EXISTS recurrence_end_date date,
  ADD COLUMN IF NOT EXISTS parent_bill_id uuid REFERENCES public.bills(id),
  ADD COLUMN IF NOT EXISTS recurrence_count integer DEFAULT 0;

-- Update recurrence column to support more types (already exists as recurrence_type enum)
-- The existing 'recurrence' column uses recurrence_type enum. Let's add a text column instead for flexibility
ALTER TABLE public.bills 
  ADD COLUMN IF NOT EXISTS recurrence_type_text text;

-- Add index for recurring bills lookup
CREATE INDEX IF NOT EXISTS idx_bills_recurrent ON public.bills(recurrent) WHERE recurrent = true;
CREATE INDEX IF NOT EXISTS idx_bills_parent ON public.bills(parent_bill_id);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON public.bills(due_date);
