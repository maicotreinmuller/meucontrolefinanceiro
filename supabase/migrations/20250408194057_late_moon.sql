/*
  # Rebuild Installment Transaction System

  1. Changes
    - Drop existing installment-related columns and constraints
    - Add new simplified installment structure
    - Update transaction validation logic
    - Clean up old data

  2. New Structure
    - Simplified installment tracking
    - Cleaner relationship between transactions
    - Better validation rules
*/

-- First, remove old installment-related columns and constraints
ALTER TABLE transactions
DROP COLUMN IF EXISTS parent_id,
DROP COLUMN IF EXISTS group_type,
DROP COLUMN IF EXISTS frequency_type,
DROP COLUMN IF EXISTS frequency_occurrences;

-- Drop old triggers and functions
DROP TRIGGER IF EXISTS validate_installment_transaction_trigger ON transactions;
DROP FUNCTION IF EXISTS validate_installment_transaction;

-- Create new validation function with simplified logic
CREATE OR REPLACE FUNCTION validate_installment_transaction()
RETURNS trigger AS $$
BEGIN
  -- For credit card installments
  IF NEW.payment_type = 'credit' AND NEW.total_installments > 1 THEN
    -- Validate installment number range
    IF NEW.installment_number IS NOT NULL THEN
      IF NEW.installment_number < 1 OR NEW.installment_number > NEW.total_installments THEN
        RAISE EXCEPTION 'Invalid installment number';
      END IF;
      
      -- Limit maximum installments to 12
      IF NEW.total_installments > 12 THEN
        RAISE EXCEPTION 'Maximum number of installments is 12';
      END IF;
    END IF;

    -- Validate due date
    IF NEW.due_date IS NULL THEN
      RAISE EXCEPTION 'Due date is required for installments';
    END IF;

    -- Ensure due date is not before transaction date
    IF NEW.due_date < NEW.date THEN
      RAISE EXCEPTION 'Due date cannot be before transaction date';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER validate_installment_transaction_trigger
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_installment_transaction();

-- Clean up existing data
UPDATE transactions
SET installment_number = NULL,
    total_installments = NULL,
    reference_id = NULL
WHERE total_installments > 12;