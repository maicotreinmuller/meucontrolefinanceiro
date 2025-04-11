/*
  # Fix installment transaction dates and validation

  1. Changes
    - Update validate_installment_transaction function
    - Add validation for transaction dates
    - Ensure proper date progression for installments
    
  2. Notes
    - Each installment should be in a different month
    - Due dates should be one month after transaction date
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

    -- Ensure due_date is set and is after transaction date
    IF NEW.due_date IS NULL OR NEW.due_date <= NEW.date THEN
      RAISE EXCEPTION 'Due date must be after transaction date';
    END IF;

    -- Validate date progression
    IF NEW.installment_number > 1 THEN
      IF NEW.date <= (SELECT date FROM transactions 
        WHERE reference_id = NEW.reference_id 
        AND installment_number = NEW.installment_number - 1
        LIMIT 1) THEN
        RAISE EXCEPTION 'Installment dates must be in ascending order';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;