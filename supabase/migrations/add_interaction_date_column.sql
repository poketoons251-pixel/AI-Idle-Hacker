-- Add missing interaction_date column to interaction_history table

ALTER TABLE interaction_history 
ADD COLUMN IF NOT EXISTS interaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_interaction_history_interaction_date ON interaction_history(interaction_date);

-- Update existing records to have interaction_date = created_at
UPDATE interaction_history 
SET interaction_date = created_at 
WHERE interaction_date IS NULL;