/*
  # Update bank colors and add new suggestions

  1. Changes
    - Update existing bank colors with accurate brand colors
    - Add new banks to the bank_colors table
    - Ensure colors match real bank branding

  2. Notes
    - Colors are carefully selected to match official bank branding
    - Using DO block for safe updates
*/

-- First, clear existing colors to ensure clean state
TRUNCATE TABLE bank_colors;

-- Insert updated bank colors
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
ON CONFLICT (bank_name) 
DO UPDATE SET color = EXCLUDED.color;

-- Update existing bank accounts with new colors
DO $$
DECLARE
  bank RECORD;
BEGIN
  FOR bank IN SELECT bank_name, color FROM bank_colors
  LOOP
    UPDATE bank_accounts
    SET color = bank.color
    WHERE bank_name = bank.bank_name;
  END LOOP;
END $$;