import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CreditCard, Wallet, ChevronRight, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useAccountStore } from '../store/accountStore';
import { useAuthStore } from '../store/authStore';
import { useTransactionStore } from '../store/transactionStore';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ListModal } from '../components/ListModal';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const bankSuggestions = {
  'Nubank': {
    color: '#820ad1',
    creditCards: [
      'Nubank Ultravioleta',
      'Nubank Gold',
      'Nubank Platinum',
      'Nubank Internacional'
    ],
    accounts: [
      'Conta Digital',
      'Conta PJ',
      'Conta Investimento',
      'Conta Poupança'
    ]
  },
  'Itaú': {
    color: '#ec7000',
    creditCards: [
      'Itaú Personnalité',
      'Itaucard Gold',
      'Itaucard Platinum',
      'Itaú Click',
      'Itaú Uniclass'
    ],
    accounts: [
      'Conta Corrente',
      'Conta Digital',
      'Conta Universitária',
      'Conta Investimento'
    ]
  },
  'Bradesco': {
    color: '#cc092f',
    creditCards: [
      'Bradesco Infinite',
      'Bradesco Prime',
      'Bradesco Exclusive',
      'Bradesco Neo'
    ],
    accounts: [
      'Conta Prime',
      'Conta Digital',
      'Conta Universitária',
      'Conta Poupança'
    ]
  },
  'Santander': {
    color: '#ec0000',
    creditCards: [
      'Santander Unlimited',
      'Santander Elite Platinum',
      'Santander Play',
      'Santander Free'
    ],
    accounts: [
      'Conta Digital',
      'Conta Select',
      'Conta Universitária',
      'Conta Poupança'
    ]
  },
  'Banco do Brasil': {
    color: '#fae128',
    creditCards: [
      'BB Ourocard Infinite',
      'BB Ourocard Platinum',
      'BB Ourocard Gold',
      'BB Ourocard Internacional'
    ],
    accounts: [
      'Conta Corrente',
      'Conta Digital',
      'Conta Universitária',
      'Conta Poupança'
    ]
  },
  'Caixa': {
    color: '#1c5ca5',
    creditCards: [
      'Caixa Infinite',
      'Caixa Platinum',
      'Caixa Gold',
      'Caixa Simples'
    ],
    accounts: [
      'Conta Corrente',
      'Conta Poupança',
      'Conta Digital',
      'Conta Universitária'
    ]
  },
  'Inter': {
    color: '#ff7a00',
    creditCards: [
      'Inter Black',
      'Inter Platinum',
      'Inter Gold',
      'Inter Internacional'
    ],
    accounts: [
      'Conta Digital',
      'Conta Investimento',
      'Conta Global',
      'Conta PJ'
    ]
  },
  'C6 Bank': {
    color: '#242424',
    creditCards: [
      'C6 Carbon',
      'C6 Platinum',
      'C6 Gold',
      'C6 Global'
    ],
    accounts: [
      'Conta Global',
      'Conta Digital',
      'Conta PJ',
      'Conta Investimento'
    ]
  },
  'Next': {
    color: '#00ff5f',
    creditCards: [
      'Next Black',
      'Next Platinum',
      'Next Gold',
      'Next Internacional'
    ],
    accounts: [
      'Conta Digital',
      'Conta Next Joy',
      'Conta PJ',
      'Conta Investimento'
    ]
  },
  'PicPay': {
    color: '#11c76f',
    creditCards: [
      'PicPay Card Black',
      'PicPay Card Gold',
      'PicPay Card Internacional',
      'PicPay Card Digital'
    ],
    accounts: [
      'Conta Digital',
      'Conta PJ',
      'Conta Store',
      'Conta Social'
    ]
  },
  'XP': {
    color: '#000000',
    creditCards: [
      'XP Visa Infinite',
      'XP Visa Platinum',
      'XP Visa Gold',
      'XP Visa Internacional'
    ],
    accounts: [
      'Conta Digital',
      'Conta Investimento',
      'Conta Global',
      'Conta PJ'
    ]
  },
  'BTG Pactual': {
    color: '#0d2535',
    creditCards: [
      'BTG Black',
      'BTG Platinum',
      'BTG Gold',
      'BTG Internacional'
    ],
    accounts: [
      'Conta Digital',
      'Conta Investimento',
      'Conta Global',
      'Conta PJ'
    ]
  }
};

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

