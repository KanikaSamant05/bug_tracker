import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile({ onLogout }) {
  const [user, setUser] = useState(null);
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) { navigate("/"); return; }

    const fetchData = async () => {
      try {
        const [userRes, ticketsRes] = await Promise.all([
          fetch("http://localhost:5000/me", { headers: { authorization: token } }),
          fetch("http://localhost:5000/tickets/assigned", { headers: { authorization: token } }),
        ]);
        const userData = await userRes.json();
        const ticketsData = await ticketsRes.json();
        setUser(userData);
        setAssignedTickets(Array.isArray(ticketsData) ? ticketsData : []);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  const priorityStyles = {
    low: "text-green-600 bg-green-100",
    medium: "text-orange-500 bg-orange-100",
    high: "text-red-500 bg-red-100",
    critical: "text-purple-600 bg-purple-100",
  };

  const statusLabels = { todo: "To Do", inprogress: "In Progress", done: "Done" };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">

        {/* profile card */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold mb-3">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>

          <div className="border-t border-gray-100 pt-5 space-y-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Full Name</p>
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</p>
              <p className="text-sm font-medium text-gray-700">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Member Since</p>
              <p className="text-sm font-medium text-gray-700">
                {new Date(user?.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => navigate("/projects")}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors cursor-pointer"
            >
              ← Back to Projects
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {/* ✅ assigned tickets */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4">
            🎯 Assigned to Me ({assignedTickets.length})
          </h3>

          {assignedTickets.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-4">
              No tickets assigned to you yet.
            </p>
          ) : (
            <div className="space-y-3">
              {assignedTickets.map(t => (
                <div
                  key={t._id}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/app/${t.project}?ticket=${t._id}`)}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{statusLabels[t.status]}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityStyles[t.priority]}`}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Profile;