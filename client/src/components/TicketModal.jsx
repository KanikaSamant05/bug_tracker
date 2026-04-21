import { useEffect, useState } from "react";

const priorityStyles = {
  low: "text-green-600 bg-green-100",
  medium: "text-orange-500 bg-orange-100",
  high: "text-red-500 bg-red-100",
  critical: "text-purple-600 bg-purple-100",
};

const statusColors = {
  todo: "bg-yellow-100 text-yellow-700",
  inprogress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

// ── Avatar helper ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-indigo-500", "bg-blue-500", "bg-emerald-500",
  "bg-rose-500",  "bg-amber-500", "bg-violet-500",
];
function avatarColor(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Members-only modal ───────────────────────────────────────────────────────
function MembersModal({ projectId, assignee, onClose }) {
  const [members, setMembers]   = useState([]);
  const [loadingM, setLoadingM] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!projectId) { setLoadingM(false); return; }
    const load = async () => {
      try {
        const res = await fetch(`http://localhost:5000/projects/${projectId}`, {
          headers: { authorization: token },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.members || []);
        setMembers(list);
      } catch {
        setMembers([]);
      } finally {
        setLoadingM(false);
      }
    };
    load();
  }, [projectId]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const allMembers = (() => {
    if (!assignee?._id) return members;
    const found = members.some((m) => (m._id || m.id) === assignee._id);
    return found ? members : [assignee, ...members];
  })();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm relative flex flex-col max-h-[85vh]">

        {/* close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
        >
          ✕
        </button>

        {/* header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              {/* group / team icon */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="5.5" cy="5" r="2" stroke="#64748b" strokeWidth="1.3"/>
                <path d="M1 13c0-2.2 2-3.5 4.5-3.5S10 10.8 10 13" stroke="#64748b" strokeWidth="1.3" strokeLinecap="round"/>
                <circle cx="11" cy="5" r="1.5" stroke="#64748b" strokeWidth="1.3"/>
                <path d="M12.5 9.6c1.5.4 2.5 1.5 2.5 3.4" stroke="#64748b" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">Members</h3>
              <p className="text-xs text-gray-400">
                {loadingM ? "Loading…" : `${allMembers.length} member${allMembers.length !== 1 ? "s" : ""} in this project`}
              </p>
            </div>
          </div>
        </div>

        {/* list */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loadingM ? (
            <p className="text-sm text-gray-400 text-center py-6">Loading…</p>
          ) : allMembers.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-6">No members yet.</p>
          ) : (
            <ul className="space-y-3">
              {allMembers.map((m) => {
                const id         = m._id || m.id || m.email;
                const name       = m.name  || "Unknown";
                const mail       = m.email || "";
                const isAssignee = assignee?._id && (m._id || m.id) === assignee._id;
                return (
                  <li key={id} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor(name)}`}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{name}</p>
                      <p className="text-xs text-gray-400 truncate">{mail}</p>
                    </div>
                    {isAssignee && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 shrink-0">
                        Assignee
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invite-only modal ─────────────────────────────────────────────────────────
function InviteModal({ projectId, onClose }) {
  const [email, setEmail]     = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setSending(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`http://localhost:5000/projects/${projectId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send invite");
      }
      setSuccess(`Invite sent to ${email}`);
      setEmail("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">

        {/* close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
        >
          ✕
        </button>

        {/* header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="4" r="2.5" stroke="#6366f1" strokeWidth="1.3" />
              <path d="M1 12c0-2.5 2-4 5-4s5 1.5 5 4" stroke="#6366f1" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M11 6v4M9 8h4" stroke="#6366f1" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800">Add Member</h3>
            <p className="text-xs text-gray-400">Send an invite link via email</p>
          </div>
        </div>

        <label className="block text-xs font-medium text-gray-500 mb-1">Email address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
          placeholder="colleague@example.com"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none mb-4"
        />

        {error   && <p className="text-xs text-red-500 mb-3">{error}</p>}
        {success && <p className="text-xs text-green-600 mb-3">{success}</p>}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={sending || !email.trim()}
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
          >
            {sending ? "Adding..." : "Add member"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main TicketModal ─────────────────────────────────────────────────────────
function TicketModal({ ticketId, onClose, onUpdate }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState("comments");
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!ticketId) return;
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/tickets/${ticketId}`, {
          headers: { authorization: token },
        });
        if (!res.ok) throw new Error("Failed to fetch ticket");
        const data = await res.json();
        setTicket(data);
      } catch (err) {
        setError("Couldn't load ticket. Try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleFieldChange = async (field, value) => {
    try {
      const res = await fetch(`http://localhost:5000/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify({ [field]: value }),
      });
      const updated = await res.json();
      setTicket(updated);
      if (onUpdate) onUpdate(updated);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`http://localhost:5000/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify({ text: comment }),
      });
      const updated = await res.json();
      setTicket(updated);
      setComment("");
    } catch (err) {
      console.log(err);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(`http://localhost:5000/tickets/${ticketId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { authorization: token },
      });
      const updated = await res.json();
      setTicket(updated);
    } catch (err) {
      console.log(err);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative max-h-[90vh] flex flex-col">

          {/* header */}
          <div className="p-6 pb-0">

            {/* close + members + invite buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {/* Members button */}
              <button
                onClick={() => setShowMembers(true)}
                className="text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <circle cx="5.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M1 13c0-2.2 2-3.5 4.5-3.5S10 10.8 10 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="11" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M12.5 9.6c1.5.4 2.5 1.5 2.5 3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Team Members
              </button>

              {/* Invite button */}
              <button
                onClick={() => setShowInvite(true)}
                className="text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M1 12c0-2.5 2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  <path d="M11 6v4M9 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                Add members
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loading && <p className="text-gray-500 text-sm text-center py-8">Loading...</p>}
            {error && <p className="text-red-500 text-sm text-center py-8">{error}</p>}

            {!loading && !error && ticket && (
              <>
                <p className="text-xs text-gray-400 mb-1 font-mono">
                  #{ticket._id.slice(-6).toUpperCase()}
                </p>
                <h2 className="text-xl font-bold text-gray-800 pr-8 mb-4">{ticket.title}</h2>

                {/* inline status + priority selects */}
                <div className="flex gap-2 flex-wrap mb-4">
                  <select
                    value={ticket.status}
                    onChange={(e) => handleFieldChange("status", e.target.value)}
                    className={`text-xs font-semibold px-3 py-1 rounded-full border-0 cursor-pointer ${statusColors[ticket.status]}`}
                  >
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="done">Done</option>
                  </select>

                  <select
                    value={ticket.priority}
                    onChange={(e) => handleFieldChange("priority", e.target.value)}
                    className={`text-xs font-semibold px-3 py-1 rounded-full border-0 cursor-pointer ${priorityStyles[ticket.priority]}`}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟠 Medium</option>
                    <option value="high">🔴 High</option>
                    <option value="critical">🚨 Critical</option>
                  </select>

                  {ticket.assignedTo && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      <span className="text-gray-400">Assigned to:</span>
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {(ticket.assignedTo.name || "?").charAt(0).toUpperCase()}
                      </div>
                      {ticket.assignedTo.name || "Assigned"}
                    </div>
                  )}
                </div>

                {/* description */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {ticket.description?.trim()
                      ? ticket.description
                      : <span className="text-gray-400 italic">No description added.</span>}
                  </p>
                </div>

                {/* tabs */}
                <div className="flex gap-4 border-b border-gray-100">
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`text-sm pb-2 font-medium cursor-pointer transition-colors ${
                      activeTab === "comments"
                        ? "border-b-2 border-blue-500 text-blue-600"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    💬 Comments ({ticket.comments?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("activity")}
                    className={`text-sm pb-2 font-medium transition-colors ${
                      activeTab === "activity"
                        ? "border-b-2 border-blue-500 text-blue-600"
                        : "text-gray-400 hover:text-gray-600 cursor-pointer"
                    }`}
                  >
                    🕓 Activity ({ticket.activity?.length || 0})
                  </button>
                </div>
              </>
            )}
          </div>

          {/* scrollable body */}
          {!loading && !error && ticket && (
            <div className="overflow-y-auto flex-1 px-6 py-4">

              {/* COMMENTS */}
              {activeTab === "comments" && (
                <div>
                  <div className="flex gap-2 mb-5">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={posting || !comment.trim()}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 self-end cursor-pointer"
                    >
                      {posting ? "..." : "Post"}
                    </button>
                  </div>

                  {ticket.comments?.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-4">
                      No comments yet. Be the first!
                    </p>
                  ) : (
                    [...(ticket.comments || [])].reverse().map((c) => (
                      <div key={c._id} className="mb-4 flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(c.authorName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700">{c.authorName || "Unknown"}</span>
                              <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteComment(c._id)}
                              className="text-xs text-gray-300 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              🗑️
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                            {c.text}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ACTIVITY */}
              {activeTab === "activity" && (
                <div>
                  {ticket.activity?.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-4">No activity yet.</p>
                  ) : (
                    [...(ticket.activity || [])].reverse().map((a) => (
                      <div key={a._id} className="flex gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
                          {(a.authorName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">{a.text}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(a.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* footer */}
          {!loading && !error && ticket && (
            <div className="px-6 py-3 border-t border-gray-100 flex justify-between text-xs text-gray-400">
              <span>Created: {formatDate(ticket.createdAt)}</span>
              <span>Updated: {formatDate(ticket.updatedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* members modal */}
      {showMembers && (
        <MembersModal
          projectId={ticket?.project?._id || ticket?.project}
          assignee={ticket?.assignedTo}
          onClose={() => setShowMembers(false)}
        />
      )}

      {/* invite modal */}
      {showInvite && (
        <InviteModal
          projectId={ticket?.project?._id || ticket?.project}
          onClose={() => setShowInvite(false)}
        />
      )}
    </>
  );
}

export default TicketModal;