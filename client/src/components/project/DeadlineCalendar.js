/**
 * DeadlineCalendar.js
 * Wrapper around react-big-calendar — imported dynamically (ssr:false) from
 * the deadlines page to avoid SSR issues.
 */
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
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
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
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
          },
        })}
        popup
      />
    </div>
  );
}
