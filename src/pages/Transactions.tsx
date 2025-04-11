import React from 'react';
import { TransactionModal } from '../components/TransactionModal';
import { TransactionsList } from '../components/TransactionsList';

export function Transactions() {
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Lançamentos
        </h1>

        <div className="mb-8">
          <TransactionModal isOpen={true} onClose={() => {}} />
        </div>

        <TransactionsList
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </div>
  );
}