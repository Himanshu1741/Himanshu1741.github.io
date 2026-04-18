/**
 * DeadlineCalendar.js
 * Wrapper around react-big-calendar — imported dynamically (ssr:false) from
 * the deadlines page to avoid SSR issues.
 */
import moment from "moment";
import { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

// Urgency → colour
function eventColor(event) {
  if (event.resource?.overdue) return "#ef4444"; // red
  const days = event.resource?.daysLeft ?? 999;
  if (days === 0) return "#f97316"; // orange — today
  if (days <= 3) return "#eab308"; // yellow — soon
  if (days <= 7) return "#3b82f6"; // blue — this week
  return "#10b981"; // green — future
}

export default function DeadlineCalendar({ events, onSelectEvent }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted on client
  if (!mounted) {
    return (
      <div className="h-[540px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 flex items-center justify-center">
        <p className="text-slate-400">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
      <style>{`
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-header {
          padding: 8px 3px;
          font-weight: 600;
          font-size: 12px;
          color: #94a3b8;
          background: transparent;
          border-color: rgba(100, 116, 139, 0.1);
        }
        .rbc-today {
          background-color: rgba(251, 146, 60, 0.05);
        }
        .rbc-off-range-bg {
          background-color: transparent;
        }
        .rbc-event {
          padding: 1px 4px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        .rbc-event-label {
          font-size: 11px;
        }
        .rbc-toolbar {
          padding: 12px 0;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .rbc-toolbar button {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rbc-toolbar button:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .rbc-toolbar button.rbc-active {
          background: #f59e0b;
          color: white;
          border-color: #f59e0b;
        }
        .dark .rbc-toolbar button {
          background: #1e293b;
          border-color: #334155;
          color: #cbd5e1;
        }
        .dark .rbc-toolbar button:hover {
          background: #334155;
        }
        .dark .rbc-toolbar button.rbc-active {
          background: #f59e0b;
          color: white;
          border-color: #f59e0b;
        }
        .rbc-month-view,
        .rbc-week-view,
        .rbc-agenda-view {
          border: none;
          color: #1e293b;
        }
        .dark .rbc-month-view,
        .dark .rbc-week-view,
        .dark .rbc-agenda-view {
          color: #e2e8f0;
        }
        .rbc-date-cell {
          padding: 4px 2px;
          text-align: right;
          font-size: 11px;
        }
        .rbc-cell {
          border-color: rgba(100, 116, 139, 0.1);
        }
        .dark .rbc-cell {
          border-color: rgba(100, 116, 139, 0.2);
        }
        .rbc-agenda-view {
          font-size: 13px;
        }
        .rbc-agenda-view table.rbc-agenda-table {
          border: 1px solid rgba(100, 116, 139, 0.1);
        }
        .dark .rbc-agenda-view table.rbc-agenda-table {
          border-color: rgba(100, 116, 139, 0.2);
        }
      `}</style>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 540 }}
        onSelectEvent={onSelectEvent}
        views={["month", "week", "agenda"]}
        defaultView="month"
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: eventColor(event),
            borderColor: eventColor(event),
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 600,
            padding: "1px 4px",
            cursor: "pointer",
          },
        })}
        popup
      />
    </div>
  );
}
