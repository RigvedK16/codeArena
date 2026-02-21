// import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
// import Navbar from "./components/Navbar.jsx";
// import LandingPage from "./pages/LandingPage.jsx";
// import Signup from "./pages/Signup.jsx";
// import Login from "./pages/Login.jsx";
// import Dashboard from "./pages/Dashboard.jsx";
// import MyGroups from "./pages/MyGroups.jsx";

// function App() {
//   return (
//     <BrowserRouter>
//       <Navbar />
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/signup" element={<Signup />} />
//         {/* <Route path="/dashboard" element={<Dashboard />} /> */}
//         {/* <Route path="/my-groups" element={<MyGroups />} /> */}
//         <Route
//           path="*"
//           element={
//             <div className="min-h-[60vh] grid place-items-center p-6">
//               <div className="text-center">
//                 <h1 className="text-2xl font-bold">Page not found</h1>
//                 <Link to="/" className="btn btn-primary mt-4">Go Home</Link>
//               </div>
//             </div>
//           }
//         />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;


// App.jsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Problems from "./pages/Problems.jsx"; // 👈 Import new page
// import Dashboard from "./pages/Dashboard.jsx";
import ProblemDetail from "./pages/ProblemDetail.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import Contests from "./pages/Contests.jsx";
import ContestDashboard from "./pages/ContestDashboard.jsx";

function App() {
  return (
    <BrowserRouter>
      <Navbar /> {/* 👈 Navbar on all pages */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/problems"
          element={
            <RequireAuth>
              <Problems />
            </RequireAuth>
          }
        />
        <Route
          path="/problems/:id"
          element={
            <RequireAuth>
              <ProblemDetail />
            </RequireAuth>
          }
        />

        {/* Placeholder routes for future features */}
        <Route
          path="/contests"
          element={
            <RequireAuth>
              <Contests />
            </RequireAuth>
          }
        />
        <Route
          path="/contests/:id"
          element={
            <RequireAuth>
              <ContestDashboard />
            </RequireAuth>
          }
        />
        <Route path="/leaderboard" element={<div className="pt-24 text-center text-2xl">🏆 Leaderboard Coming Soon</div>} />
        <Route path="/practice" element={<div className="pt-24 text-center text-2xl">📚 Practice Mode Coming Soon</div>} />
        <Route path="/dashboard" element={<div className="pt-24 text-center text-2xl">👤 Dashboard Coming Soon</div>} />

        <Route
          path="*"
          element={
            <div className="min-h-[60vh] grid place-items-center p-6 pt-24">
              <div className="text-center">
                <h1 className="text-2xl font-bold">404 - Page not found</h1>
                <Link to="/" className="btn btn-primary mt-4">Go Home</Link>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;