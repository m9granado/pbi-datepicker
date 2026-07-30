import * as React from "react";
import { isSameDay } from "../utils/dateHelpers";

export interface DayPickerGridProps {
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
  initialDate?: Date;
}

export const DayPickerGrid: React.FC<DayPickerGridProps> = ({
  selectedDate,
  onSelectDate,
  initialDate
}) => {
  const [viewDate, setViewDate] = React.useState<Date>(
    selectedDate || initialDate || new Date()
  );

  const today = new Date();

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // First day of current month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  // Number of days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Days in previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({ date: d, isCurrentMonth: true });
  }

  // Next month leading days to complete week (42 cells total for 6 rows)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(year, month + 1, i);
    days.push({ date: d, isCurrentMonth: false });
  }

  const monthLabel = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(viewDate);

  const weekHeaders = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, userSelect: 'none' }}>
      {/* Month Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 4px' }}>
        <button
          type="button"
          onClick={handlePrevMonth}
          style={{
            border: '1px solid #E0E0E0',
            borderRadius: 4,
            background: '#F8F8F8',
            color: '#555555',
            padding: '2px 8px',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          ‹
        </button>
        <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          style={{
            border: '1px solid #E0E0E0',
            borderRadius: 4,
            background: '#F8F8F8',
            color: '#555555',
            padding: '2px 8px',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', gap: 2 }}>
        {weekHeaders.map(wh => (
          <div key={wh} style={{ fontSize: 11, fontWeight: 600, color: '#888888', padding: '2px 0' }}>
            {wh}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {days.map(({ date, isCurrentMonth }, idx) => {
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const isToday = isSameDay(date, today);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate(date)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                aspectRatio: '1',
                borderRadius: 4,
                border: isToday && !isSelected ? '1px solid #007AFF' : '1px solid transparent',
                backgroundColor: isSelected ? '#007AFF' : (isCurrentMonth ? '#FAFAFA' : '#F2F2F7'),
                color: isSelected ? '#FFFFFF' : (isCurrentMonth ? '#333333' : '#AAAAAA'),
                fontWeight: isToday || isSelected ? 700 : 400,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.1s ease',
                outline: 'none'
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};
