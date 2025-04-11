import React, { useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Trash2, Plus } from 'lucide-react';
import { useCategoryStore } from '../store/categoryStore';
import { useAuthStore } from '../store/authStore';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function Categories() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string>('');
  const { categories, addCategory, deleteCategory, fetchCategories, initializeDefaultCategories } = useCategoryStore();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const initCategories = async () => {
      try {
        await fetchCategories();
        await initializeDefaultCategories();
      } catch (error) {
        console.error('Error initializing categories:', error);
        toast.error('Erro ao carregar categorias');
      }
    };

    initCategories();
  }, [user, navigate, fetchCategories, initializeDefaultCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Digite um nome para a categoria');
      return;
    }

    try {
      await addCategory({
        name: newCategoryName.trim(),
        type: activeTab,
        color: activeTab === 'income' ? '#22c55e' : '#ef4444',
        icon: 'Plus'
      });
      setNewCategoryName('');
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleDelete = (id: string) => {
    setCategoryToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteCategory(categoryToDelete);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const filteredCategories = categories.filter(c => c.type === activeTab);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6">
            {/* Tabs */}
            <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('expense')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'expense'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowDownCircle className="h-5 w-5 mr-2" />
                <span>Despesas</span>
              </button>
              <button
                onClick={() => setActiveTab('income')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'income'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowUpCircle className="h-5 w-5 mr-2" />
                <span>Receitas</span>
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nome da categoria"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <button
                type="submit"
                className={`w-full px-4 py-2 rounded-lg text-white flex items-center justify-center ${
                  activeTab === 'income' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                <Plus className="h-5 w-5 mr-2" />
                <span>Adicionar Categoria</span>
              </button>
            </form>

            {/* Categories List */}
            <div className="space-y-2">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    activeTab === 'income' ? 'hover:bg-green-50' : 'hover:bg-red-50'
                  }`}
                >
                  <span className="text-gray-700">{category.name}</span>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-white transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {filteredCategories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma categoria encontrada
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Excluir Categoria"
        message="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
      />
    </div>
  );
}