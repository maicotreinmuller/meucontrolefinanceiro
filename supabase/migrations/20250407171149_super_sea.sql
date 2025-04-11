/*
  # Add recurring transactions and goal linking support

  1. Changes to transactions table
    - Add frequency fields for recurring transactions
    - Add goal linking for income transactions
    - Add deposit account linking for income

  2. Notes
    - Frequency types: daily, weekly, monthly, yearly
    - All recurring transactions share a reference_id
    - Goal linking only applies to income transactions
*/

-- Add new columns to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS frequency_type text CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS frequency_interval integer,
ADD COLUMN IF NOT EXISTS frequency_end_date date,
ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES goals(id),
ADD COLUMN IF NOT EXISTS deposit_account_id uuid REFERENCES bank_accounts(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_frequency ON transactions(frequency_type, frequency_interval);
CREATE INDEX IF NOT EXISTS idx_transactions_goal_id ON transactions(goal_id);
CREATE INDEX IF NOT EXISTS idx_transactions_deposit_account_id ON transactions(deposit_account_id);

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS "Users can access transactions for their accounts" ON transactions;

CREATE POLICY "Users can access transactions for their accounts"
ON transactions
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id OR
  auth.uid() = (
    SELECT user_id 
    FROM bank_accounts 
    WHERE id = account_id OR id = deposit_account_id
  )
);