import {
  DndContext,
  closestCenter,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { useState } from "react";
import TicketCard from "./TicketCard";
import CreateIssue from "./CreateIssue";
import TicketModal from "./TicketModal";

function Column({ id, title, tickets, handleDelete, handleEdit, handleView }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="w-1/3 bg-gray-100 p-3 rounded-lg min-h-32">
      <h2 className="font-semibold mb-2">{title}</h2>
      {tickets.map(t => (
        <TicketCard
          key={t._id}
          ticket={t}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onView={handleView}
        />
      ))}
    </div>
  );
}

// ✅ accept projectMembers and projectId
function KanbanBoard({ tickets, setTickets, projectMembers = [], projectId }) {
  const [editingTicket, setEditingTicket] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const token = localStorage.getItem("token");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    const ticketId = active.id;
    const newStatus = over.id;
    setTickets(tickets.map(t =>
      t._id === ticketId ? { ...t, status: newStatus } : t
    ));
    await fetch(`http://localhost:5000/tickets/${ticketId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({ status: newStatus })
    });
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/tickets/${id}`, {
      method: "DELETE",
      headers: { Authorization: token }
    });
    setTickets(prev => prev.filter(t => t._id !== id));
  };

  return (
    <>
      {editingTicket && (
        <CreateIssue
          existingTicket={editingTicket}
          projectId={projectId}
          projectMembers={projectMembers}  // ✅ pass members to edit form
          onClose={() => setEditingTicket(null)}
          onCreate={(updated) => {
            setTickets(prev =>
              prev.map(t => t._id === updated._id ? updated : t)
            );
            setEditingTicket(null);
          }}
        />
      )}

      {selectedTicketId && (
        <TicketModal
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onUpdate={(updated) => {
            setTickets(prev =>
              prev.map(t => t._id === updated._id ? updated : t)
            );
          }}
        />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4">
          <Column
            id="todo"
            title="To Do"
            tickets={tickets.filter(t => t.status === "todo")}
            handleDelete={handleDelete}
            handleEdit={(t) => setEditingTicket(t)}
            handleView={(id) => setSelectedTicketId(id)}
          />
          <Column
            id="inprogress"
            title="In Progress"
            tickets={tickets.filter(t => t.status === "inprogress")}
            handleDelete={handleDelete}
            handleEdit={(t) => setEditingTicket(t)}
            handleView={(id) => setSelectedTicketId(id)}
          />
          <Column
            id="done"
            title="Done"
            tickets={tickets.filter(t => t.status === "done")}
            handleDelete={handleDelete}
            handleEdit={(t) => setEditingTicket(t)}
            handleView={(id) => setSelectedTicketId(id)}
          />
        </div>
      </DndContext>
    </>
  );
}

export default KanbanBoard;