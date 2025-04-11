import React, { useState, useEffect } from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle,
  Calendar,
  DollarSign,
  Tag,
  CreditCard,
  Wallet,
  Target,
  ChevronRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NumericKeypad } from './NumericKeypad';
import { useTransactionStore } from '../store/transactionStore';
import { useCategoryStore } from '../store/categoryStore';
import { useAccountStore } from '../store/accountStore';
import { useGoalStore } from '../store/goalStore';
import { ListModal } from './ListModal';
import { DatePickerModal } from './DatePickerModal';
import toast from 'react-hot-toast';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  const [showKeypad, setShowKeypad] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [amount, setAmount] = useState('0,00');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  
  // Payment type fields (expense only)
  const [showPaymentType, setShowPaymentType] = useState(false);
  const [paymentType, setPaymentType] = useState<'debit' | 'credit'>('debit');
  const [selectedAccount, setSelectedAccount] = useState('');
  
  // Income specific fields
  const [linkToGoal, setLinkToGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [depositAccount, setDepositAccount] = useState('');
  
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const { categories, fetchCategories } = useCategoryStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { goals, fetchGoals } = useGoalStore();

  useEffect(() => {
    fetchCategories();
    fetchAccounts();
    fetchGoals();
  }, [fetchCategories, fetchAccounts, fetchGoals]);

  const filteredAccounts = accounts.filter(account => 
    paymentType === 'debit' 
      ? account.type === 'account'
      : account.type === 'credit_card'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const numericAmount = parseFloat(amount.replace('.', '').replace(',', '.'));
      
      const baseTransaction = {
        amount: numericAmount,
        category,
        type,
        date: format(parseISO(date), 'yyyy-MM-dd'),
        description
      };

      if (type === 'income') {
        await addTransaction({
          ...baseTransaction,
          deposit_account_id: linkToGoal ? undefined : depositAccount,
          goal_id: linkToGoal ? selectedGoal : undefined
        });
      } else if (showPaymentType) {
        if (!selectedAccount) {
          toast.error('Selecione uma conta ou cartão');
          return;
        }

        await addTransaction({
          ...baseTransaction,
          payment_type: paymentType,
          account_id: selectedAccount,
          account_type: paymentType === 'credit' ? 'credit_card' : 'bank_account'
        });
      } else {
        await addTransaction(baseTransaction);
      }

      toast.success('Transação adicionada com sucesso!');
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Erro ao adicionar transação');
    }
  };

  const resetForm = () => {
    setAmount('0,00');
    setCategory('');
    setType('expense');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setDescription('');
    setShowPaymentType(false);
    setPaymentType('debit');
    setSelectedAccount('');
    setLinkToGoal(false);
    setSelectedGoal('');
    setDepositAccount('');
  };

  const filteredCategories = categories.filter(c => c.type === type);

  const categoryOptions = filteredCategories.map(cat => ({
    id: cat.name,
    name: cat.name,
    icon: Tag
  }));

  const accountOptions = filteredAccounts.map(account => ({
    id: account.id,
    name: account.name,
    description: account.bank_name,
    icon: paymentType === 'debit' ? Wallet : CreditCard,
    color: account.color
  }));

  const goalOptions = goals.map(goal => ({
    id: goal.id,
    name: goal.name,
    description: `Meta: ${new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(goal.target_amount)}`,
    icon: Target
  }));

  return (
    <div className="bg-white rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Transação
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('');
                setSelectedGoal('');
                setLinkToGoal(false);
              }}
              className={`flex items-center justify-center p-2 rounded-md ${
                type === 'expense'
                  ? 'bg-red-100 text-red-800 border-2 border-red-500'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowDownCircle className="h-5 w-5 mr-2" />
              <span>Despesa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('');
                setShowPaymentType(false);
              }}
              className={`flex items-center justify-center p-2 rounded-md ${
                type === 'income'
                  ? 'bg-[#00CC73]/10 text-[#00CC73] border-2 border-[#00CC73]'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowUpCircle className="h-5 w-5 mr-2" />
              <span>Receita</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data
          </label>
          <button
            type="button"
            onClick={() => setShowDatePicker(true)}
            className="w-full flex items-center justify-between p-2 border rounded-md bg-white"
          >
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-400" />
              <span className="text-gray-900">
                {format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor
          </label>
          <button
            type="button"
            onClick={() => setShowKeypad(true)}
            className="w-full text-left p-2 border rounded-md bg-white flex items-center"
          >
            <DollarSign className="h-5 w-5 mr-2 text-gray-400" />
            R$ {amount}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border rounded-md bg-white"
            rows={2}
            placeholder="Adicione mais detalhes sobre a transação"
          />
        </div>

        {type === 'income' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Vincular a um objetivo
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkToGoal}
                  onChange={(e) => {
                    setLinkToGoal(e.target.checked);
                    if (!e.target.checked) {
                      setSelectedGoal('');
                    } else {
                      setDepositAccount('');
                      setCategory('');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00CC73]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00CC73]"></div>
              </label>
            </div>

            {linkToGoal && (
              <button
                type="button"
                onClick={() => setShowGoalModal(true)}
                className="w-full flex items-center justify-between p-2 border rounded-md bg-white"
              >
                <div className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-gray-400" />
                  <span className={selectedGoal ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedGoal ? goals.find(g => g.id === selectedGoal)?.name : 'Selecione um objetivo'}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            )}

            {!linkToGoal && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="w-full flex items-center justify-between p-2 border rounded-md bg-white"
                  >
                    <div className="flex items-center">
                      <Tag className="h-5 w-5 mr-2 text-gray-400" />
                      <span className={category ? 'text-gray-900' : 'text-gray-500'}>
                        {category || 'Selecione uma categoria'}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conta para depósito
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(true)}
                    className="w-full flex items-center justify-between p-2 border rounded-md bg-white"
                  >
                    <div className="flex items-center">
                      <Wallet className="h-5 w-5 mr-2 text-gray-400" />
                      <span className={depositAccount ? 'text-gray-900' : 'text-gray-500'}>
                        {depositAccount ? accounts.find(a => a.id === depositAccount)?.name : 'Selecione uma conta'}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {type === 'expense' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="w-full flex items-center justify-between p-2 border rounded-md bg-white"
              >
                <div className="flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-gray-400" />
                  <span className={category ? 'text-gray-900' : 'text-gray-500'}>
                    {category || 'Selecione uma categoria'}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Selecionar tipo de pagamento
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPaymentType}
                    onChange={(e) => setShowPaymentType(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00CC73]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00CC73]"></div>
                </label>
              </div>

              {showPaymentType && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType('debit');
                        setSelectedAccount('');
                      }}
                      className={`flex items-center justify-center p-2 rounded-md ${
                        paymentType === 'debit'
                          ? 'bg-[#00CC73]/10 text-[#00CC73] border-2 border-[#00CC73]'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Wallet className="h-5 w-5 mr-2" />
                      <span>Débito</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType('credit');
                        setSelectedAccount('');
                      }}
                      className={`flex items-center justify-center p-2 rounded-md ${
                        paymentType === 'credit'
                          ? 'bg-[#00CC73]/10 text-[#00CC73] border-2 border-[#00CC73]'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      <span>Crédito</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {paymentType === 'debit' ? 'Conta' : 'Cartão de Crédito'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAccountModal(true)}
                      className="w-full flex items-center justify-between p-2 border rounded-md bg-white"
                    >
                      <div className="flex items-center">
                        {paymentType === 'debit' ? (
                          <Wallet className="h-5 w-5 mr-2 text-gray-400" />
                        ) : (
                          <CreditCard className="h-5 w-5 mr-2 text-gray-400" />
                        )}
                        <span className={selectedAccount ? 'text-gray-900' : 'text-gray-500'}>
                          {selectedAccount ? accounts.find(a => a.id === selectedAccount)?.name : `Selecione ${paymentType === 'debit' ? 'uma conta' : 'um cartão'}`}
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        <button
          type="submit"
          className={`w-full p-2 text-white rounded-md flex items-center justify-center ${
            type === 'income' ? 'bg-[#00CC73] hover:bg-[#22C25F]' : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {type === 'income' ? (
            <ArrowUpCircle className="h-5 w-5 mr-2" />
          ) : (
            <ArrowDownCircle className="h-5 w-5 mr-2" />
          )}
          Salvar
        </button>
      </form>

      <DatePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={date}
        onSelect={setDate}
      />

      <ListModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Selecionar Categoria"
        options={categoryOptions}
        selectedId={category}
        onSelect={setCategory}
      />

      <ListModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        title={type === 'income' ? 'Selecionar Conta para Depósito' : `Selecionar ${paymentType === 'debit' ? 'Conta' : 'Cartão'}`}
        options={accountOptions}
        selectedId={type === 'income' ? depositAccount : selectedAccount}
        onSelect={type === 'income' ? setDepositAccount : setSelectedAccount}
      />

      <ListModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        title="Selecionar Objetivo"
        options={goalOptions}
        selectedId={selectedGoal}
        onSelect={setSelectedGoal}
      />

      {showKeypad && (
        <NumericKeypad
          value={amount}
          onChange={setAmount}
          onClose={() => setShowKeypad(false)}
        />
      )}
    </div>
  );
}