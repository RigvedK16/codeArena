import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../utils/api";
import { useDispatch } from "react-redux";
import { setUser, setError } from "../redux/authSlice";

export default function Login() {
  const [emailId, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api("/login", {
        method: "POST",
        body: { emailId, password },
      });
      dispatch(setUser(response.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="card w-full max-w-md bg-white shadow-2xl mx-auto">
          <div className="card-body">
            <h2 className="card-title text-3xl font-bold text-center justify-center mb-4">
              Sign in to your account
            </h2>

            <form className="flex flex-col gap-4" onSubmit={submit}>
              {/* Email Field */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-base font-medium">
                    Email
                  </span>
                </label>
                <input
                  value={emailId}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="name@example.com"
                  className="input input-bordered w-full bg-white text-black border border-black"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-base font-medium">
                    Password
                  </span>
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full bg-white text-black border border-black"
                  required
                />
              </div>

              {/* Actions */}
              <div className="card-actions justify-between items-center pt-4">
                <Link
                  to="/signup"
                  className="link link-hover text-sm text-gray-600"
                >
                  New here? Create an account.
                </Link>
                <button
                  className="btn px-8 text-white bg-emerald-500 border-none"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
