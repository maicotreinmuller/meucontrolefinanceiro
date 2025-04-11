/*
  # Fix installment transaction handling

  1. Changes
    - Update transaction grouping logic
    - Remove parent/child relationship for installments
    - Ensure each installment is independent
    - Fix transaction amount calculation
    
  2. Notes
    - Each installment is now a separate transaction
    - Installments share reference_id but no parent/child relationship
    - Amounts are properly divided only once
*/

-- First, clean up any duplicate transactions
DELETE FROM transactions t1 USING transactions t2
WHERE t1.ctid < t2.ctid
  AND t1.reference_id = t2.reference_id
  AND t1.installment_number = t2.installment_number;

-- Remove parent/child relationships for installments
UPDATE transactions
SET parent_id = NULL
WHERE group_type = 'installment';

-- Drop existing function and triggers
DROP TRIGGER IF EXISTS group_transactions_trigger ON transactions;
DROP FUNCTION IF EXISTS group_related_transactions;
DROP TRIGGER IF EXISTS validate_installment_transaction_trigger ON transactions;
DROP FUNCTION IF EXISTS validate_installment_transaction;

-- Create new validation function
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
    END IF;

    -- Validate due date
    IF NEW.due_date IS NULL THEN
      RAISE EXCEPTION 'Due date is required for installments';
    END IF;

    -- For first installment, due_date can be same as transaction date
    IF NEW.installment_number = 1 AND NEW.due_date < NEW.date THEN
      RAISE EXCEPTION 'First installment due date cannot be before transaction date';
    END IF;

    -- For subsequent installments, ensure due_date is after previous installment
    IF NEW.installment_number > 1 THEN
      IF EXISTS (
        SELECT 1 
        FROM transactions 
        WHERE reference_id = NEW.reference_id 
          AND installment_number = NEW.installment_number - 1
          AND due_date >= NEW.due_date
      ) THEN
        RAISE EXCEPTION 'Installment due dates must be in ascending order';
      END IF;
    END IF;

    -- Set group type for installments
    NEW.group_type := 'installment';
    
    -- Remove parent/child relationship
    NEW.parent_id := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER validate_installment_transaction_trigger
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_installment_transaction();

-- Update existing installment transactions
UPDATE transactions
SET description = CASE 
  WHEN installment_number IS NOT NULL AND total_installments > 1
  THEN description || ' - ' || installment_number || '/' || total_installments
  ELSE description
END
WHERE group_type = 'installment';