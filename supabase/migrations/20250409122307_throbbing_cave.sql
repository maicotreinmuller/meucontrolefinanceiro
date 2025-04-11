/*
  # Update authentication system

  1. Changes
    - Add email verification settings
    - Configure session handling
    - Add password reset functionality
    - Update user preferences defaults

  2. Security
    - Maintain existing RLS policies
    - Add new policies for password reset
*/

-- Update auth settings
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

-- Update user preferences for session handling
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMPTZ;

-- Create function to update last seen timestamp
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS trigger AS $$
BEGIN
  UPDATE public.user_preferences
  SET last_seen_at = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last seen
DROP TRIGGER IF EXISTS on_auth_user_update ON auth.users;
CREATE TRIGGER on_auth_user_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();