import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Wallet, TrendingUp, TrendingDown, PieChart, Calendar } from 'lucide-react';
import { useTransactionStore } from '../store/transactionStore';
import { DashboardCard } from '../components/DashboardCard';
import { DateRangeModal } from '../components/DateRangeModal';

export function Dashboard() {
  const { transactions, fetchTransactions } = useTransactionStore();
  const [startDate, setStartDate] = useState(
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = transactions.filter((t) => {
    const transactionDate = parseISO(t.date);
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return transactionDate >= start && transactionDate <= end;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const balance = filteredTransactions.reduce(
    (acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount),
    0
  );
  const income = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const expenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const categoryExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const categoryIncomes = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // Sort categories by amount (highest to lowest)
  const sortedExpenses = Object.entries(categoryExpenses)
    .sort(([, a], [, b]) => b - a);

  const sortedIncomes = Object.entries(categoryIncomes)
    .sort(([, a], [, b]) => b - a);

  const handleDateRangeSelect = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
        </h1>

        <button
          onClick={() => setShowDatePicker(true)}
          className="w-full bg-white/50 backdrop-blur-sm rounded-lg p-3 mb-6 border border-gray-100 flex items-center gap-3"
        >
          <div className="flex items-center text-gray-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">
              {format(parseISO(startDate), "dd 'de' MMM", { locale: ptBR })}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-gray-600">
              {format(parseISO(endDate), "dd 'de' MMM", { locale: ptBR })}
            </span>
          </div>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <DashboardCard
            title="Saldo do Período"
            value={formatCurrency(balance)}
            icon={Wallet}
            color={balance >= 0 ? 'bg-[#00CC73]' : 'bg-red-500'}
          />
          <DashboardCard
            title="Receitas do Período"
            value={formatCurrency(income)}
            icon={TrendingUp}
            color="bg-[#00CC73]"
          />
          <DashboardCard
            title="Despesas do Período"
            value={formatCurrency(expenses)}
            icon={TrendingDown}
            color="bg-red-500"
          />
          <DashboardCard
            title="Média Diária"
            value={formatCurrency(expenses / (filteredTransactions.length || 1))}
            icon={PieChart}
            color="bg-[#22C25F]"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expenses by Category */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-6">Gastos por Categoria</h2>
            <div className="space-y-4">
              {sortedExpenses.map(([category, amount]) => {
                const percentage = (amount / expenses) * 100;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-900 font-medium">
                          {formatCurrency(amount)}
                        </span>
                        <span className="text-gray-500 text-xs w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500 ease-in-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {sortedExpenses.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Nenhuma despesa registrada no período
                </div>
              )}
            </div>
          </div>

          {/* Income by Category */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-6">Receitas por Categoria</h2>
            <div className="space-y-4">
              {sortedIncomes.map(([category, amount]) => {
                const percentage = (amount / income) * 100;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-900 font-medium">
                          {formatCurrency(amount)}
                        </span>
                        <span className="text-gray-500 text-xs w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00CC73] to-[#22C25F] rounded-full transition-all duration-500 ease-in-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {sortedIncomes.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Nenhuma receita registrada no período
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DateRangeModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        startDate={startDate}
        endDate={endDate}
        onSelect={handleDateRangeSelect}
      />
    </div>
  );
}