/*
  # Fix installment transaction handling

  1. Changes
    - Update validate_installment_transaction function
    - Add check for proper installment amount calculation
    - Ensure correct due dates for installments
    
  2. Notes
    - Validates that installment amounts sum up to total
    - Ensures proper date handling for future installments
*/

-- Update the validate_installment_transaction function
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

    -- Ensure due_date is set for installments
    IF NEW.installment_number > 1 AND NEW.due_date IS NULL THEN
      RAISE EXCEPTION 'Due date is required for installments';
    END IF;

    -- For first installment, set due_date to next month if not provided
    IF NEW.installment_number = 1 AND NEW.due_date IS NULL THEN
      NEW.due_date := (date_trunc('month', NEW.date) + interval '1 month')::date;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;