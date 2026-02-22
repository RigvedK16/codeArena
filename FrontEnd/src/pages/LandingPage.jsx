// import { Link } from "react-router-dom";
// import { FaRobot, FaMoneyBill, FaUsers, FaChartPie, FaBell, FaDivide, FaBolt } from "react-icons/fa";

// export default function LandingPage() {
//   return (
//     <div className="min-h-screen bg-white text-black">

//       {/* Hero - Centered robot image with text below */}
//       <section className="container mx-auto px-4 py-12">
//         <div className="flex flex-col items-center text-center gap-6">
//           {/* Landing hero video */}
//           <video
//             src="/landingvideo.mp4"
//             className="w-full max-w-md rounded-box shadow"
//             autoPlay
//             loop
//             muted
//             playsInline
//           >
//             Your browser does not support the video tag.
//           </video>
//           <div className="max-w-3xl">
//             <h1 className="text-5xl md:text-6xl font-bold leading-tight text-black">
//               Don't just track debts. Settle them instantly.
//             </h1>
//             <p className="py-6 text-lg text-black/70">
//               The first group expense manager with built-in programmable payments. Pool funds, set rules, and automate settlements.
//             </p>
//             <Link to="/signup" className="btn bg-emerald-500 border-none btn-lg">Get Started</Link>
//           </div>
//         </div>
//       </section>

//       {/* Features Grid */}
//       <section id="features" className="container mx-auto px-4 pb-16">
//         <h2 className="text-3xl font-bold text-center mb-8">Everything you need to split expenses</h2>
//         <div className="grid md:grid-cols-3 gap-6">
//           <div className="card bg-white shadow-xl transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
//             <div className="card-body">
//               <div className="flex items-center gap-3">
//                 <FaUsers className="text-emerald-600 w-6 h-6" />
//                 <h3 className="card-title">Group Expenses</h3>
//               </div>
//               <p>Manage shared costs for trips, dinners, and events.</p>
//             </div>
//           </div>
//           <div className="card bg-white shadow-xl transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
//             <div className="card-body">
//               <div className="flex items-center gap-3">
//                 <FaMoneyBill className="text-emerald-600 w-6 h-6" />
//                 <h3 className="card-title">Smart Settlements</h3>
//               </div>
//               <p>Automate who owes whom and settle instantly.</p>
//             </div>
//           </div>
//           <div className="card bg-white shadow-xl transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
//             <div className="card-body">
//               <div className="flex items-center gap-3">
//                 <FaChartPie className="text-emerald-600 w-6 h-6" />
//                 <h3 className="card-title">Expense Analytics</h3>
//               </div>
//               <p>Insights by category, member, and timeline.</p>
//             </div>
//           </div>
//           <div className="card bg-white shadow-xl transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
//             <div className="card-body">
//               <div className="flex items-center gap-3">
//                 <FaBell className="text-emerald-600 w-6 h-6" />
//                 <h3 className="card-title">Payment Reminders</h3>
//               </div>
//               <p>Never miss a payment with smart nudges.</p>
//             </div>
//           </div>
//           <div className="card bg-white shadow-xl transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
//             <div className="card-body">
//               <div className="flex items-center gap-3">
//                 <FaDivide className="text-emerald-600 w-6 h-6" />
//                 <h3 className="card-title">Multiple Split Types</h3>
//               </div>
//               <p>Equal, percentage, shares, or custom splits.</p>
//             </div>
//           </div>
//           <div className="card bg-white shadow-xl transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
//             <div className="card-body">
//               <div className="flex items-center gap-3">
//                 <FaBolt className="text-emerald-600 w-6 h-6" />
//                 <h3 className="card-title">Real-time Updates</h3>
//               </div>
//               <p>See changes instantly across all members.</p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* How It Works */}
//       <section id="how-it-works" className="container mx-auto px-4 pb-16">
//         <h2 className="text-3xl font-bold text-center mb-8">Splitting expenses has never been easier</h2>
//         <div className="grid md:grid-cols-3 gap-6">
//           <div className="card bg-white shadow transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
//             <div className="card-body items-center text-center">
//               <div className="badge bg-emerald-500 border-none text-white mb-3">1</div>
//               <h3 className="card-title">Create or Join a Group</h3>
//               <p>Invite friends and set up your shared space.</p>
//             </div>
//           </div>
//           <div className="card bg-white shadow transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
//             <div className="card-body items-center text-center">
//               <div className="badge bg-emerald-500 border-none text-white mb-3">2</div>
//               <h3 className="card-title">Add Expenses</h3>
//               <p>Scan bills or add expenses in seconds.</p>
//             </div>
//           </div>
//           <div className="card bg-white shadow transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
//             <div className="card-body items-center text-center">
//               <div className="badge bg-emerald-500 border-none text-white mb-3">3</div>
//               <h3 className="card-title">Settle Up</h3>
//               <p>Smart suggestions and instant settlements.</p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Testimonials */}
//       {/* <section className="container mx-auto px-4 pb-16">
//         <h2 className="text-3xl font-bold text-center mb-8">What our users are saying</h2>
//         <div className="grid md:grid-cols-3 gap-6">
//           {[1,2,3].map((i) => (
//             <div key={i} className="card bg-white shadow transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
//               <div className="card-body">
//                 <div className="flex items-center gap-3">
//                   <div className="avatar placeholder">
//                     <div className="bg-emerald-100 text-emerald-700 rounded-full w-12">
//                       <span className="text-lg">{i}</span>
//                     </div>
//                   </div>
//                   <div>
//                     <h3 className="font-semibold">Babu Rao</h3>
//                     <p className="text-sm opacity-70">Verified user</p>
//                   </div>
//                 </div>
//                 <p className="mt-3">"Ye babu rao ka style hai!"</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section> */}

