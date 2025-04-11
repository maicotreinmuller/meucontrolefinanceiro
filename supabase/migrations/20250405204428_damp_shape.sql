/*
  # Recreate categories table with expanded default categories

  1. Changes
    - Drop existing categories table
    - Recreate categories table with same structure
    - Create function to insert default categories for a given user
    
  2. Security
    - Maintain existing RLS policies
    - Keep same constraints and checks
*/

-- Drop existing table and function if they exist
DROP TABLE IF EXISTS categories CASCADE;
DROP FUNCTION IF EXISTS initialize_user_categories;

-- Recreate the table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  color text NOT NULL DEFAULT '#22c55e',
  icon text NOT NULL DEFAULT 'Plus',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT categories_type_check CHECK (type IN ('income', 'expense'))
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can read own categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to initialize categories for a user
CREATE OR REPLACE FUNCTION initialize_user_categories(user_uuid uuid)
RETURNS void AS $$
BEGIN
  -- Insert income categories
  INSERT INTO categories (user_id, name, type, color, icon)
  VALUES
    (user_uuid, 'Salário', 'income', '#22c55e', 'Briefcase'),
    (user_uuid, 'Freelance', 'income', '#22c55e', 'Code'),
    (user_uuid, 'Investimentos', 'income', '#22c55e', 'TrendingUp'),
    (user_uuid, 'Dividendos', 'income', '#22c55e', 'PieChart'),
    (user_uuid, 'Aluguel', 'income', '#22c55e', 'Home'),
    (user_uuid, 'Bônus', 'income', '#22c55e', 'Star'),
    (user_uuid, 'Comissões', 'income', '#22c55e', 'Target'),
    (user_uuid, 'Consultoria', 'income', '#22c55e', 'Users'),
    (user_uuid, 'Vendas Online', 'income', '#22c55e', 'ShoppingCart'),
    (user_uuid, 'Royalties', 'income', '#22c55e', 'Copyright'),
    (user_uuid, 'Pensão', 'income', '#22c55e', 'Heart'),
    (user_uuid, 'Aposentadoria', 'income', '#22c55e', 'Coffee'),
    (user_uuid, 'Restituição de Impostos', 'income', '#22c55e', 'Receipt'),
    (user_uuid, 'Prêmios', 'income', '#22c55e', 'Award'),
    (user_uuid, 'Herança', 'income', '#22c55e', 'Gift'),
    (user_uuid, 'Empréstimos', 'income', '#22c55e', 'Landmark'),
    (user_uuid, 'Rendimentos Poupança', 'income', '#22c55e', 'Wallet'),
    (user_uuid, 'Venda de Ativos', 'income', '#22c55e', 'BarChart'),
    (user_uuid, 'Participação nos Lucros', 'income', '#22c55e', 'DollarSign'),
    (user_uuid, 'Outros Rendimentos', 'income', '#22c55e', 'Plus');

  -- Insert expense categories
  INSERT INTO categories (user_id, name, type, color, icon)
  VALUES
    (user_uuid, 'Alimentação', 'expense', '#ef4444', 'UtensilsCrossed'),
    (user_uuid, 'Moradia', 'expense', '#ef4444', 'Home'),
    (user_uuid, 'Transporte', 'expense', '#ef4444', 'Car'),
    (user_uuid, 'Saúde', 'expense', '#ef4444', 'Heart'),
    (user_uuid, 'Educação', 'expense', '#ef4444', 'GraduationCap'),
    (user_uuid, 'Lazer', 'expense', '#ef4444', 'Gamepad2'),
    (user_uuid, 'Vestuário', 'expense', '#ef4444', 'Shirt'),
    (user_uuid, 'Utilidades', 'expense', '#ef4444', 'Lightbulb'),
    (user_uuid, 'Internet/Telefone', 'expense', '#ef4444', 'Wifi'),
    (user_uuid, 'Seguros', 'expense', '#ef4444', 'Shield'),
    (user_uuid, 'Impostos', 'expense', '#ef4444', 'FileText'),
    (user_uuid, 'Cartão de Crédito', 'expense', '#ef4444', 'CreditCard'),
    (user_uuid, 'Empréstimos', 'expense', '#ef4444', 'Landmark'),
    (user_uuid, 'Manutenção Casa', 'expense', '#ef4444', 'Wrench'),
    (user_uuid, 'Manutenção Carro', 'expense', '#ef4444', 'Car'),
    (user_uuid, 'Pets', 'expense', '#ef4444', 'Dog'),
    (user_uuid, 'Presentes', 'expense', '#ef4444', 'Gift'),
    (user_uuid, 'Investimentos', 'expense', '#ef4444', 'TrendingUp'),
    (user_uuid, 'Assinaturas', 'expense', '#ef4444', 'Repeat'),
    (user_uuid, 'Outros Gastos', 'expense', '#ef4444', 'Plus');
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to initialize categories for new users
CREATE OR REPLACE FUNCTION initialize_categories_for_new_user()
RETURNS trigger AS $$
BEGIN
  PERFORM initialize_user_categories(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically initialize categories for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_categories_for_new_user();

-- Initialize categories for existing users
DO $$
DECLARE
  user_row RECORD;
BEGIN
  FOR user_row IN SELECT id FROM auth.users
  LOOP
    PERFORM initialize_user_categories(user_row.id);
  END LOOP;
END;
$$;