/*
  # Fix installment transaction validation

  1. Changes
    - Update validate_installment_transaction function
    - Improve date validation for installments
    - Ensure proper due date progression
    
  2. Notes
    - First installment due date can be same as transaction date
    - Subsequent installments must have later due dates
    - Maintains data consistency across all installments
*/

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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;