import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // step 1 — signup
      const res = await fetch(`${import.meta.env.VITE_API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (res.ok && data._id) {
        // step 2 — auto login
        const loginRes = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();

        if (loginData.token) {
          localStorage.setItem("token", loginData.token);
          onLogin();             
          navigate("/projects"); 
        }
      } else {
        setError(data.message || data.error || "Signup failed");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSignup}
        className="bg-white p-6 rounded-xl shadow w-80"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Signup</h2>

        {error && (
          <p className="text-sm text-center mb-3 text-red-500 bg-red-50 py-2 rounded">
            {error}
          </p>
        )}

        <input
          className="border p-2 w-full mb-3 rounded focus:ring-2 focus:ring-green-400 outline-none"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          className="border p-2 w-full mb-3 rounded focus:ring-2 focus:ring-green-400 outline-none"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          className="border p-2 w-full mb-3 rounded focus:ring-2 focus:ring-green-400 outline-none"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 text-white w-full py-2 rounded hover:bg-green-600 disabled:opacity-50 transition"
        >
          {loading ? "Creating account..." : "Signup"}
        </button>

        <p className="text-sm mt-3 text-center">
          Already have an account?{" "}
          <span
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
}

export default Signup;