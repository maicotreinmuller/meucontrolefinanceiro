/*
  # Fix installments constraint and add validation

  1. Changes
    - Update check_installments constraint with proper validation
    - Add trigger function to validate installment data
    - Add trigger to enforce validation on insert/update

  2. Notes
    - Ensures installment data is valid or null
    - Validates installment numbers are within valid range
    - Maintains data consistency for all transactions
*/

-- Drop existing constraint
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS check_installments;

-- Add new constraint with proper validation
ALTER TABLE transactions
ADD CONSTRAINT check_installments CHECK (
  (payment_type != 'credit' AND total_installments IS NULL AND installment_number IS NULL) OR
  (payment_type = 'credit' AND (
    (total_installments IS NULL AND installment_number IS NULL) OR
    (total_installments >= 1 AND installment_number >= 1 AND installment_number <= total_installments)
  ))
);

-- Create function to validate installment data
CREATE OR REPLACE FUNCTION validate_installment_transaction()
RETURNS trigger AS $$
BEGIN
  -- Validate parent transaction
  IF NEW.parent_id IS NULL AND NEW.reference_id IS NOT NULL AND NEW.total_installments > 1 THEN
    -- Parent transaction should have total amount and no installment number
    NEW.installment_number := NULL;
  END IF;

  -- Validate child transactions
  IF NEW.parent_id IS NOT NULL AND NEW.total_installments > 1 THEN
    -- Ensure installment_number is within valid range
    IF NEW.installment_number < 1 OR NEW.installment_number > NEW.total_installments THEN
      RAISE EXCEPTION 'Invalid installment number';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_installment_transaction_trigger ON transactions;

CREATE TRIGGER validate_installment_transaction_trigger
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_installment_transaction();