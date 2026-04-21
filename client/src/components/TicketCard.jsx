import { useDraggable } from "@dnd-kit/core";

const priorityStyles = {
  low: "text-green-600 bg-green-100",
  medium: "text-orange-500 bg-orange-100",
  high: "text-red-500 bg-red-100",
  critical: "text-purple-600 bg-purple-100",
};

const priorityIcons = {
  low: "🟢",
  medium: "🟠",
  high: "🔴",
  critical: "🚨",
};

function TicketCard({ ticket, onDelete, onEdit, onView }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket._id,
  });

  const assigneeName = ticket.assignedTo?.name || null;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3
        cursor-crosshair select-none hover:shadow-md hover:border-blue-200 transition-all
        ${isDragging ? "opacity-0 pointer-events-none" : ""}
      `}
    >
      {/* drag handle */}
      <div className="flex justify-center mb-2">
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <circle cx="2" cy="2" r="1.2" fill="#d1d5db"/>
          <circle cx="8" cy="2" r="1.2" fill="#d1d5db"/>
          <circle cx="14" cy="2" r="1.2" fill="#d1d5db"/>
          <circle cx="2" cy="8" r="1.2" fill="#d1d5db"/>
          <circle cx="8" cy="8" r="1.2" fill="#d1d5db"/>
          <circle cx="14" cy="8" r="1.2" fill="#d1d5db"/>
        </svg>
      </div>

      {/* title */}
      <p className="font-semibold text-gray-800 text-sm mb-2 leading-snug">
        {ticket.title}
      </p>

      {/* priority + info + assignee */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityStyles[ticket.priority]}`}>
          {priorityIcons[ticket.priority]} {ticket.priority}
        </span>

        <div className="flex items-center gap-1.5">
          {/* info icon — opens TicketModal */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onView(ticket._id); }}
            className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M7 6.5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="7" cy="4.5" r="0.7" fill="currentColor"/>
            </svg>
          </button>

          {assigneeName && (
            <div
              className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
              title={assigneeName}
            >
              {assigneeName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* actions */}
      <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEdit(ticket); }}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-md transition-all cursor-pointer"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M8.5 1.5a1.414 1.414 0 0 1 2 2L4 10H2v-2L8.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Edit
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(ticket._id); }}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded-md transition-all cursor-pointer"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 3h8M5 3V2h2v1M10 3l-.8 7H2.8L2 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}

export default TicketCard;