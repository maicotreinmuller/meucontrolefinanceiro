/*
  # Add payment type and installments support

  1. Changes to transactions table
    - Add payment_type column (debit/credit)
    - Add account_type column (bank_account/credit_card)
    - Add installment fields
    - Add reference_id for grouping installments

  2. Notes
    - payment_type is only required for expenses
    - installment fields are only used for credit card payments
    - reference_id groups related installment transactions
*/

-- Add new columns to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS payment_type text CHECK (payment_type IN ('debit', 'credit')),
ADD COLUMN IF NOT EXISTS account_type text CHECK (account_type IN ('bank_account', 'credit_card')),
ADD COLUMN IF NOT EXISTS installment_number integer,
ADD COLUMN IF NOT EXISTS total_installments integer,
ADD COLUMN IF NOT EXISTS reference_id uuid,
ADD COLUMN IF NOT EXISTS due_date date,
ADD COLUMN IF NOT EXISTS description text;

-- Create index for reference_id to improve query performance
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON transactions(reference_id);

-- Add constraint to ensure installment fields are filled when needed
ALTER TABLE transactions
ADD CONSTRAINT check_installments 
CHECK (
  (payment_type = 'credit' AND installment_number IS NOT NULL AND total_installments IS NOT NULL) OR
  (payment_type != 'credit')
);

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
    WHERE id = account_id
  )
);