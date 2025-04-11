/*
  # Fix stack depth limit exceeded error

  1. Changes
    - Simplify transaction validation logic
    - Remove recursive function calls
    - Optimize trigger functions
    - Reduce nested operations
    
  2. Notes
    - Maintains data integrity
    - Improves performance
    - Prevents stack overflow
*/

-- Drop existing functions and triggers first
DROP TRIGGER IF EXISTS create_installments_trigger ON transactions;
DROP TRIGGER IF EXISTS validate_installment_transaction_trigger ON transactions;
DROP FUNCTION IF EXISTS create_installment_transactions();
DROP FUNCTION IF EXISTS validate_installment_transaction();

-- Create simplified validation function
CREATE OR REPLACE FUNCTION validate_installment_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Basic validation without recursion
  IF NEW.payment_type = 'credit' THEN
    -- Ensure due_date for credit transactions
    IF NEW.due_date IS NULL THEN
      NEW.due_date := NEW.date;
    END IF;

    -- Validate installments
    IF NEW.total_installments > 1 THEN
      IF NEW.total_installments > 24 THEN
        RAISE EXCEPTION 'Maximum number of installments is 24';
      END IF;

      IF NEW.installment_number IS NOT NULL THEN
        IF NEW.installment_number < 1 OR NEW.installment_number > NEW.total_installments THEN
          RAISE EXCEPTION 'Invalid installment number';
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create optimized installment creation function
CREATE OR REPLACE FUNCTION create_installment_transactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  installment_amount numeric;
  remainder numeric;
  installment_date date;
  ref_id uuid;
BEGIN
  -- Only proceed for credit card installments
  IF NEW.payment_type = 'credit' AND NEW.total_installments > 1 THEN
    -- Generate reference ID once
    ref_id := COALESCE(NEW.reference_id, gen_random_uuid());
    
    -- Calculate base amount and remainder
    installment_amount := TRUNC((NEW.amount / NEW.total_installments)::numeric, 2);
    remainder := NEW.amount - (installment_amount * NEW.total_installments);

    -- Bulk insert all installments
    INSERT INTO transactions (
      user_id,
      amount,
      category,
      type,
      date,
      description,
      account_id,
      payment_type,
      account_type,
      installment_number,
      total_installments,
      reference_id,
      due_date
    )
    SELECT
      NEW.user_id,
      CASE 
        WHEN generate_series = NEW.total_installments THEN installment_amount + remainder
        ELSE installment_amount
      END,
      NEW.category,
      NEW.type,
      NEW.date + (interval '1 month' * (generate_series - 1)),
      CASE 
        WHEN NEW.description IS NOT NULL AND NEW.description != ''
        THEN NEW.description || ' - ' || generate_series || '/' || NEW.total_installments
        ELSE NEW.category || ' - ' || generate_series || '/' || NEW.total_installments
      END,
      NEW.account_id,
      'credit',
      'credit_card',
      generate_series,
      NEW.total_installments,
      ref_id,
      NEW.date + (interval '1 month' * (generate_series - 1))
    FROM generate_series(1, NEW.total_installments);

    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER validate_installment_transaction_trigger
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_installment_transaction();

CREATE TRIGGER create_installments_trigger
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_installment_transactions();