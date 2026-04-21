import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

function Projects({ onLogout }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:5000/me", {
      headers: { authorization: token }
    })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(() => {});

    fetchProjects();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("http://localhost:5000/projects", {
        headers: { authorization: token }
      });
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("http://localhost:5000/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify({ name, description })
      });
      const data = await res.json();
      setProjects(prev => [data, ...prev]);
      setName("");
      setDescription("");
      setShowCreate(false);
    } catch (err) {
      setError("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project? All tickets will be deleted too.")) return;
    try {
      await fetch(`http://localhost:5000/projects/${id}`, {
        method: "DELETE",
        headers: { authorization: token }
      });
      setProjects(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1
          className="text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => navigate("/")}
        >
          🐞 Bug Tracker
        </h1>

        <div className="flex items-center gap-3">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(prev => !prev)}
              className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold hover:bg-blue-600 transition-colors cursor-pointer"
              title={user?.name}
            >
              {user?.name?.charAt(0).toUpperCase() || "?"}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-11 bg-white rounded-xl shadow-lg border border-gray-100 w-52 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setShowUserMenu(false); navigate("/profile"); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  View Profile
                </button>
                <div className="border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
            <p className="text-sm text-gray-400 mt-1">Select a project to open its board</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors cursor-pointer"
          >
            + New Project
          </button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Create Project</h3>
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <form onSubmit={handleCreate}>
                <input
                  className="border px-3 py-2 rounded w-full mb-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Project name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <textarea
                  className="border px-3 py-2 rounded w-full mb-4 text-sm focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                  placeholder="Description (optional)"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowCreate(false); setError(""); }}
                    className="px-4 py-2 text-sm text-gray-800 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
                  >
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">Loading projects...</p>
        ) : projects.length === 0 ? (
       <div className="text-center py-20">
  <div className="flex justify-center mb-4">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#d1d5db"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  </div>
  <p className="text-gray-500 text-sm">No projects yet. Create your first one!</p>
</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <div
                key={p._id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/app/${p._id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800 text-base">{p.name}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }}
                    className="text-gray-300 hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer"
                    title="Delete project"
                  >
                    {/* ✅ SVG Trash Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
                {p.description && (
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{p.description}</p>
                )}
                <div className="flex justify-between items-center mt-3">
                  <div className="flex -space-x-2">
                    {p.members?.slice(0, 4).map((m, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                        title={m.name}
                      >
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {p.members?.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs border-2 border-white">
                        +{p.members.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Projects;