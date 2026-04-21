import { useState } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import Profile from "./pages/Profile";
import Projects from "./pages/Projects";
import BoardPage from "./pages/BoardPage";          // ✅ import from pages
import { Routes, Route, Navigate } from "react-router-dom";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const handleLogin = () => {
    setToken(localStorage.getItem("token"));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home onLogout={handleLogout} />} />

          <Route
            path="/login"
            element={token ? <Navigate to="/projects" /> : <Login onLogin={handleLogin} />}
          />

          <Route
            path="/signup"
            element={token ? <Navigate to="/projects" /> : <Signup onLogin={handleLogin} />}
          />

          <Route
            path="/projects"
            element={token ? <Projects onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          <Route
            path="/profile"
            element={token ? <Profile onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          <Route
            path="/app/:projectId"
            element={token ? <BoardPage /> : <Navigate to="/" />}
          />

          <Route path="/app" element={<Navigate to="/projects" />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;