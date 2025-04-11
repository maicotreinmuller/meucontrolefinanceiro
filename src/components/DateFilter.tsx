import React from 'react';
import { Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DateFilter({ startDate, endDate, onStartDateChange, onEndDateChange }: DateFilterProps) {
  const handleDateChange = (value: string, isStartDate: boolean) => {
    // Ensure we're working with the date part only
    const formattedDate = format(parseISO(value), 'yyyy-MM-dd');
    if (isStartDate) {
      onStartDateChange(formattedDate);
    } else {
      onEndDateChange(formattedDate);
    }
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 mb-6 border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="flex items-center text-gray-400">
          <Calendar className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleDateChange(e.target.value, true)}
            className="px-2 py-1 rounded border-0 bg-transparent focus:ring-0 text-gray-600 w-auto"
          />
          <span className="text-gray-400">→</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleDateChange(e.target.value, false)}
            className="px-2 py-1 rounded border-0 bg-transparent focus:ring-0 text-gray-600 w-auto"
          />
        </div>
      </div>
    </div>
  );
}