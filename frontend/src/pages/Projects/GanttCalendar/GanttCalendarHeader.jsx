import React, { useMemo } from 'react';
import moment from 'moment';

const GanttCalendarHeader = ({ dateRange }) => {
  const calendarDays = useMemo(() => {
    const days = [];
    const start = moment(dateRange.start);
    const end = moment(dateRange.end);

    let current = start.clone();
    let currentMonth = null;
    const months = [];

    while (current.isSameOrBefore(end)) {
      const monthName = current.format('MMMM YYYY');

      if (currentMonth !== monthName) {
        const monthStart = current.clone();
        const monthEnd = current.clone().endOf('month');
        const daysInMonth = monthEnd.date();

        months.push({
          name: monthName,
          shortName: current.format('MMM'),
          year: current.format('YYYY'),
          daysInMonth: daysInMonth,
          startDate: monthStart.format('YYYY-MM-DD')
        });

        currentMonth = monthName;
      }

      days.push({
        date: current.format('YYYY-MM-DD'),
        day: current.date(),
        dayOfWeek: current.format('ddd'),
        isWeekend: current.day() === 0 || current.day() === 6,
        month: current.format('MMM')
      });

      current.add(1, 'day');
    }

    return { days, months };
  }, [dateRange]);

  return (
    <div className="gantt-calendar-header">
      {/* Month Row */}
      <div className="calendar-months-row">
        {calendarDays.months.map((month, index) => (
          <div
            key={index}
            className="calendar-month"
            style={{ width: `${month.daysInMonth * 80}px` }}
          >
            <span className="month-name">{month.name}</span>
          </div>
        ))}
      </div>

      {/* Days Row */}
      <div className="calendar-days-row">
        {calendarDays.days.map((day, index) => (
          <div
            key={index}
            className={`calendar-day ${day.isWeekend ? 'weekend' : ''}`}
            style={{ width: '80px' }}
          >
            <span className="day-number">{day.day}</span>
            <span className="day-name">{day.dayOfWeek}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GanttCalendarHeader;
