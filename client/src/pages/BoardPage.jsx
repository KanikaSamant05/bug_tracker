import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import KanbanBoard from "../components/KanbanBoard";
import CreateIssue from "../components/CreateIssue";
import TicketModal from "../components/TicketModal";

const socket = io(import.meta.env.VITE_API_URL);

function BoardPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem("token");

  const [tickets, setTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [project, setProject] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  useEffect(() => {
    if (!token) return;

    fetch(`http://localhost:5000/projects/${projectId}`, {
      headers: { authorization: token }
    })
      .then(res => res.json())
      .then(data => setProject(data))
      .catch(() => {});

    fetch(`http://localhost:5000/tickets?projectId=${projectId}`, {
      headers: { authorization: token }
    })
      .then(res => res.json())
      .then(data => setTickets(Array.isArray(data) ? data : []))
      .catch(() => setTickets([]));
  }, [projectId]);

  useEffect(() => {
    const ticketId = searchParams.get("ticket");
    if (ticketId) {
      setSelectedTicketId(ticketId);
      setSearchParams({});
    }
  }, [searchParams]);

  useEffect(() => {
    socket.emit("join-project", projectId);

    socket.on("ticket-created", (ticket) => {
      setTickets(prev => {
        if (prev.find(t => t._id === ticket._id)) return prev;
        return [ticket, ...prev];
      });
    });

    socket.on("ticket-updated", (updated) => {
      setTickets(prev =>
        prev.map(t => t._id === updated._id ? updated : t)
      );
    });

    socket.on("ticket-deleted", (id) => {
      setTickets(prev => prev.filter(t => t._id !== id));
    });

    return () => {
      socket.emit("leave-project", projectId);
      socket.off("ticket-created");
      socket.off("ticket-updated");
      socket.off("ticket-deleted");
    };
  }, [projectId]);

  const handleNewTicket = () => {};

  const filteredTickets = tickets
    .filter(t => {
      const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || t.priority === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "priority") {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      }
      if (sort === "title") return a.title?.localeCompare(b.title);
      return 0;
    });

  const total = tickets.length;
  const todo = tickets.filter(t => t.status === "todo").length;
  const inprogress = tickets.filter(t => t.status === "inprogress").length;
  const done = tickets.filter(t => t.status === "done").length;

  return (
    <div className="p-6 bg-gray-50 min-h-full">

      {/* header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => navigate("/")}
          >
            🐞 Bug Tracker
          </h1>
          {project && (
            <>
              <span className="text-gray-300">/</span>
              <span
                className="text-gray-500 text-sm cursor-pointer hover:text-blue-500"
                onClick={() => navigate("/projects")}
              >
                Projects
              </span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-700 text-sm font-medium">{project.name}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-green-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Live
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm cursor-pointer"
          >
            + New Issue
          </button>
        </div>
      </div>

      {/* search + filter + sort */}
      <div className="flex gap-2 mb-6 flex-wrap items-center">

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="#94a3b8" strokeWidth="1.5"/>
            <path d="M10 10L14 14" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            placeholder="Search tickets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[38px] pl-9 pr-3 w-52 text-sm border-[1.5px] border-slate-200 rounded-[10px] bg-white outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100 hover:border-indigo-200 transition-all"
          />
        </div>

        {/* Priority filter */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M1 3h12M3 7h8M5 11h4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-[38px] pl-9 pr-8 text-sm border-[1.5px] border-slate-200 rounded-[10px] bg-white outline-none appearance-none cursor-pointer focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100 hover:border-indigo-200 transition-all"
          >
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 3.5L5 6.5L8 3.5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Sort — segmented control */}
        <div className="flex border-[1.5px] border-slate-200 rounded-[10px] overflow-hidden bg-white">
          {[
            { value: "newest", label: "Newest" },
            { value: "oldest", label: "Oldest" },
            { value: "priority", label: "Priority" },
            { value: "title", label: "A–Z" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              className={`h-[38px] px-3.5 text-xs font-medium border-r border-slate-200 last:border-r-0 transition-all whitespace-nowrap
                ${sort === value
                  ? "bg-indigo-500 text-white"
                  : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Reset */}
        {(search || filter !== "all" || sort !== "newest") && (
          <button
            onClick={() => { setSearch(""); setFilter("all"); setSort("newest"); }}
            className="h-[38px] px-3 text-xs text-slate-400 border-[1.5px] border-dashed border-slate-200 rounded-[10px] hover:text-red-400 hover:border-red-300 flex items-center gap-1.5 transition-all"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Reset
          </button>
        )}
      </div>

      {/* stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Total</p>
          <h2 className="text-2xl font-bold">{total}</h2>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="text-sm">To Do</p>
          <h2 className="text-xl font-semibold">{todo}</h2>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg">
          <p className="text-sm">In Progress</p>
          <h2 className="text-xl font-semibold">{inprogress}</h2>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-sm">Done</p>
          <h2 className="text-xl font-semibold">{done}</h2>
        </div>
      </div>

      {showModal && (
        <CreateIssue
          onCreate={handleNewTicket}
          onClose={() => setShowModal(false)}
          projectId={projectId}
          projectMembers={project?.members || []}
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

      <KanbanBoard
        tickets={filteredTickets}
        setTickets={setTickets}
        projectMembers={project?.members || []}
        projectId={projectId}
      />
    </div>
  );
}

export default BoardPage;