import React, { useState } from 'react';
import { Modal } from './Modal';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelect: (date: string) => void;
}

export function DatePickerModal({
  isOpen,
  onClose,
  selectedDate,
  onSelect,
}: DatePickerModalProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(parseISO(selectedDate)));
  const parsedSelectedDate = startOfDay(parseISO(selectedDate));

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateSelect = (date: Date) => {
    // Format the date in ISO format but only take the date part
    const formattedDate = format(date, 'yyyy-MM-dd');
    onSelect(formattedDate);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Selecionar Data">
      <div className="mt-4">
        {/* Current Selection */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg flex items-center">
          <CalendarIcon className="h-5 w-5 text-green-600 mr-3" />
          <div>
            <div className="text-sm text-green-600">Data selecionada</div>
            <div className="text-lg font-medium text-green-700">
              {format(parsedSelectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h4 className="text-lg font-medium text-gray-900">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h4>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const isSelected = isSameDay(day, parsedSelectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);

            return (
              <button
                key={day.toString()}
                onClick={() => handleDateSelect(day)}
                className={`
                  h-10 w-full rounded-full flex items-center justify-center text-sm transition-all
                  ${
                    isSelected
                      ? 'bg-green-500 text-white shadow-lg scale-110'
                      : isCurrentDay
                      ? 'bg-green-50 text-green-600'
                      : 'hover:bg-gray-100'
                  }
                  ${!isCurrentMonth && 'text-gray-300'}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}