/*
  # Enhance installment transaction system

  1. Changes
    - Add new constraints for installment validation
    - Add function to handle installment creation
    - Add trigger for automatic installment generation
    - Update existing transaction constraints
    
  2. Notes
    - Ensures proper date handling for installments
    - Validates installment amounts and dates
    - Maintains data consistency
*/

-- Add new constraints for installment transactions
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS ensure_valid_installments,
ADD CONSTRAINT ensure_valid_installments CHECK (
  (installment_number IS NULL AND total_installments IS NULL) OR
  (installment_number > 0 AND total_installments > 0 AND installment_number <= total_installments)
);

-- Create function to calculate installment dates
CREATE OR REPLACE FUNCTION calculate_installment_dates(
  base_date date,
  total_installments integer,
  is_first_installment boolean DEFAULT false
)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  due_date date;
  base_day integer;
BEGIN
  -- Get the day from the base date
  base_day := EXTRACT(DAY FROM base_date);
  
  IF is_first_installment THEN
    -- First installment is due on the base date
    RETURN base_date;
  ELSE
    -- Calculate next month's date while preserving the day
    due_date := base_date + (interval '1 month' * (total_installments - 1));
    
    -- Adjust for months with fewer days
    IF EXTRACT(DAY FROM due_date) != base_day THEN
      -- If the original day doesn't exist in the target month,
      -- use the last day of that month
      due_date := date_trunc('month', due_date) + interval '1 month' - interval '1 day';
    END IF;
    
    RETURN due_date;
  END IF;
END;
$$;

-- Create function to handle installment creation
CREATE OR REPLACE FUNCTION create_installment_transactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  installment_amount numeric;
  total_amount numeric;
  installment_date date;
  installment_description text;
  last_installment_adjustment numeric;
BEGIN
  -- Only proceed if this is a credit card installment transaction
  IF NEW.payment_type = 'credit' AND NEW.total_installments > 1 THEN
    -- Calculate base installment amount (rounded to 2 decimal places)
    installment_amount := ROUND((NEW.amount / NEW.total_installments)::numeric, 2);
    
    -- Calculate total amount after rounding
    total_amount := installment_amount * NEW.total_installments;
    
    -- Calculate adjustment needed for last installment
    last_installment_adjustment := NEW.amount - total_amount;
    
    -- Create all installments
    FOR i IN 1..NEW.total_installments LOOP
      -- Calculate installment date
      installment_date := calculate_installment_dates(
        NEW.date,
        i,
        i = 1
      );
      
      -- Create description with installment number
      installment_description := CASE 
        WHEN NEW.description IS NOT NULL AND NEW.description != ''
        THEN NEW.description || ' - ' || i || '/' || NEW.total_installments
        ELSE NEW.category || ' - ' || i || '/' || NEW.total_installments
      END;
      
      -- Insert installment
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
      ) VALUES (
        NEW.user_id,
        CASE 
          -- Add adjustment to last installment if needed
          WHEN i = NEW.total_installments 
          THEN installment_amount + last_installment_adjustment
          ELSE installment_amount
        END,
        NEW.category,
        NEW.type,
        NEW.date,
        installment_description,
        NEW.account_id,
        'credit',
        'credit_card',
        i,
        NEW.total_installments,
        COALESCE(NEW.reference_id, gen_random_uuid()),
        installment_date
      );
    END LOOP;
    
    -- Prevent the original transaction from being inserted
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for installment creation
DROP TRIGGER IF EXISTS create_installments_trigger ON transactions;
CREATE TRIGGER create_installments_trigger
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_installment_transactions();

-- Update validation function
CREATE OR REPLACE FUNCTION validate_installment_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For credit card installments
  IF NEW.payment_type = 'credit' AND NEW.total_installments > 1 THEN
    -- Validate installment number range
    IF NEW.installment_number IS NOT NULL THEN
      IF NEW.installment_number < 1 OR NEW.installment_number > NEW.total_installments THEN
        RAISE EXCEPTION 'Invalid installment number';
      END IF;
      
      -- Limit maximum installments to 24
      IF NEW.total_installments > 24 THEN
        RAISE EXCEPTION 'Maximum number of installments is 24';
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
$$;

-- Recreate validation trigger
DROP TRIGGER IF EXISTS validate_installment_transaction_trigger ON transactions;
CREATE TRIGGER validate_installment_transaction_trigger
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_installment_transaction();