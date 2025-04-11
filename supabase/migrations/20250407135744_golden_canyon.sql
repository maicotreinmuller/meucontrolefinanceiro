/*
  # Create goals table and related structures

  1. New Tables
    - `goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `account_id` (uuid, references bank_accounts)
      - `target_amount` (numeric)
      - `current_amount` (numeric)
      - `completed` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  account_id uuid REFERENCES bank_accounts(id) NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own goals"
  ON goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update goal progress
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS trigger AS $$
BEGIN
  -- Update completed status if target is reached
  IF NEW.current_amount >= NEW.target_amount AND NOT NEW.completed THEN
    NEW.completed := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for goal progress
CREATE TRIGGER check_goal_progress
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();