/*
  # Update transactions table for better grouping

  1. Changes
    - Add parent_id to identify the main transaction in a group
    - Add group_type to differentiate between installments and recurring
    - Update constraints and indexes
    - Migrate existing data to new structure

  2. Notes
    - parent_id links child transactions to their parent
    - group_type helps identify how transactions should be grouped
    - Existing transactions will be updated to maintain data consistency
*/

-- Add new columns for grouping
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES transactions(id),
ADD COLUMN IF NOT EXISTS group_type text CHECK (group_type IN ('installment', 'recurring'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_parent_id ON transactions(parent_id);

-- Create function to handle transaction grouping
CREATE OR REPLACE FUNCTION group_related_transactions()
RETURNS trigger AS $$
BEGIN
  -- For new transactions that are part of a group
  IF NEW.reference_id IS NOT NULL THEN
    -- Check if a parent transaction already exists
    IF NOT EXISTS (
      SELECT 1 FROM transactions 
      WHERE reference_id = NEW.reference_id 
      AND parent_id IS NULL
    ) THEN
      -- This is the first transaction in the group, mark it as parent
      NEW.parent_id := NULL;
      NEW.group_type := CASE
        WHEN NEW.total_installments > 1 THEN 'installment'
        WHEN NEW.frequency_type IS NOT NULL THEN 'recurring'
        ELSE NULL
      END;
    ELSE
      -- This is a child transaction, link it to the parent
      NEW.parent_id := (
        SELECT id FROM transactions 
        WHERE reference_id = NEW.reference_id 
        AND parent_id IS NULL 
        LIMIT 1
      );
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

-- Create trigger for new transactions
CREATE TRIGGER group_transactions_trigger
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION group_related_transactions();

-- Migrate existing transactions to new structure
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
    -- Update the first transaction as parent
    WITH first_transaction AS (
      SELECT id 
      FROM transactions 
      WHERE reference_id = ref_record.reference_id 
      ORDER BY 
        COALESCE(installment_number, 1),
        date 
      LIMIT 1
    )
    UPDATE transactions t
    SET 
      parent_id = CASE 
        WHEN t.id = (SELECT id FROM first_transaction) THEN NULL
        ELSE (SELECT id FROM first_transaction)
      END,
      group_type = CASE
        WHEN total_installments > 1 THEN 'installment'
        WHEN frequency_type IS NOT NULL THEN 'recurring'
        ELSE NULL
      END
    WHERE t.reference_id = ref_record.reference_id;
  END LOOP;
END $$;