// import { Link, useNavigate } from "react-router-dom";
// import { useSelector, useDispatch } from "react-redux";
// import { clearUser } from "../redux/authSlice";
// import { api } from "../utils/api";

// export default function Navbar() {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   // Get auth state from Redux
//   const { user, isAuthenticated } = useSelector((state) => state.auth);

//   // Handle logout
//   const handleLogout = async () => {
//     try {
//       await api("/logout", { method: "POST" });
//       dispatch(clearUser());
//       navigate("/");
//     } catch (err) {
//       console.error("Logout failed:", err.message);
//     }
//   };

//   return (
//     <div className="navbar sticky top-0 z-40 bg-white/60 backdrop-blur-md border-base-200">
//       <div className="container mx-auto px-4 flex items-center justify-between gap-4">
//         {/* Left */}
//         <div className="flex items-center">
//           <Link
//             to="/"
//             className="text-3xl font-extrabold tracking-tight text-emerald-600"
//           >
//             Cooper
//           </Link>
//         </div>

//         {/* Center (hidden on small) */}
//         <div className="hidden md:flex items-center gap-6"></div>

//         {/* Right */}
//         <div className="flex items-center gap-2">
//           {isAuthenticated && user ? (
//             // Profile dropdown when logged in
//             <div className="dropdown dropdown-end">
//               <div tabIndex={0} role="button" className="avatar cursor-pointer">
//                 <div className="w-10 rounded-full ring ring-emerald-500 ring-offset-2">
//                   <img
//                     src={
//                       user.photoUrl ||
//                       "https://geographyandyou.com/images/user-profile.png"
//                     }
//                     alt="Profile"
//                   />
//                 </div>
//               </div>
//               <ul
//                 tabIndex={0}
//                 className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
//               >
//                 <li className="menu-title">
//                   <span>
//                     {user.firstName} {user.lastName}
//                   </span>
//                 </li>
//                 <li>
//                   <Link to="/dashboard">Dashboard</Link>
//                 </li>
//                 <li>
//                   <a onClick={handleLogout}>Logout</a>
//                 </li>
//               </ul>
//             </div>
//           ) : (
//             // Login and Signup buttons when not authenticated
//             <>
//               <Link
//                 to="/login"
//                 className="btn btn-link text-emerald-600 no-underline"
//               >
//                 Sign In
//               </Link>
//               <Link
//                 to="/signup"
//                 className="btn btn-primary bg-emerald-500 border-none text-white"
//               >
//                 Sign Up
//               </Link>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


// components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../redux/authSlice";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/logout", { method: "POST", credentials: "include" });
      dispatch(clearUser());
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navLinks = [
    { name: "Problems", path: "/problems" },
    { name: "Contests", path: "/contests" },
    { name: "Leaderboard", path: "/leaderboard" },
    { name: "Practice", path: "/practice" },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200"
          : "bg-transparent"
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-xl">⚡</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              CodeArena
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="px-4 py-2 text-gray-700 hover:text-emerald-600 font-medium rounded-lg hover:bg-emerald-50 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-gray-700 hover:text-emerald-600 font-medium"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-3">
                  {user?.photoUrl && (
                    <img
                      src={user.photoUrl}
                      alt={user.firstName}
                      className="w-8 h-8 rounded-full border-2 border-emerald-500"
                    />
                  )}
                  <button
                    onClick={handleLogout}
                    className="btn btn-sm btn-outline border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-emerald-600 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-sm bg-gradient-to-r from-emerald-500 to-cyan-600 border-none text-white px-6 hover:shadow-lg hover:scale-105 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white rounded-b-2xl shadow-lg">
            <div className="flex flex-col gap-2 px-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="px-4 py-3 text-gray-700 hover:text-emerald-600 font-medium rounded-lg hover:bg-emerald-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="my-2" />
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="px-4 py-3 text-gray-700 hover:text-emerald-600 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-3 text-left text-red-600 font-medium hover:bg-red-50 rounded-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-3 text-gray-700 hover:text-emerald-600 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="btn btn-sm bg-gradient-to-r from-emerald-500 to-cyan-600 border-none text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}