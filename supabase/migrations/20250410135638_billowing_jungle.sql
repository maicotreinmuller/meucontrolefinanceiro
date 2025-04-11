/*
  # Remove installment functionality

  1. Changes
    - Drop installment-related columns from transactions table
    - Remove installment-related triggers and functions
    - Clean up existing data
    
  2. Notes
    - Preserves basic transaction functionality
    - Maintains data integrity
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS create_installments_trigger ON transactions;
DROP TRIGGER IF EXISTS validate_installment_transaction_trigger ON transactions;
DROP FUNCTION IF EXISTS create_installment_transactions();
DROP FUNCTION IF EXISTS validate_installment_transaction();

-- Remove installment-related columns
ALTER TABLE transactions
DROP COLUMN IF EXISTS installment_number,
DROP COLUMN IF EXISTS total_installments,
DROP COLUMN IF EXISTS reference_id;

-- Update existing constraints
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS ensure_valid_installments,
DROP CONSTRAINT IF EXISTS ensure_credit_due_date;