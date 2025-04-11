import React from 'react';
import { Modal } from './Modal';
import { ChevronRight } from 'lucide-react';

interface ListOption {
  id: string;
  name: string;
  description?: string;
  icon?: React.ElementType;
  color?: string;
}

interface ListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: ListOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function ListModal({
  isOpen,
  onClose,
  title,
  options,
  selectedId,
  onSelect,
}: ListModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="max-h-[60vh] overflow-y-auto -mx-6">
        <div className="px-6 space-y-2">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                className={`w-full flex items-center p-4 transition-colors text-left ${
                  selectedId === option.id
                    ? 'bg-green-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  onSelect(option.id);
                  onClose();
                }}
              >
                <div className="flex-1 flex items-center min-w-0">
                  {Icon && (
                    <div 
                      className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mr-4 ${
                        option.color ? `text-white` : 'text-gray-400'
                      }`}
                      style={option.color ? { backgroundColor: option.color } : undefined}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {option.name}
                    </div>
                    {option.description && (
                      <div className="text-sm text-gray-500 truncate">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className={`h-5 w-5 ml-4 ${
                  selectedId === option.id ? 'text-green-600' : 'text-gray-400'
                }`} />
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}