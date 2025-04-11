import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
  description?: string;
  
  // Payment type fields
  account_id?: string;
  payment_type?: 'debit' | 'credit';
  account_type?: 'bank_account' | 'credit_card';
  due_date?: string;
  
  // Income specific fields
  goal_id?: string;
  deposit_account_id?: string;
  
  created_at: string;
}

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  fetchTransactions: () => Promise<void>;
  getAccountTransactions: (accountId: string) => Transaction[];
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  
  addTransaction: async (transaction) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // For credit card transactions, ensure due_date is set
      if (transaction.payment_type === 'credit' && !transaction.due_date) {
        transaction.due_date = transaction.date;
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transaction,
          user_id: user.id
        }])
        .select();

      if (error) {
        console.error('Error adding transaction:', error);
        toast.error('Erro ao adicionar transação');
        throw error;
      }
      
      set((state) => ({
        transactions: [...state.transactions, data[0]],
      }));
      
      toast.success('Transação adicionada com sucesso!');
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  },

  deleteTransaction: async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir transação');
      throw error;
    }

    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));

    toast.success('Transação excluída com sucesso!');
  },

  fetchTransactions: async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar transações');
      throw error;
    }

    set({ transactions: data || [] });
  },

  getAccountTransactions: (accountId: string) => {
    return get().transactions.filter(t => 
      t.account_id === accountId || t.deposit_account_id === accountId
    );
  },
}));