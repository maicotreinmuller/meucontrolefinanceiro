/*
  # Create user preferences and shared accounts tables

  1. New Tables
    - `user_preferences`
      - `user_id` (uuid, primary key)
      - `has_seen_welcome` (boolean)
      - `created_at` (timestamptz)

    - `shared_accounts`
      - `id` (uuid, primary key)
      - `owner_id` (uuid)
      - `shared_with_id` (uuid)
      - `created_at` (timestamptz)
      - `status` (text)

  2. Security
    - Enable RLS on both tables
    - Add appropriate security policies
*/

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_seen_welcome boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create shared_accounts table
CREATE TABLE IF NOT EXISTS shared_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, shared_with_id)
);

ALTER TABLE shared_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their shared accounts"
  ON shared_accounts
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = shared_with_id);