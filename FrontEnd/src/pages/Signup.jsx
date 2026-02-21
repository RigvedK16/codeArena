import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../utils/api";

export default function Signup() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    emailId: "",
    password: "",
    age: "",
    gender: "male",
    city: "",
    country: "",
  });

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        emailId: form.emailId,
        password: form.password,
        age: Number(form.age),
        gender: form.gender,
        photoUrl: "https://geographyandyou.com/images/user-profile.png",
        location: { city: form.city, country: form.country },
      };
      await api("/signup", { method: "POST", body: payload });
      navigate("/login");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black flex items-center justify-center py-10 px-4">
      <div className="card w-full max-w-2xl bg-white shadow-2xl">
        <div className="card-body">
          <h2 className="card-title text-3xl font-bold text-center justify-center mb-6">
            Create your Cooper account
          </h2>
          
          <form className="flex flex-col gap-4" onSubmit={submit}>
            {/* Row 1: Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-base font-medium">First Name</span>
                </label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={update}
                  type="text"
                  placeholder="John"
                  className="input input-bordered w-full bg-white text-black border border-black"
                  required
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-base font-medium">Last Name</span>
                </label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={update}
                  type="text"
                  placeholder="Doe"
                  className="input input-bordered w-full bg-white text-black border border-black"
                  required
                />
              </div>
            </div>

            {/* Row 2: Email */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-base font-medium">Email</span>
              </label>
              <input
                name="emailId"
                value={form.emailId}
                onChange={update}
                type="email"
                placeholder="john@example.com"
                className="input input-bordered w-full bg-white text-black border border-black"
                required
              />
            </div>

            {/* Row 3: Password */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-base font-medium">Password</span>
              </label>
              <input
                name="password"
                value={form.password}
                onChange={update}
                type="password"
                placeholder="••••••••"
                className="input input-bordered w-full bg-white text-black border border-black"
                required
              />
            </div>

            {/* Row 4: Age & Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-base font-medium">Age</span>
                </label>
                <input
                  name="age"
                  value={form.age}
                  onChange={update}
                  type="number"
                  min="18"
                  placeholder="25"
                  className="input input-bordered w-full bg-white text-black border border-black"
                  required
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-base font-medium">Gender</span>
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={update}
                  className="select select-bordered w-full bg-white text-black border border-black"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="others">Others</option>
                </select>
              </div>
            </div>

            {/* Row 5: Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-base font-medium">City</span>
                </label>
                <input
                  name="city"
                  value={form.city}
                  onChange={update}
                  type="text"
                  placeholder="Mumbai"
                  className="input input-bordered w-full bg-white text-black border border-black"
                  required
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-base font-medium">Country</span>
                </label>
                <input
                  name="country"
                  value={form.country}
                  onChange={update}
                  type="text"
                  placeholder="India"
                  className="input input-bordered w-full bg-white text-black border border-black"
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div className="card-actions justify-between items-center pt-6">
              <Link to="/login" className="link link-hover text-sm text-gray-600">
                Already have an account? Login.
              </Link>
              <button className="btn  text-white bg-emerald-500 border-none px-8" type="submit" disabled={loading}>
                {loading ? "Signing up..." : "Sign Up"}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}