/*
  # Fix function search paths

  1. Changes
    - Update all functions to use immutable search paths
    - Add explicit schema references
    - Fix security vulnerabilities
    
  2. Notes
    - All functions now use fully qualified names
    - Search paths are explicitly defined
    - Maintain existing functionality while improving security
*/

-- Update initialize_user_categories function
CREATE OR REPLACE FUNCTION public.initialize_user_categories(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert income categories
  INSERT INTO public.categories (user_id, name, type, color, icon)
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
  INSERT INTO public.categories (user_id, name, type, color, icon)
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
$$;

-- Update initialize_categories_for_new_user function
CREATE OR REPLACE FUNCTION public.initialize_categories_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.initialize_user_categories(NEW.id);
  RETURN NEW;
END;
$$;

-- Update initialize_user_accounts function
CREATE OR REPLACE FUNCTION public.initialize_user_accounts(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default credit cards
  INSERT INTO public.bank_accounts (user_id, name, type, bank_name, color)
  VALUES
    (user_uuid, 'Nubank Mastercard', 'credit_card', 'Nubank', '#820ad1'),
    (user_uuid, 'Itaú Mastercard', 'credit_card', 'Itaú', '#ec7000'),
    (user_uuid, 'Bradesco Mastercard', 'credit_card', 'Bradesco', '#cc092f'),
    (user_uuid, 'Santander Mastercard', 'credit_card', 'Santander', '#ec0000'),
    (user_uuid, 'Banco do Brasil Elo', 'credit_card', 'Banco do Brasil', '#fae128');

  -- Insert default bank accounts
  INSERT INTO public.bank_accounts (user_id, name, type, bank_name, color)
  VALUES
    (user_uuid, 'Conta Corrente', 'account', 'Banco do Brasil', '#fae128'),
    (user_uuid, 'Conta Digital', 'account', 'Itaú', '#ec7000'),
    (user_uuid, 'Conta Corrente', 'account', 'Bradesco', '#cc092f'),
    (user_uuid, 'Conta Digital', 'account', 'Santander', '#ec0000'),
    (user_uuid, 'Conta Digital', 'account', 'Nubank', '#820ad1');
END;
$$;

-- Update initialize_accounts_for_new_user function
CREATE OR REPLACE FUNCTION public.initialize_accounts_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.initialize_user_accounts(NEW.id);
  RETURN NEW;
END;
$$;

-- Update update_goal_progress function
CREATE OR REPLACE FUNCTION public.update_goal_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update completed status if target is reached
  IF NEW.current_amount >= NEW.target_amount AND NOT NEW.completed THEN
    NEW.completed := true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update validate_installment_transaction function
CREATE OR REPLACE FUNCTION public.validate_installment_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For credit card installments
  IF NEW.payment_type = 'credit' AND NEW.total_installments > 1 THEN
    -- Validate installment number range
    IF NEW.installment_number IS NOT NULL THEN
      IF NEW.installment_number < 1 OR NEW.installment_number > NEW.total_installments THEN
        RAISE EXCEPTION 'Invalid installment number';
      END IF;
      
      -- Limit maximum installments to 12
      IF NEW.total_installments > 12 THEN
        RAISE EXCEPTION 'Maximum number of installments is 12';
      END IF;
    END IF;

    -- Validate due date
    IF NEW.due_date IS NULL THEN
      RAISE EXCEPTION 'Due date is required for installments';
    END IF;

    -- Ensure due date is not before transaction date
    IF NEW.due_date < NEW.date THEN
      RAISE EXCEPTION 'Due date cannot be before transaction date';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Update update_last_seen function
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_preferences
  SET last_seen_at = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Recreate triggers with updated functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_categories_for_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_accounts ON auth.users;
CREATE TRIGGER on_auth_user_created_accounts
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_accounts_for_new_user();

DROP TRIGGER IF EXISTS check_goal_progress ON public.goals;
CREATE TRIGGER check_goal_progress
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_progress();

DROP TRIGGER IF EXISTS validate_installment_transaction_trigger ON public.transactions;
CREATE TRIGGER validate_installment_transaction_trigger
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_installment_transaction();

DROP TRIGGER IF EXISTS on_auth_user_update ON auth.users;
CREATE TRIGGER on_auth_user_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_seen();