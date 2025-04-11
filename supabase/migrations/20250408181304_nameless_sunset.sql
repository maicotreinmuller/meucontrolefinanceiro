/*
  # Fix due date handling for transactions

  1. Changes
    - Update existing data to ensure consistency
    - Modify due_date column constraints
    - Add new check constraints for proper due date handling
    
  2. Notes
    - First updates existing data to prevent constraint violations
    - Then adds new constraints to enforce rules going forward
*/

-- First, update existing data to ensure consistency
UPDATE transactions
SET due_date = NULL
WHERE payment_type != 'credit';

UPDATE transactions
SET due_date = date
WHERE payment_type = 'credit' AND due_date IS NULL;

-- Allow NULL values for due_date if not already nullable
DO $$ 
BEGIN
  ALTER TABLE transactions ALTER COLUMN due_date DROP NOT NULL;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Drop existing constraints if they exist
DO $$ 
BEGIN
  ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_installment_due_date;
  ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_due_date_credit_only;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add new check constraint for credit card transactions
ALTER TABLE transactions
ADD CONSTRAINT check_due_date_credit_only
CHECK (
  (payment_type IS NULL) OR
  (payment_type = 'credit' AND due_date IS NOT NULL) OR
  (payment_type = 'debit' AND due_date IS NULL)
);

-- Add check constraint for installment transactions
ALTER TABLE transactions
ADD CONSTRAINT check_installment_due_date
CHECK (
  (group_type IS NULL) OR
  (group_type = 'installment' AND due_date IS NOT NULL) OR
  (group_type = 'recurring')
);