export function Accounts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'account' | 'credit_card'>('credit_card');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string>('');
  const [name, setName] = useState('');
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const { accounts, addAccount, deleteAccount, fetchAccounts, initializeDefaultAccounts } = useAccountStore();
  const { transactions, fetchTransactions } = useTransactionStore();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const initAccounts = async () => {
      try {
        await fetchAccounts();
        await fetchTransactions();
        await initializeDefaultAccounts();
      } catch (error) {
        console.error('Error initializing accounts:', error);
        toast.error('Erro ao carregar contas');
      }
    };

    initAccounts();
  }, [user, navigate, fetchAccounts, fetchTransactions, initializeDefaultAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Digite um nome');
      return;
    }

    try {
      const [bankName] = name.split(' ');
      await addAccount({
        name,
        bank_name: bankName,
        type: activeTab,
        color: bankSuggestions[bankName]?.color || '#1e40af'
      });
      setName('');
      setShowSuggestionsModal(false);
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleDelete = (id: string) => {
    setAccountToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteAccount(accountToDelete);
      setShowDeleteModal(false);
      setSelectedAccount(null);
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const getSuggestionOptions = () => {
    const suggestions = [];
    for (const [bank, data] of Object.entries(bankSuggestions)) {
      const bankOptions = data[activeTab === 'credit_card' ? 'creditCards' : 'accounts'].map(suggestion => ({
        id: `${bank}-${suggestion}`,
        name: suggestion,
        description: bank,
        color: data.color
      }));
      suggestions.push(...bankOptions);
    }
    return suggestions;
  };

  const filteredAccounts = accounts.filter(a => a.type === activeTab);

  const getCardBackground = (color: string) => {
    return `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -20)} 100%)`;
  };

  function adjustColor(color: string, amount: number) {
    return color;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getAccountTransactions = (accountId: string) => {
    return transactions.filter(t => t.account_id === accountId);
  };

  const calculateAccountBalance = (accountId: string) => {
    return getAccountTransactions(accountId).reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
  };

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
                onClick={() => {
                  setActiveTab('credit_card');
                  setSelectedAccount(null);
                }}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'credit_card'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                <span>Cartão</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('account');
                  setSelectedAccount(null);
                }}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'account'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Wallet className="h-5 w-5 mr-2" />
                <span>Conta</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button
                type="button"
                onClick={() => setShowSuggestionsModal(true)}
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <span className="text-gray-600">Sugestões</span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span>Adicionar {activeTab === 'credit_card' ? 'Cartão' : 'Conta'}</span>
              </button>
            </form>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  className="relative group"
                  onClick={() => setSelectedAccount(selectedAccount === account.id ? null : account.id)}
                >
                  {/* Card Design */}
                  <div
                    className={`h-48 rounded-xl p-6 flex flex-col justify-between transform transition-all duration-300 cursor-pointer ${
                      selectedAccount === account.id ? 'scale-[1.02] ring-2 ring-offset-2' : 'hover:scale-[1.02]'
                    }`}
                    style={{
                      background: getCardBackground(account.color),
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white text-lg font-medium mb-1">
                          {account.bank_name}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {account.name}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(account.id);
                        }}
                        className="text-white/60 hover:text-white/90 p-1 rounded-full hover:bg-black/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-white/90">
                        {account.type === 'credit_card' ? (
                          <CreditCard className="h-8 w-8" />
                        ) : (
                          <Wallet className="h-8 w-8" />
                        )}
                      </div>
                      <div className="flex gap-1">
                        <div className="w-8 h-8 rounded-full bg-white/30"></div>
                        <div className="w-8 h-8 rounded-full bg-white/20"></div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction History */}
                  {selectedAccount === account.id && (
                    <div className="mt-4 bg-white rounded-lg shadow-lg p-4 space-y-4">
                      <div className="flex justify-between items-center border-b pb-4">
                        <h4 className="text-lg font-medium">Histórico de Transações</h4>
                        <span className="text-lg font-semibold">
                          {formatCurrency(calculateAccountBalance(account.id))}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {getAccountTransactions(account.id).map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {transaction.type === 'income' ? (
                                <ArrowUpCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <ArrowDownCircle className="h-5 w-5 text-red-500" />
                              )}
                              <div>
                                <p className="font-medium">{transaction.category}</p>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(transaction.date), 'dd/MM/yyyy')}
                                </p>
                              </div>
                            </div>
                            <span className={`font-medium ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(transaction.amount)}
                            </span>
                          </div>
                        ))}
                        
                        {getAccountTransactions(account.id).length === 0 && (
                          <p className="text-center text-gray-500 py-4">
                            Nenhuma transação encontrada
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filteredAccounts.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  Nenhum {activeTab === 'credit_card' ? 'cartão' : 'conta'} encontrado
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ListModal
        isOpen={showSuggestionsModal}
        onClose={() => setShowSuggestionsModal(false)}
        title="Sugestões"
        options={getSuggestionOptions()}
        onSelect={(id) => {
          const [bank, ...nameParts] = id.split('-');
          setName(`${bank} ${nameParts.join('-')}`);
          setShowSuggestionsModal(false);
        }}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title={`Excluir ${activeTab === 'credit_card' ? 'Cartão' : 'Conta'}`}
        message={`Tem certeza que deseja excluir ${activeTab === 'credit_card' ? 'este cartão' : 'esta conta'}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}