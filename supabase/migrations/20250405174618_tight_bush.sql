/*
  # Add color column to categories table

  1. Changes
    - Add 'color' column to categories table
      - Type: text
      - Not nullable
      - Set default colors based on category type
  
  2. Notes
    - First adds the column with a temporary default
    - Then updates existing rows with correct colors
    - Finally alters the column to set the appropriate default for new rows
*/

-- Add color column with a temporary default
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#22c55e';

-- Update existing rows with appropriate colors
UPDATE categories 
SET color = CASE 
  WHEN type = 'income' THEN '#22c55e'
  ELSE '#ef4444'
END;

-- Set the default value for new rows to green (income default)
ALTER TABLE categories 
ALTER COLUMN color SET DEFAULT '#22c55e';