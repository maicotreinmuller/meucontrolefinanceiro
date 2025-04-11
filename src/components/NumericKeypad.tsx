import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

export function NumericKeypad({ value, onChange, onClose }: NumericKeypadProps) {
  useEffect(() => {
    const nav = document.querySelector('nav.fixed.bottom-0');
    if (nav) {
      nav.classList.add('hidden');
    }
    return () => {
      if (nav) {
        nav.classList.remove('hidden');
      }
    };
  }, []);

  const formatToBRL = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleNumberClick = (num: string) => {
    const currentNumbers = value.replace(/\D/g, '');
    const newValue = currentNumbers + num;
    onChange(formatToBRL(newValue));
  };

  const handleDelete = () => {
    const currentNumbers = value.replace(/\D/g, '');
    const newValue = currentNumbers.slice(0, -1);
    onChange(formatToBRL(newValue || '0'));
  };

  const handleClear = () => {
    onChange('0,00');
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-end">
      <div className="w-full bg-gradient-to-b from-[#1C1C1E] to-black rounded-t-3xl overflow-hidden animate-slide-up">
        {/* Display */}
        <div className="bg-gradient-to-b from-black/90 to-black/70 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Valor</span>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600/30 text-white hover:bg-gray-500/30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="text-5xl font-light text-white tracking-tight">
            R$ {value}
          </div>
        </div>

        {/* Keypad */}
        <div className="p-4 grid grid-cols-3 gap-3">
          {/* First Row */}
          <button
            onClick={handleClear}
            className="h-16 rounded-2xl bg-red-500/20 text-red-500 text-xl font-medium hover:bg-red-500/30 active:bg-red-500/40 transition-colors flex items-center justify-center"
          >
            C
          </button>
          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-gray-500/20 text-gray-300 text-xl hover:bg-gray-500/30 active:bg-gray-500/40 transition-colors flex items-center justify-center"
          >
            ←
          </button>
          <button
            onClick={() => handleNumberClick('00')}
            className="h-16 rounded-2xl bg-gray-500/20 text-gray-300 text-xl hover:bg-gray-500/30 active:bg-gray-500/40 transition-colors flex items-center justify-center"
          >
            00
          </button>

          {/* Number Rows */}
          {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="h-16 rounded-2xl bg-white/10 text-white text-2xl font-light hover:bg-white/15 active:bg-white/20 transition-colors flex items-center justify-center"
            >
              {num}
            </button>
          ))}

          {/* Last Row */}
          <button
            onClick={() => handleNumberClick('0')}
            className="col-span-2 h-16 rounded-2xl bg-white/10 text-white text-2xl font-light hover:bg-white/15 active:bg-white/20 transition-colors flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={() => handleNumberClick(',')}
            className="h-16 rounded-2xl bg-gray-500/20 text-gray-300 text-2xl hover:bg-gray-500/30 active:bg-gray-500/40 transition-colors flex items-center justify-center"
          >
            ,
          </button>

          {/* Confirm Button */}
          <button
            onClick={onClose}
            className="col-span-3 h-16 mt-2 rounded-2xl bg-green-500 text-white text-xl font-medium hover:bg-green-600 active:bg-green-700 transition-colors flex items-center justify-center"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}