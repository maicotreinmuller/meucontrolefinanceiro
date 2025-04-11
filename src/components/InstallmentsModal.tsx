import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Plus, Minus } from 'lucide-react';

interface InstallmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  selectedInstallments: number;
  onSelect: (installments: number) => void;
}

export function InstallmentsModal({
  isOpen,
  onClose,
  amount,
  selectedInstallments,
  onSelect,
}: InstallmentsModalProps) {
  const [installments, setInstallments] = React.useState(selectedInstallments);

  const handleIncrement = () => {
    if (installments < 24) {
      setInstallments(installments + 1);
    }
  };

  const handleDecrement = () => {
    if (installments > 1) {
      setInstallments(installments - 1);
    }
  };

  const handleConfirm = () => {
    onSelect(installments);
    onClose();
  };

  const installmentAmount = amount / installments;

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={onClose}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <Dialog.Title
                as="div"
                className="flex items-center justify-between mb-4"
              >
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Número de Parcelas
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Title>

              <div className="mt-4">
                <div className="text-center mb-8">
                  <div className="text-2xl font-bold text-gray-900">
                    {installments}x
                  </div>
                  <div className="text-sm text-gray-500">
                    de{' '}
                    {installmentAmount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 mb-8">
                  <button
                    onClick={handleDecrement}
                    className="p-3 rounded-full hover:bg-gray-100"
                    disabled={installments <= 1}
                  >
                    <Minus
                      className={`h-6 w-6 ${
                        installments <= 1
                          ? 'text-gray-300'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>

                  <div className="w-24 h-12 flex items-center justify-center border-2 border-gray-200 rounded-lg">
                    <span className="text-xl font-medium">
                      {installments}
                    </span>
                  </div>

                  <button
                    onClick={handleIncrement}
                    className="p-3 rounded-full hover:bg-gray-100"
                    disabled={installments >= 24}
                  >
                    <Plus
                      className={`h-6 w-6 ${
                        installments >= 24
                          ? 'text-gray-300'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                </div>

                <button
                  onClick={handleConfirm}
                  className="w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}