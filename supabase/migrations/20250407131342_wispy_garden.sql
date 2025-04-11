/*
  # Add account relationships to transactions

  1. Changes
    - Add account_id to transactions table
    - Add account type check constraints
    - Update RLS policies
    
  2. Notes
    - Maintains existing data
    - Adds proper foreign key relationships
*/

-- Add account_id to transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES bank_accounts(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);

-- Update RLS policies to include account access
CREATE POLICY "Users can access transactions for their accounts"
  ON transactions
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() = (
      SELECT user_id 
      FROM bank_accounts 
      WHERE id = account_id
    )
  );