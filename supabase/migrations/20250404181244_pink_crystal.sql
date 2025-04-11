/*
  # Add category column to transactions table

  1. Changes
    - Add 'category' column to 'transactions' table
      - Type: text
      - Not nullable
      - No default value (required field)

  2. Notes
    - Using DO block with IF NOT EXISTS check for safety
    - Column is required for transaction categorization
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN category text NOT NULL;
  END IF;
END $$;