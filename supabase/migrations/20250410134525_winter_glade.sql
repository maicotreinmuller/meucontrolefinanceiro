/*
  # Update transaction date handling

  1. Changes
    - Add trigger to sync due_date with transaction date
    - Update validation function
    - Modify installment date calculation
    
  2. Notes
    - Ensures due_date is always set correctly
    - Maintains data consistency
*/

-- Update validation function
CREATE OR REPLACE FUNCTION validate_installment_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For credit card transactions
  IF NEW.payment_type = 'credit' THEN
    -- Set due_date to transaction date if not provided
    IF NEW.due_date IS NULL THEN
      NEW.due_date := NEW.date;
    END IF;

    -- For installments
    IF NEW.total_installments > 1 THEN
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
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Update installment creation function
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
      -- Calculate installment date (same as transaction date for first installment)
      installment_date := CASE
        WHEN i = 1 THEN NEW.date
        ELSE NEW.date + (interval '1 month' * (i - 1))
      END;
      
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
        installment_date,
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