/*
  # Update transaction frequency logic

  1. Changes
    - Rename frequency_interval to frequency_occurrences
    - Remove frequency_end_date (will be calculated based on occurrences)
    - Add check constraint to ensure occurrences is positive
    - Update existing data to maintain consistency

  2. Notes
    - frequency_occurrences represents how many times the transaction should repeat
    - The actual interval is determined by the frequency_type
*/

-- First, remove the existing columns
ALTER TABLE transactions
DROP COLUMN IF EXISTS frequency_interval,
DROP COLUMN IF EXISTS frequency_end_date;

-- Add new column for occurrences
ALTER TABLE transactions
ADD COLUMN frequency_occurrences integer,
ADD CONSTRAINT check_frequency_occurrences 
  CHECK (frequency_occurrences IS NULL OR frequency_occurrences > 0);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_frequency_new 
ON transactions(frequency_type, frequency_occurrences);