/*
  # Add icon column to categories table

  1. Changes
    - Add 'icon' column to categories table
      - Type: text
      - Not nullable
      - Default icon set to 'Plus'
  
  2. Notes
    - Adds icon support for category visualization
    - Uses Lucide icon names as values
*/

-- Add icon column with a default value
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT 'Plus';

-- Update existing categories with default icons if they don't have one
UPDATE categories 
SET icon = 'Plus' 
WHERE icon IS NULL;