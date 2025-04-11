/*
  # Fix transaction grouping and installment handling

  1. Changes
    - Update group_related_transactions function to handle parent transactions correctly
    - Ensure parent transaction stores total amount
    - Fix installment and recurring transaction grouping
    
  2. Notes
    - Parent transaction now represents the total transaction
    - Child transactions represent individual installments/occurrences
    - Maintains data consistency and proper grouping
*/

-- Update the group_related_transactions function
CREATE OR REPLACE FUNCTION group_related_transactions()
RETURNS trigger AS $$
BEGIN
  -- For new transactions that are part of a group
  IF NEW.reference_id IS NOT NULL THEN
    -- Check if this is a parent transaction
    IF NOT EXISTS (
      SELECT 1 FROM transactions 
      WHERE reference_id = NEW.reference_id
    ) THEN
      -- This is the parent transaction
      NEW.parent_id := NULL;
      NEW.group_type := CASE
        WHEN NEW.total_installments > 1 THEN 'installment'
        WHEN NEW.frequency_type IS NOT NULL THEN 'recurring'
        ELSE NULL
      END;
    ELSE
      -- Get the parent transaction
      SELECT id INTO NEW.parent_id
      FROM transactions 
      WHERE reference_id = NEW.reference_id 
      AND parent_id IS NULL;

      -- Set group type
      NEW.group_type := CASE
        WHEN NEW.total_installments > 1 THEN 'installment'
        WHEN NEW.frequency_type IS NOT NULL THEN 'recurring'
        ELSE NULL
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS group_transactions_trigger ON transactions;

CREATE TRIGGER group_transactions_trigger
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION group_related_transactions();

-- Update existing transactions
DO $$
DECLARE
  ref_record RECORD;
BEGIN
  -- Process each unique reference_id
  FOR ref_record IN 
    SELECT DISTINCT reference_id 
    FROM transactions 
    WHERE reference_id IS NOT NULL
  LOOP
    -- Find the parent transaction
    WITH parent_transaction AS (
      SELECT id
      FROM transactions
      WHERE reference_id = ref_record.reference_id
      AND (
        (total_installments > 1 AND installment_number IS NULL) OR
        (frequency_type IS NOT NULL AND parent_id IS NULL)
      )
      LIMIT 1
    )
    -- Update all related transactions
    UPDATE transactions t
    SET 
      parent_id = CASE 
        WHEN t.id = (SELECT id FROM parent_transaction) THEN NULL
        ELSE (SELECT id FROM parent_transaction)
      END,
      group_type = CASE
        WHEN t.total_installments > 1 THEN 'installment'
        WHEN t.frequency_type IS NOT NULL THEN 'recurring'
        ELSE NULL
      END
    WHERE t.reference_id = ref_record.reference_id;
  END LOOP;
END $$;