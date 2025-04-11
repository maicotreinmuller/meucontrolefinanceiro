/*
  # Add insert policy for user preferences

  1. Security Changes
    - Add RLS policy to allow users to insert their own preferences
    - This complements existing policies for select and update

  2. Notes
    - Users can only insert preferences for themselves
    - This fixes the 403 error when trying to create initial preferences
*/

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);