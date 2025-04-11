import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  account_id: string;
  target_amount: number;
  current_amount: number;
  completed: boolean;
  created_at: string;
}

interface GoalState {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'completed' | 'current_amount'>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  fetchGoals: () => Promise<void>;
  updateGoalProgress: (id: string, amount: number) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set) => ({
  goals: [],
  
  addGoal: async (goal) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('goals')
      .insert([{
        ...goal,
        user_id: user.id,
        current_amount: 0,
        completed: false
      }])
      .select();

    if (error) {
      toast.error('Erro ao criar objetivo');
      throw error;
    }
    
    set((state) => ({
      goals: [...state.goals, data[0]],
    }));
    
    toast.success('Objetivo criado com sucesso!');
  },

  deleteGoal: async (id) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir objetivo');
      throw error;
    }

    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));

    toast.success('Objetivo excluído com sucesso!');
  },

  fetchGoals: async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar objetivos');
      throw error;
    }

    set({ goals: data || [] });
  },

  updateGoalProgress: async (id: string, amount: number) => {
    const { data, error } = await supabase
      .from('goals')
      .update({ current_amount: amount })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast.error('Erro ao atualizar progresso');
      throw error;
    }

    if (data.completed) {
      toast.success('🎉 Objetivo alcançado!');
    }

    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? data : g)),
    }));
  },
}));