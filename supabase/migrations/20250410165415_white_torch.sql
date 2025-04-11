/*
  # Add recurring transactions support

  1. Changes
    - Add frequency_type and frequency_value columns to transactions table
    - Add reference_id to link recurring transactions
    - Add constraints and indexes for new fields
    
  2. Notes
    - frequency_type can be 'daily', 'weekly', 'monthly', 'yearly'
    - frequency_value determines how many times the transaction repeats
    - reference_id groups related recurring transactions
*/

-- Add new columns for recurring transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS frequency_type text CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS frequency_value integer CHECK (frequency_value > 0),
ADD COLUMN IF NOT EXISTS reference_id uuid;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON transactions(reference_id);

-- Create function to handle recurring transactions
CREATE OR REPLACE FUNCTION create_recurring_transactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  interval_value interval;
  next_date date;
  ref_id uuid;
BEGIN
  -- Only proceed if this is a recurring transaction
  IF NEW.frequency_type IS NOT NULL AND NEW.frequency_value > 0 THEN
    -- Generate reference ID
    ref_id := COALESCE(NEW.reference_id, gen_random_uuid());
    
    -- Calculate interval based on frequency type
    interval_value := CASE NEW.frequency_type
      WHEN 'daily' THEN interval '1 day'
      WHEN 'weekly' THEN interval '1 week'
      WHEN 'monthly' THEN interval '1 month'
      WHEN 'yearly' THEN interval '1 year'
    END;

    -- Create recurring transactions
    FOR i IN 1..NEW.frequency_value LOOP
      next_date := NEW.date + (interval_value * (i - 1));
      
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
        reference_id,
        frequency_type,
        frequency_value
      ) VALUES (
        NEW.user_id,
        NEW.amount,
        NEW.category,
        NEW.type,
        next_date,
        NEW.description,
        NEW.account_id,
        NEW.payment_type,
        NEW.account_type,
        ref_id,
        CASE WHEN i = 1 THEN NEW.frequency_type ELSE NULL END,
        CASE WHEN i = 1 THEN NEW.frequency_value ELSE NULL END
      );
    END LOOP;
    
    -- Prevent the original transaction from being inserted
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for recurring transactions
DROP TRIGGER IF EXISTS create_recurring_transactions_trigger ON transactions;
CREATE TRIGGER create_recurring_transactions_trigger
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_recurring_transactions();