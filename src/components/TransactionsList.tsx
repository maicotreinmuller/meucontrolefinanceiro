import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { useTransactionStore } from '../store/transactionStore';
import { useAccountStore } from '../store/accountStore';
import { ConfirmationModal } from './ConfirmationModal';

interface TransactionsListProps {
  startDate: string;
  endDate: string;
}

export function TransactionsList({ startDate, endDate }: TransactionsListProps) {
  const { transactions, deleteTransaction } = useTransactionStore();
  const { accounts } = useAccountStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  
  // Enhanced interaction handling
  const touchStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchEnd = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentTranslate = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const startTime = useRef<number>(0);
  const [swipedTransactionId, setSwipedTransactionId] = useState<string | null>(null);
  const isMouseDragging = useRef<boolean>(false);

  const minSwipeDistance = 50;
  const maxSwipeDistance = 80;
  const swipeThreshold = 0.3;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(value));
  };

  const filteredTransactions = transactions
    .filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return transactionDate >= start && transactionDate <= end;
    })
    .sort((a, b) => {
      const dateA = a.due_date ? new Date(a.due_date) : new Date(a.date);
      const dateB = b.due_date ? new Date(b.due_date) : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

  const handleDelete = async (id: string) => {
    setTransactionToDelete(id);
    setShowDeleteModal(true);
    setSwipedTransactionId(null);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      await deleteTransaction(transactionToDelete);
      setShowDeleteModal(false);
      setTransactionToDelete(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent, transactionId: string) => {
    isDragging.current = true;
    startTime.current = Date.now();
    
    const touch = e.targetTouches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY
    };
    touchEnd.current = { ...touchStart.current };
    
    if (swipedTransactionId !== transactionId) {
      currentTranslate.current = 0;
      setSwipedTransactionId(null);
    }

    const element = e.currentTarget as HTMLElement;
    element.style.transition = 'none';
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;

    const touch = e.targetTouches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY
    };

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      isDragging.current = false;
      return;
    }

    e.preventDefault();

    const raw = deltaX;
    const resistance = 0.5;
    const translated = raw * resistance;
    
    currentTranslate.current = Math.max(-maxSwipeDistance, Math.min(maxSwipeDistance, translated));

    const element = e.currentTarget as HTMLElement;
    element.style.transform = `translateX(${currentTranslate.current}px)`;
  };

  const onTouchEnd = (e: React.TouchEvent, transactionId: string) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const element = e.currentTarget as HTMLElement;
    element.style.transition = 'transform 0.2s ease-out';

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaTime = Date.now() - startTime.current;
    const velocity = Math.abs(deltaX) / deltaTime;

    const shouldComplete = 
      Math.abs(deltaX) > minSwipeDistance || 
      (Math.abs(deltaX) > minSwipeDistance * swipeThreshold && velocity > 0.15);

    if (shouldComplete) {
      const direction = deltaX < 0 ? -1 : 1;
      currentTranslate.current = direction * maxSwipeDistance;
      element.style.transform = `translateX(${currentTranslate.current}px)`;
      setSwipedTransactionId(direction < 0 ? transactionId : null);
    } else {
      currentTranslate.current = 0;
      element.style.transform = 'translateX(0)';
      setSwipedTransactionId(null);
    }
  };

  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent, transactionId: string) => {
    isMouseDragging.current = true;
    startTime.current = Date.now();
    
    touchStart.current = {
      x: e.clientX,
      y: e.clientY
    };
    touchEnd.current = { ...touchStart.current };
    
    if (swipedTransactionId !== transactionId) {
      currentTranslate.current = 0;
      setSwipedTransactionId(null);
    }

    const element = e.currentTarget as HTMLElement;
    element.style.transition = 'none';
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDragging.current) return;

    touchEnd.current = {
      x: e.clientX,
      y: e.clientY
    };

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      isMouseDragging.current = false;
      return;
    }

    e.preventDefault();

    const raw = deltaX;
    const resistance = 0.5;
    const translated = raw * resistance;
    
    currentTranslate.current = Math.max(-maxSwipeDistance, Math.min(maxSwipeDistance, translated));

    const element = e.currentTarget as HTMLElement;
    element.style.transform = `translateX(${currentTranslate.current}px)`;
  };

  const onMouseUp = (e: React.MouseEvent, transactionId: string) => {
    if (!isMouseDragging.current) return;
    isMouseDragging.current = false;

    const element = e.currentTarget as HTMLElement;
    element.style.transition = 'transform 0.2s ease-out';

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaTime = Date.now() - startTime.current;
    const velocity = Math.abs(deltaX) / deltaTime;

    const shouldComplete = 
      Math.abs(deltaX) > minSwipeDistance || 
      (Math.abs(deltaX) > minSwipeDistance * swipeThreshold && velocity > 0.15);

    if (shouldComplete) {
      const direction = deltaX < 0 ? -1 : 1;
      currentTranslate.current = direction * maxSwipeDistance;
      element.style.transform = `translateX(${currentTranslate.current}px)`;
      setSwipedTransactionId(direction < 0 ? transactionId : null);
    } else {
      currentTranslate.current = 0;
      element.style.transform = 'translateX(0)';
      setSwipedTransactionId(null);
    }
  };

  const onMouseLeave = (e: React.MouseEvent) => {
    if (isMouseDragging.current) {
      isMouseDragging.current = false;
      const element = e.currentTarget as HTMLElement;
      element.style.transition = 'transform 0.2s ease-out';
      element.style.transform = 'translateX(0)';
      setSwipedTransactionId(null);
    }
  };

  const getTransactionDescription = (transaction: any) => {
    const account = accounts.find(a => a.id === transaction.account_id);
    const formattedAmount = formatCurrency(transaction.amount);
    const isExpense = transaction.type === 'expense';

    let description = '';

    if (transaction.goal_id) {
      description = `Adicionado ${formattedAmount} ao objetivo "${transaction.description}"`;
    } else {
      description = `${isExpense ? 'Despesa' : 'Receita'} na categoria `;
      description += `<strong>${transaction.category}</strong>`;
      description += ` no valor de ${isExpense ? '- ' : ''}${formattedAmount}`;

      if (account) {
        description += ` (${account.name})`;
      }
    }

    return description;
  };

  return (
    <>
      <div className="space-y-3">
        {filteredTransactions.map((transaction) => {
          const date = format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR });
          const description = getTransactionDescription(transaction);
          const isExpense = transaction.type === 'expense';

          return (
            <div
              key={transaction.id}
              className="relative touch-pan-y select-none"
              style={{
                touchAction: 'pan-y',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none'
              }}
              onTouchStart={(e) => onTouchStart(e, transaction.id)}
              onTouchMove={onTouchMove}
              onTouchEnd={(e) => onTouchEnd(e, transaction.id)}
              onMouseDown={(e) => onMouseDown(e, transaction.id)}
              onMouseMove={onMouseMove}
              onMouseUp={(e) => onMouseUp(e, transaction.id)}
              onMouseLeave={onMouseLeave}
            >
              {/* Delete buttons on both sides */}
              <div className="absolute inset-y-0 right-0 flex">
                <button
                  onClick={() => handleDelete(transaction.id)}
                  className="w-[80px] bg-red-500 flex items-center justify-center rounded-r-lg"
                >
                  <Trash2 className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="absolute inset-y-0 left-0 flex">
                <button
                  onClick={() => handleDelete(transaction.id)}
                  className="w-[80px] bg-red-500 flex items-center justify-center rounded-l-lg"
                >
                  <Trash2 className="h-6 w-6 text-white" />
                </button>
              </div>

              {/* Transaction card */}
              <div 
                className={`bg-white p-4 rounded-lg shadow-sm border-l-4 relative z-10 ${
                  isExpense ? 'border-red-500' : 'border-[#00CC73]'
                } hover:shadow-md transition-shadow duration-200`}
                style={{
                  transform: swipedTransactionId === transaction.id ? `translateX(${currentTranslate.current}px)` : 'translateX(0)',
                  transition: 'transform 0.2s ease-out',
                  cursor: 'grab'
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <p 
                    className="text-sm text-gray-700 leading-relaxed flex-1"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">{date}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTransactions.length === 0 && (
          <div className="bg-white rounded-lg p-6 text-center text-gray-500">
            Nenhuma transação encontrada
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTransactionToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir Transação"
        message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
      />
    </>
  );
}