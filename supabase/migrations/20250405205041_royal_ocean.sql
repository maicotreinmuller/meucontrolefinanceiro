/*
  # Create banking accounts and cards tables

  1. New Tables
    - `bank_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `type` (text) - 'account' or 'credit_card'
      - `bank_name` (text)
      - `color` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  bank_name text NOT NULL,
  color text NOT NULL DEFAULT '#1e40af',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT bank_accounts_type_check CHECK (type IN ('account', 'credit_card'))
);

-- Enable RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own accounts"
  ON bank_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON bank_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON bank_accounts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to initialize default accounts
CREATE OR REPLACE FUNCTION initialize_user_accounts(user_uuid uuid)
RETURNS void AS $$
BEGIN
  -- Insert default credit cards
  INSERT INTO bank_accounts (user_id, name, type, bank_name, color)
  VALUES
    (user_uuid, 'Nubank Mastercard', 'credit_card', 'Nubank', '#820ad1'),
    (user_uuid, 'Itaú Mastercard', 'credit_card', 'Itaú', '#ec7000'),
    (user_uuid, 'Bradesco Mastercard', 'credit_card', 'Bradesco', '#cc092f'),
    (user_uuid, 'Santander Mastercard', 'credit_card', 'Santander', '#ec0000'),
    (user_uuid, 'Banco do Brasil Elo', 'credit_card', 'Banco do Brasil', '#fae128');

  -- Insert default bank accounts
  INSERT INTO bank_accounts (user_id, name, type, bank_name, color)
  VALUES
    (user_uuid, 'Conta Corrente', 'account', 'Banco do Brasil', '#fae128'),
    (user_uuid, 'Conta Digital', 'account', 'Itaú', '#ec7000'),
    (user_uuid, 'Conta Corrente', 'account', 'Bradesco', '#cc092f'),
    (user_uuid, 'Conta Digital', 'account', 'Santander', '#ec0000'),
    (user_uuid, 'Conta Digital', 'account', 'Nubank', '#820ad1');
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for new users
CREATE OR REPLACE FUNCTION initialize_accounts_for_new_user()
RETURNS trigger AS $$
BEGIN
  PERFORM initialize_user_accounts(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created_accounts ON auth.users;
CREATE TRIGGER on_auth_user_created_accounts
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_accounts_for_new_user();

-- Initialize accounts for existing users
DO $$
DECLARE
  user_row RECORD;
BEGIN
  FOR user_row IN SELECT id FROM auth.users
  LOOP
    PERFORM initialize_user_accounts(user_row.id);
  END LOOP;
END;
$$;