//       {/* Bottom CTA */}
//       <section className="border-t">
//         <div className="container mx-auto px-4 py-12 text-center text-black">
//           <h2 className="text-3xl font-bold mb-4">Ready to simplify expense sharing?</h2>
//           <Link to="/signup" className="btn bg-white text-emerald-600 border-none">Get Started</Link>
//         </div>
//       </section>
//     </div>
//   );
// }


// pages/LandingPage.jsx
import { Link } from "react-router-dom";
import { FaCode, FaTrophy, FaUsers, FaBolt, FaShieldAlt, FaGlobe } from "react-icons/fa";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 -z-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-cyan-200/30 rounded-full blur-3xl -z-10"></div>

        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
                <FaBolt className="w-4 h-4" />
                Live Contests Every Weekend
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Master Coding with{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                  Real-Time Challenges
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                Practice many problems, compete in live contests, and climb the global leaderboard.
                Support for C++, Java, Python, JavaScript & more.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/problems"
                  className="btn btn-lg bg-gradient-to-r from-emerald-500 to-cyan-600 border-none text-white px-8 hover:shadow-xl hover:scale-105 transition-all"
                >
                  Start Practicing
                </Link>
                <Link
                  to="/contests"
                  className="btn btn-lg btn-outline border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white px-8"
                >
                  Join Contest
                </Link>
              </div>

            </div>

            {/* Hero Visual */}
            <div className="flex-1 relative">
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-2xl">
                {/* Code Editor Mockup */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-400 text-sm ml-2">solution.py</span>
                </div>
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  <code>{`def two_sum(nums, target):
    """Find two numbers that add to target"""
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
    
# Try it yourself! 🚀`}</code>
                </pre>

                {/* Run Button */}
                <button className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                  <FaBolt className="w-4 h-4" />
                  Run Code
                </button>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl blur-xl opacity-60 animate-pulse delay-700"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to{" "}
            <span className="text-emerald-600">Level Up</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <FaCode className="w-8 h-8" />,
                title: "Multi-Language Support",
                desc: "Code in C++, Java, Python, JavaScript, and 10+ languages with instant compilation.",
                color: "emerald",
              },
              {
                icon: <FaTrophy className="w-8 h-8" />,
                title: "Live Contests",
                desc: "Participate in timed contests with real-time ranking and instant results.",
                color: "amber",
              },
              {
                icon: <FaUsers className="w-8 h-8" />,
                title: "Global Leaderboard",
                desc: "Compete with coders worldwide and track your progress over time.",
                color: "cyan",
              },
              {
                icon: <FaShieldAlt className="w-8 h-8" />,
                title: "Secure Execution",
                desc: "Sandboxed code execution ensures safety and fair play for all participants.",
                color: "purple",
              },
              {
                icon: <FaGlobe className="w-8 h-8" />,
                title: "Categorized Problems",
                desc: "Filter by difficulty, tags, and companies to target your weak areas.",
                color: "pink",
              },
              {
                icon: <FaBolt className="w-8 h-8" />,
                title: "Real-Time Feedback",
                desc: "Get instant verdicts on your submissions with detailed test case results.",
                color: "blue",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="card bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="card-body">
                  <div
                    className={`w-14 h-14 rounded-xl bg-${feature.color}-100 text-${feature.color}-600 flex items-center justify-center mb-4`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="card-title text-lg font-bold">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Start Coding in 3 Steps</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Sign Up Free",
                desc: "Create your account in seconds. No credit card required.",
              },
              {
                step: "2",
                title: "Pick a Problem",
                desc: "Browse many problems filtered by difficulty and topic.",
              },
              {
                step: "3",
                title: "Code & Submit",
                desc: "Write your solution, run tests, and see instant results.",
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/signup"
              className="btn btn-lg bg-gradient-to-r from-emerald-500 to-cyan-600 border-none text-white px-10 hover:shadow-xl"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-cyan-600">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Become a Better Coder?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who practice daily and compete in weekly contests.
          </p>
          <Link
            to="/problems"
            className="btn btn-lg bg-white text-emerald-600 border-none px-10 hover:shadow-xl hover:scale-105 transition-all"
          >
            Explore Problems →
          </Link>
        </div>
      </section>
    </div>
  );
}