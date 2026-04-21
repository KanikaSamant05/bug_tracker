import { useState, useEffect } from "react";

function CreateIssue({ onCreate, onClose, existingTicket, projectId, projectMembers = [] }) {
  const [tab, setTab] = useState("create"); // "create" or "invite"
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("low");
  const [assignedTo, setAssignedTo] = useState("");
    const [dueDate, setDueDate] = useState("");  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviting, setInviting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (existingTicket) {
      setTitle(existingTicket.title);
      setDescription(existingTicket.description || "");
      setPriority(existingTicket.priority);
      setAssignedTo(existingTicket.assignedTo?._id || existingTicket.assignedTo || "");
       setDueDate(existingTicket.dueDate
        ? new Date(existingTicket.dueDate).toISOString().split("T")[0]
        : ""
      );
    }
  }, [existingTicket]);

const handleSubmit = async (e) => {
  e.preventDefault();

  // ✅ block submit if no assignee picked
  if (projectMembers.length > 0 && !assignedTo) {
    alert("Please assign this ticket to a team member.");
    return;
  }

  const token = localStorage.getItem("token");
  let res;

  if (existingTicket) {
    res = await fetch(`${import.meta.env.VITE_API_URL}/tickets/${existingTicket._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({
        title, description, priority,
        assignedTo: assignedTo || null,
      })
    });
  } else {
    res = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({
        title,
        description,
        priority,
        status: "todo",
        project: projectId,
        assignedTo: assignedTo || null,
        dueDate: dueDate || null,
      })
    });
  }

  const data = await res.json();
  onCreate(data);
  onClose();
};

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email: inviteEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setInviteMsg("✅ Member added successfully!");
        setInviteEmail("");
      } else {
        setInviteMsg(`❌ ${data.message}`);
      }
    } catch (err) {
      setInviteMsg("❌ Something went wrong");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">

        {/* tabs - only show invite tab when not editing */}
        {!existingTicket && (
          <div className="flex gap-1 mb-5 border-b border-gray-100 pb-3">
            <button
              onClick={() => setTab("create")}
              className={`text-sm px-3 py-1 rounded-md font-medium transition-colors ${
                tab === "create"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-400 hover:text-gray-600 cursor-pointer"
              }`}
            >
              New Issue
            </button>
            <button
              onClick={() => { setTab("invite"); setInviteMsg(""); }}
              className={`text-sm px-3 py-1 rounded-md font-medium transition-colors ${
                tab === "invite"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-400 hover:text-gray-600 bg-gray-100 cursor-pointer"
              }`}
            >
               Invite Member
            </button>
          </div>
        )}

        {/* CREATE ISSUE TAB */}
        {(tab === "create" || existingTicket) && (
          <>
            <h2 className="text-lg font-semibold mb-4">
              {existingTicket ? "Edit Issue" : "Create Issue"}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                className="border p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                placeholder="Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <textarea
                className="border p-2 rounded resize-none text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                placeholder="Description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <select
                className="border p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟠 Medium</option>
                <option value="high">🔴 High</option>
                <option value="critical">🚨 Critical</option>
              </select>

        {projectMembers.length > 0 && (
  <select
    className="border p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
    value={assignedTo}
    onChange={(e) => setAssignedTo(e.target.value)}
    required  // ✅ required
  >
    <option value="" disabled> Assign to...</option>
    {projectMembers.map(m => (
      <option key={m._id} value={m._id}>
        {m.name} ({m.email})
      </option>
    ))}
  </select>
)}

              <div className="flex justify-between mt-3">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm cursor-pointer"
                >
                  {existingTicket ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-red-500 hover:text-red-700 text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}

        {/* INVITE TAB */}
        {tab === "invite" && !existingTicket && (
          <>
            <h2 className="text-lg font-semibold mb-1">Invite Team Member</h2>
            <p className="text-xs text-gray-400 mb-4">
              They must already have a Bug Tracker account.
            </p>

            <form onSubmit={handleInvite} className="flex flex-col gap-3">
              <input
                type="email"
                className="border p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                placeholder="Email address *"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />

              {inviteMsg && (
                <p className="text-sm">{inviteMsg}</p>
              )}

              <div className="flex justify-between mt-2">
                <button
                  type="submit"
                  disabled={inviting}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm disabled:opacity-50"
                >
                  {inviting ? "Inviting..." : "Send Invite"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* current members */}
            {projectMembers.length > 0 && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                  Current Members
                </p>
                {projectMembers.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {m.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default CreateIssue;