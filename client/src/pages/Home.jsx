import { Link, useNavigate } from "react-router-dom";

function Home({ onLogout }) {           
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();        

    navigate("/");      
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-500 to-purple-600 text-white">

      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
        <ellipse cx="36" cy="42" rx="16" ry="20" fill="white" fillOpacity="0.95" />
        <circle cx="36" cy="22" r="10" fill="white" fillOpacity="0.95" />
        <circle cx="32" cy="21" r="2" fill="#6366f1" />
        <circle cx="40" cy="21" r="2" fill="#6366f1" />
        <line x1="30" y1="13" x2="22" y2="5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="22" cy="5" r="2.5" fill="white" />
        <line x1="42" y1="13" x2="50" y2="5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="50" cy="5" r="2.5" fill="white" />
        <line x1="20" y1="36" x2="8" y2="30" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="20" y1="43" x2="8" y2="43" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="20" y1="50" x2="8" y2="56" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="52" y1="36" x2="64" y2="30" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="52" y1="43" x2="64" y2="43" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="52" y1="50" x2="64" y2="56" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="22" y1="38" x2="50" y2="38" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="21" y1="46" x2="51" y2="46" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="23" y1="54" x2="49" y2="54" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.4" />
      </svg>

      <h1 className="text-5xl font-bold mb-3">Bug Tracker</h1>
      <p className="text-lg mb-8 text-center max-w-md opacity-90">
        Track and manage your issues efficiently.
      </p>

      {token ? (
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/projects")}  
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Go to Projects →
          </button>
          <button
            onClick={handleLogout}
            className="bg-black/30 px-6 py-2 rounded-lg font-semibold hover:bg-black/50 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
          <Link
            to="/login"
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="bg-black/30 px-6 py-2 rounded-lg font-semibold hover:bg-black/50 transition-colors cursor-pointer"
          >
            Signup
          </Link>
        </div>
      )}
    </div>
  );
}

export default Home;