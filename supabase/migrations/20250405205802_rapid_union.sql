/*
  # Update bank accounts table and add bank colors

  1. Changes
    - Add bank_colors table for predefined color schemes
    - Update bank_accounts table structure
    - Add new default colors for banks

  2. Notes
    - Preserves existing data
    - Adds common Brazilian bank colors
*/

-- Create bank_colors table for predefined colors
CREATE TABLE IF NOT EXISTS bank_colors (
  bank_name text PRIMARY KEY,
  color text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert predefined bank colors
INSERT INTO bank_colors (bank_name, color)
VALUES
  ('Nubank', '#820ad1'),
  ('Itaú', '#ec7000'),
  ('Bradesco', '#cc092f'),
  ('Santander', '#ec0000'),
  ('Banco do Brasil', '#fae128'),
  ('Caixa', '#1c5ca5'),
  ('Inter', '#ff7a00'),
  ('C6 Bank', '#242424'),
  ('Next', '#00ff5f'),
  ('PicPay', '#11c76f'),
  ('XP', '#000000'),
  ('BTG Pactual', '#0d2535')
ON CONFLICT (bank_name) DO UPDATE
SET color = EXCLUDED.color;

-- Update bank_accounts table
ALTER TABLE bank_accounts
ALTER COLUMN name TYPE text,
ALTER COLUMN bank_name TYPE text;