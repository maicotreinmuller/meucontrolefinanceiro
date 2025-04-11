/*
  # Fix transactions table schema and constraints

  1. Changes
    - Drop and recreate transactions table with proper constraints
    - Add check constraint to ensure due_date is present for installments
    - Add check constraint for payment types and account types
    - Add proper foreign key relationships
    - Enable RLS and add policies

  2. Security
    - Enable RLS on transactions table
    - Add policies for authenticated users to manage their transactions
    - Add policies for shared account access
*/

-- Drop existing table
DROP TABLE IF EXISTS transactions;

-- Recreate transactions table with proper constraints
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  amount numeric NOT NULL,
  category text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  date date NOT NULL,
  description text,
  
  -- Payment type fields
  account_id uuid REFERENCES bank_accounts(id),
  payment_type text CHECK (payment_type IN ('debit', 'credit')),
  account_type text CHECK (account_type IN ('bank_account', 'credit_card')),
  
  -- Installment fields
  installment_number integer,
  total_installments integer,
  reference_id uuid,
  due_date date,
  
  -- Income specific fields
  goal_id uuid REFERENCES goals(id),
  deposit_account_id uuid REFERENCES bank_accounts(id),
  
  -- Frequency fields
  frequency_type text CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  frequency_occurrences integer CHECK (frequency_occurrences IS NULL OR frequency_occurrences > 0),
  
  -- Grouping fields
  parent_id uuid REFERENCES transactions(id),
  group_type text CHECK (group_type IN ('installment', 'recurring')),
  
  created_at timestamptz DEFAULT now(),

  -- Add constraint to ensure due_date is present for installments
  CONSTRAINT ensure_due_date_for_installments 
    CHECK (
      (group_type != 'installment' AND due_date IS NULL) OR 
      (group_type = 'installment' AND due_date IS NOT NULL)
    ),

  -- Add constraint to ensure installment fields are properly set
  CONSTRAINT ensure_valid_installments 
    CHECK (
      (installment_number IS NULL AND total_installments IS NULL) OR
      (installment_number > 0 AND total_installments > 0 AND installment_number <= total_installments)
    ),

  -- Add constraint to ensure credit payments have due dates
  CONSTRAINT ensure_credit_due_date
    CHECK (
      (payment_type != 'credit' AND due_date IS NULL) OR
      (payment_type = 'credit' AND due_date IS NOT NULL)
    )
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can manage their own transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT owner_id FROM shared_accounts 
      WHERE shared_with_id = auth.uid() 
      AND status = 'accepted'
      AND (
        account_id IN (SELECT id FROM bank_accounts WHERE user_id = owner_id) OR
        deposit_account_id IN (SELECT id FROM bank_accounts WHERE user_id = owner_id)
      )
    )
  )
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_deposit_account_id ON transactions(deposit_account_id);
CREATE INDEX idx_transactions_reference_id ON transactions(reference_id);
CREATE INDEX idx_transactions_parent_id ON transactions(parent_id);
CREATE INDEX idx_transactions_goal_id ON transactions(goal_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_due_date ON transactions(due_date);
CREATE INDEX idx_transactions_group_type ON transactions(group_type);