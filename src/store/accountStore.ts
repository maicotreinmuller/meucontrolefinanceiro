import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface BankAccount {
  id: string;
  user_id: string;
  name: string;
  type: 'account' | 'credit_card';
  bank_name: string;
  color: string;
  created_at: string;
}

interface AccountState {
  accounts: BankAccount[];
  addAccount: (account: Omit<BankAccount, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  fetchAccounts: () => Promise<void>;
  initializeDefaultAccounts: () => Promise<void>;
  getBankColor: (bankName: string) => Promise<string>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  
  addAccount: async (account) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      throw new Error('User not authenticated');
    }

    // Get the bank color from the database
    const color = await get().getBankColor(account.bank_name);

    const { data, error } = await supabase
      .from('bank_accounts')
      .insert([{
        ...account,
        user_id: user.id,
        color: color || account.color // Use fetched color or fallback to provided color
      }])
      .select();

    if (error) {
      toast.error('Erro ao adicionar conta');
      throw error;
    }
    
    set((state) => ({
      accounts: [...state.accounts, data[0]],
    }));
    
    toast.success('Conta adicionada com sucesso!');
  },

  deleteAccount: async (id) => {
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir conta');
      throw error;
    }

    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
    }));

    toast.success('Conta excluída com sucesso!');
  },

  fetchAccounts: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar contas');
      throw error;
    }

    set({ accounts: data || [] });
  },

  getBankColor: async (bankName: string): Promise<string> => {
    const { data, error } = await supabase
      .from('bank_colors')
      .select('color')
      .eq('bank_name', bankName)
      .single();

    if (error) {
      console.error('Error fetching bank color:', error);
      return '#1e40af'; // Default color if not found
    }

    return data.color;
  },

  initializeDefaultAccounts: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      throw new Error('User not authenticated');
    }

    const { data: existingAccounts } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (!existingAccounts || existingAccounts.length === 0) {
      await supabase.rpc('initialize_user_accounts', { user_uuid: user.id });
      await set((state) => ({ ...state }));
      toast.success('Contas padrão criadas com sucesso!');
    }
  },
}));