import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  created_at: string;
}

interface CategoryState {
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  initializeDefaultCategories: () => Promise<void>;
}

// Default categories with their respective types
const defaultCategories = {
  income: [
    'Salário',
    'Freelance',
    'Investimentos',
    'Aluguel',
    'Dividendos',
    'Bônus',
    'Comissões',
    'Presente',
    'Reembolso',
    'Outros'
  ],
  expense: [
    'Alimentação',
    'Moradia',
    'Transporte',
    'Saúde',
    'Educação',
    'Lazer',
    'Vestuário',
    'Utilidades',
    'Internet/Telefone',
    'Outros'
  ]
};

// Default colors for income and expense categories
const defaultColors = {
  income: '#22c55e', // green-500
  expense: '#ef4444', // red-500
};

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  
  addCategory: async (category) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{
        ...category,
        user_id: user.id
      }])
      .select();

    if (error) {
      toast.error('Erro ao adicionar categoria');
      throw error;
    }
    
    set((state) => ({
      categories: [...state.categories, data[0]],
    }));
    
    toast.success('Categoria adicionada com sucesso!');
  },

  deleteCategory: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao excluir categoria');
      throw error;
    }

    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));

    toast.success('Categoria excluída com sucesso!');
  },

  fetchCategories: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar categorias');
      throw error;
    }

    set({ categories: data || [] });
  },

  initializeDefaultCategories: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      throw new Error('User not authenticated');
    }

    // Check if user already has categories
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id);

    if (!existingCategories || existingCategories.length === 0) {
      // Prepare all default categories for insertion
      const categoriesToInsert = [
        ...defaultCategories.income.map(name => ({
          name,
          type: 'income' as const,
          color: defaultColors.income,
          user_id: user.id
        })),
        ...defaultCategories.expense.map(name => ({
          name,
          type: 'expense' as const,
          color: defaultColors.expense,
          user_id: user.id
        }))
      ];

      // Insert all default categories
      const { error } = await supabase
        .from('categories')
        .insert(categoriesToInsert);

      if (error) {
        toast.error('Erro ao criar categorias padrão');
        throw error;
      }

      // Fetch all categories after insertion
      const { data: updatedCategories, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (fetchError) {
        toast.error('Erro ao carregar categorias');
        throw fetchError;
      }

      set({ categories: updatedCategories || [] });
      toast.success('Categorias padrão criadas com sucesso!');
    }
  }
}));