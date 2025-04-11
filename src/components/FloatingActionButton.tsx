import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { TransactionModal } from './TransactionModal';

export function FloatingActionButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 transition-colors duration-200 z-50"
      >
        <Plus className="h-8 w-8 text-white" />
      </button>

      <TransactionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}