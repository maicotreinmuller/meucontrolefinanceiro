import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Target, ChevronDown, ChevronRight, Wallet } from 'lucide-react';
import { useGoalStore } from '../store/goalStore';
import { useAccountStore } from '../store/accountStore';
import { useAuthStore } from '../store/authStore';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { NumericKeypad } from '../components/NumericKeypad';
import { ListModal } from '../components/ListModal';
import toast from 'react-hot-toast';

export function Goals() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string>('');
  const [name, setName] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [targetAmount, setTargetAmount] = useState('0,00');
  const [showKeypad, setShowKeypad] = useState(false);
  const { goals, addGoal, deleteGoal, fetchGoals } = useGoalStore();
  const { accounts, fetchAccounts } = useAccountStore();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const init = async () => {
      try {
        await Promise.all([fetchGoals(), fetchAccounts()]);
      } catch (error) {
        console.error('Error initializing goals:', error);
        toast.error('Erro ao carregar dados');
      }
    };

    init();
  }, [user, navigate, fetchGoals, fetchAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Digite um nome para o objetivo');
      return;
    }

    if (!selectedAccount) {
      toast.error('Selecione uma conta');
      return;
    }

    try {
      const numericAmount = parseFloat(targetAmount.replace('.', '').replace(',', '.'));
      await addGoal({
        name: name.trim(),
        account_id: selectedAccount,
        target_amount: numericAmount,
      });
      setName('');
      setSelectedAccount('');
      setTargetAmount('0,00');
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const handleDelete = (id: string) => {
    setGoalToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteGoal(goalToDelete);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const accountOptions = accounts.map(account => ({
    id: account.id,
    name: account.name,
    description: account.bank_name,
    icon: Wallet,
    color: account.color
  }));

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Criar Novo Objetivo</h2>

            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do objetivo"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAccountModal(true)}
                className="w-full px-4 py-2 border rounded-lg bg-white text-left flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Wallet className="h-5 w-5 mr-2 text-gray-400" />
                  <span className={selectedAccount ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedAccount
                      ? accounts.find(a => a.id === selectedAccount)?.name
                      : 'Selecionar conta'}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <div>
                <button
                  type="button"
                  onClick={() => setShowKeypad(true)}
                  className="w-full px-4 py-2 border rounded-lg bg-white text-left"
                >
                  <span className="text-gray-500">Valor a alcançar:</span>{' '}
                  <span className="text-gray-900 font-medium">
                    R$ {targetAmount}
                  </span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span>Criar Objetivo</span>
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => {
                const progress = calculateProgress(goal.current_amount, goal.target_amount);
                const account = accounts.find(a => a.id === goal.account_id);

                return (
                  <div
                    key={goal.id}
                    className={`bg-white rounded-lg shadow p-6 ${
                      goal.completed ? 'ring-2 ring-green-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium">{goal.name}</h3>
                        <p className="text-sm text-gray-500">{account?.name}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Progresso</span>
                        <span className="font-medium">{progress.toFixed(1)}%</span>
                      </div>
                      
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            goal.completed ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Atual</span>
                        <span className="font-medium">
                          {formatCurrency(goal.current_amount)}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Meta</span>
                        <span className="font-medium">
                          {formatCurrency(goal.target_amount)}
                        </span>
                      </div>
                    </div>

                    {goal.completed && (
                      <div className="mt-4 py-2 px-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Objetivo alcançado!
                      </div>
                    )}
                  </div>
                );
              })}

              {goals.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  Nenhum objetivo encontrado
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ListModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        title="Selecionar Conta"
        options={accountOptions}
        selectedId={selectedAccount}
        onSelect={setSelectedAccount}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Excluir Objetivo"
        message="Tem certeza que deseja excluir este objetivo? Esta ação não pode ser desfeita."
      />

      {showKeypad && (
        <NumericKeypad
          value={targetAmount}
          onChange={setTargetAmount}
          onClose={() => setShowKeypad(false)}
        />
      )}
    </div>
  );
}