// // pages/ProblemDetail.jsx
// import { useState, useEffect } from "react";
// import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
// import { useSelector } from "react-redux";
// import { api } from "../utils/api";
// import CodeEditor, { LANGUAGES } from "../components/CodeEditor";
// const [submitting, setSubmitting] = useState(false);
// const [submissionResult, setSubmissionResult] = useState(null);

// export default function ProblemDetail() {
//     const { id } = useParams();
//     const navigate = useNavigate();
//     const location = useLocation();
//     const { isAuthenticated, user } = useSelector((state) => state.auth);

//     const contestId = new URLSearchParams(location.search).get("contestId");

//     const [problem, setProblem] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [running, setRunning] = useState(false);
//     const [results, setResults] = useState(null);
//     const [activeTab, setActiveTab] = useState("description");
//     const [editorState, setEditorState] = useState({ sourceCode: "", languageId: 71 });

//     useEffect(() => {
//         fetchProblem();
//     }, [id]);

//     const fetchProblem = async () => {
//         try {
//             setLoading(true);
//             const response = await api(`/problems/${id}`);
//             setProblem(response.data);
//             setError(null);
//         } catch (err) {
//             setError(err.message || "Failed to load problem");
//             if (err.message?.includes("404")) {
//                 navigate("/problems");
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleRun = async ({ sourceCode, languageId }) => {
//         if (!isAuthenticated) {
//             alert("Please login to run code");
//             navigate("/login");
//             return;
//         }

//         try {
//             setRunning(true);
//             setResults(null);

//             const response = await api("/code/run", {
//                 method: "POST",
//                 body: {
//                     problemId: id,
//                     sourceCode,
//                     languageId,
//                 },
//             });

//             setResults(response.results);
//         } catch (err) {
//             setError(err.message || "Failed to run code");
//         } finally {
//             setRunning(false);
//         }
//     };

//     const handleContestSubmit = async () => {
//         if (!contestId) {
//             alert("Submission feature coming soon!");
//             return;
//         }
//         if (!isAuthenticated) {
//             alert("Please login to submit");
//             navigate("/login");
//             return;
//         }
//         if (!editorState.sourceCode?.trim()) {
//             alert("Please write some code first!");
//             return;
//         }

//         try {
//             const res = await api(`/contests/${contestId}/submit`, {
//                 method: "POST",
//                 body: {
//                     problemId: id,
//                     code: editorState.sourceCode,
//                     languageId: editorState.languageId,
//                 },
//             });

//             window.dispatchEvent(
//                 new CustomEvent("contest:submission", { detail: { contestId } })
//             );
//             alert(`Contest Submission: ${res.status}`);
//         } catch (err) {
//             alert(err.message || "Failed to submit");
//         }
//     };

//     const handleSubmit = async () => {
//         if (!isAuthenticated) {
//             alert("Please login to submit code");
//             navigate("/login");
//             return;
//         }

//         // Get current code from editor state (you may need to lift this up from CodeEditor)
//         // For now, we'll assume sourceCode is managed in parent or passed via ref
//         // Better: Pass a ref/callback from CodeEditor to get current code
//         const currentCode = sourceCode; // ⚠️ You need to manage this state in parent
//         const currentLang = languageId; // ⚠️ Same here

//         if (!currentCode?.trim()) {
//             alert("Please write some code first!");
//             return;
//         }

//         // Optional: Require sample tests to pass first
//         if (results && !results.every(r => r.status === "Accepted")) {
//             if (!window.confirm("Some sample tests failed. Submit anyway?")) {
//                 return;
//             }
//         }

//         try {
//             setSubmitting(true);

//             const response = await api("/code/submit", {
//                 method: "POST",
//                 body: {
//                     problemId: id,
//                     sourceCode: currentCode,
//                     languageId: currentLang,
//                 },
//             });

//             // Show result modal
//             setSubmissionResult(response);

//             // Optional: Refresh problem stats after successful submission
//             if (response.verdict === "Accepted") {
//                 fetchProblem(); // Refresh to update acceptance stats
//             }

//         } catch (err) {
//             console.error("Submit error:", err);
//             alert(err.message || "Submission failed. Please try again.");
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const getDifficultyColor = (difficulty) => {
//         const colors = {
//             Easy: "text-emerald-600 bg-emerald-100 border-emerald-200",
//             Medium: "text-amber-600 bg-amber-100 border-amber-200",
//             Hard: "text-red-600 bg-red-100 border-red-200",
//         };
//         return colors[difficulty] || "text-gray-600 bg-gray-100 border-gray-200";
//     };

//     if (loading) {
//         return (
//             <div className="min-h-screen bg-gray-50 pt-20 pb-12">
//                 <div className="container mx-auto px-4">
//                     <div className="animate-pulse space-y-4">
//                         <div className="h-8 bg-gray-200 rounded w-3/4"></div>
//                         <div className="h-4 bg-gray-200 rounded w-1/2"></div>
//                         <div className="h-64 bg-gray-200 rounded"></div>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     if (error || !problem) {
//         return (
//             <div className="min-h-screen bg-gray-50 pt-20 pb-12 flex items-center justify-center">
//                 <div className="text-center">
//                     <p className="text-red-600 text-lg mb-4">{error || "Problem not found"}</p>
//                     <Link to="/problems" className="btn btn-primary">Back to Problems</Link>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-gray-50 pt-16">
//             <div className="container mx-auto px-4 py-6">
//                 {/* Breadcrumb */}
//                 <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
//                     <Link to="/problems" className="hover:text-emerald-600">Problems</Link>
//                     <span>/</span>
//                     <span className="text-gray-800">{problem.title}</span>
//                 </nav>

//                 <div className="grid lg:grid-cols-2 gap-6">
//                     {/* Problem Statement Panel */}
//                     <div className="space-y-4">
//                         {/* Header */}
//                         <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5">
//                             <div className="flex items-start justify-between gap-4">
//                                 <div>
//                                     <h1 className="text-2xl font-bold text-gray-900 mb-2">{problem.title}</h1>
//                                     <div className="flex items-center gap-3 flex-wrap">
//                                         <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getDifficultyColor(problem.difficulty)}`}>
//                                             {problem.difficulty}
//                                         </span>
//                                         <div className="flex gap-1 flex-wrap">
//                                             {problem.tags?.map((tag) => (
//                                                 <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
//                                                     {tag}
//                                                 </span>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <Link
//                                     to="/problems"
//                                     className="btn btn-sm btn-ghost text-gray-500 hover:text-gray-700"
//                                 >
//                                     ← Back
//                                 </Link>
//                             </div>
//                         </div>

//                         {/* Tabs */}
//                         <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
//                             <div className="flex border-b border-gray-200">
//                                 {["description", "testcases"].map((tab) => (
//                                     <button
//                                         key={tab}
//                                         onClick={() => setActiveTab(tab)}
//                                         className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab
//                                             ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50"
//                                             : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
//                                             }`}
//                                     >
//                                         {tab}
//                                     </button>
//                                 ))}
//                             </div>

//                             <div className="p-5">
//                                 {activeTab === "description" ? (
//                                     <div className="prose prose-sm max-w-none">
//                                         <div
//                                             className="text-gray-700 leading-relaxed whitespace-pre-wrap"
//                                             dangerouslySetInnerHTML={{ __html: problem.description }}
//                                         />

//                                         {/* Constraints Section (if present in description) */}
//                                         {problem.description?.includes("Constraints") && (
//                                             <div className="mt-6 p-4 bg-gray-50 rounded-lg">
//                                                 <h4 className="font-semibold text-gray-800 mb-2">Constraints:</h4>
//                                                 <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
//                                                     <li>Time Limit: {problem.timeLimit || 2} seconds</li>
//                                                     <li>Memory Limit: 256 MB</li>
//                                                 </ul>
//                                             </div>
//                                         )}
//                                     </div>
//                                 ) : (
//                                     /* ✅ UPDATED: Sample Test Cases Tab with Better Styling */
//                                     <div className="space-y-4">
//                                         <div className="flex items-center justify-between">
//                                             <h4 className="font-semibold text-gray-800">Sample Test Cases</h4>
//                                             <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
//                                                 {problem.sampleTestcases?.length || 0} cases
//                                             </span>
//                                         </div>

//                                         {problem.sampleTestcases?.map((tc, index) => (
//                                             <div
//                                                 key={index}
//                                                 className="p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
//                                             >
//                                                 <div className="flex items-center gap-2 mb-3">
//                                                     <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
//                                                         {index + 1}
//                                                     </span>
//                                                     <span className="text-sm font-medium text-gray-700">Test Case</span>
//                                                 </div>

//                                                 <div className="grid gap-3">
//                                                     {/* Input */}
//                                                     <div>
//                                                         <div className="flex items-center gap-2 mb-1.5">
//                                                             <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Input</span>
//                                                         </div>
//                                                         <pre className="bg-white border border-gray-200 text-gray-800 p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
//                                                             {tc.input || <span className="text-gray-400 italic">(empty)</span>}
//                                                         </pre>
//                                                     </div>

//                                                     {/* Expected Output */}
//                                                     <div>
//                                                         <div className="flex items-center gap-2 mb-1.5">
//                                                             <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expected Output</span>
//                                                         </div>
//                                                         <pre className="bg-white border border-gray-200 text-gray-800 p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
//                                                             {tc.output || <span className="text-gray-400 italic">(empty)</span>}
//                                                         </pre>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         ))}

//                                         {(!problem.sampleTestcases || problem.sampleTestcases.length === 0) && (
//                                             <div className="text-center py-8 text-gray-500">
//                                                 <p>No sample test cases available</p>
//                                             </div>
//                                         )}
//                                     </div>
//                                 )}
//                             </div>
//                         </div>

//                         {/* Submission Stats (Placeholder) */}
//                         <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5">
//                             <h4 className="font-semibold text-gray-800 mb-3">Problem Stats</h4>
//                             <div className="grid grid-cols-2 gap-4 text-sm">
//                                 <div>
//                                     <p className="text-gray-500">Acceptance Rate</p>
//                                     <p className="font-semibold text-emerald-600">—</p>
//                                 </div>
//                                 <div>
//                                     <p className="text-gray-500">Submissions</p>
//                                     <p className="font-semibold text-gray-800">—</p>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Code Editor Panel */}
//                     {/* Code Editor Panel */}
//                     <div className="lg:sticky lg:top-20 lg:self-start">
//                         <CodeEditor
//                             problemId={id}
//                             onRun={handleRun}
//                             running={running}
//                             results={results}
//                         />

//                         {/* Submit Button + Modal */}
//                         {isAuthenticated && (
//                             <>
//                                 <button
//                                     className="w-full mt-4 btn btn-lg bg-gradient-to-r from-emerald-500 to-cyan-600 border-none text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
//                                     onClick={handleSubmit}
//                                     disabled={submitting || !results?.every(r => r.status === "Accepted")}
//                                     title={!results?.every(r => r.status === "Accepted") ? "Pass all sample tests first" : ""}
//                                 >
//                                     {submitting ? (
//                                         <>
//                                             <span className="loading loading-spinner loading-sm"></span>
//                                             Submitting...
//                                         </>
//                                     ) : (
//                                         "Submit Solution"
//                                     )}
//                                 </button>

//                                 {/* Helper text */}
//                                 {!results?.every(r => r.status === "Accepted") && results?.length > 0 && (
//                                     <p className="text-xs text-center text-amber-600 mt-2">
//                                         💡 Pass all sample tests before submitting
//                                     </p>
//                                 )}

//                                 {/* Submission Result Modal */}
//                                 {submissionResult && (
//                                     <SubmissionResult
//                                         result={submissionResult}
//                                         onClose={() => setSubmissionResult(null)}
//                                         onRetry={() => {
//                                             setSubmissionResult(null);
//                                             // Optional: scroll to editor
//                                             document.querySelector('textarea')?.focus();
//                                         }}
//                                     />
//                                 )}
//                             </>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// pages/ProblemDetail.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { api } from "../utils/api";
import CodeEditor from "../components/CodeEditor";
import SubmissionResult from "../components/SubmissionResult";
import ContestProctoringOverlay from "../components/ContestProctoringOverlay";

function formatSolveCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}`;
}

export default function ProblemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const urlTab = useMemo(() => {
    const t = new URLSearchParams(location.search).get("tab");
    return typeof t === "string" ? t : "";
  }, [location.search]);

  const contestId = new URLSearchParams(location.search).get("contestId");
  const submissionsOnlyMode = !contestId && urlTab === "submissions";
  const isFullscreenEnforced =
    Boolean(contestId) &&
    new URLSearchParams(location.search).get("fs") === "1";

  const contestSolveFromNav = location.state?.contestSolve;
  const contestMetaFromNav = location.state?.contestMeta;
  const contestParticipantFromNav = location.state?.contestParticipant;
  const contestFlashFromNav = location.state?.contestFlash;

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("description");

  const showEditorPanel = Boolean(contestId) || !submissionsOnlyMode;

  const [mySubmissionsLoading, setMySubmissionsLoading] = useState(false);
  const [mySubmissionsError, setMySubmissionsError] = useState(null);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [mySubmissionStats, setMySubmissionStats] = useState(null);
  const [selectedSubmissionKey, setSelectedSubmissionKey] = useState(null);

  useEffect(() => {
    if (!urlTab) return;
    if (["description", "testcases", "submissions"].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab, id]);

  useEffect(() => {
    if (!submissionsOnlyMode) return;
    setActiveTab("submissions");
  }, [submissionsOnlyMode, id]);

  // Editor state (lifted from CodeEditor)
  const [editorCode, setEditorCode] = useState("");
  const [editorLang, setEditorLang] = useState(71);

  // Keep latest editor values available for auto-submits (timeout/fullscreen exit)
  const editorStateRef = useRef({ sourceCode: "", languageId: 71 });
  useEffect(() => {
    editorStateRef.current = { sourceCode: editorCode, languageId: editorLang };
  }, [editorCode, editorLang]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const [contestSolve, setContestSolve] = useState(null);
  const [contestSolveNowMs, setContestSolveNowMs] = useState(Date.now());
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const [contestMeta, setContestMeta] = useState(null);
  const [contestMyParticipant, setContestMyParticipant] = useState(null);
  const [contestFlash, setContestFlash] = useState(null);
  const [switchPopup, setSwitchPopup] = useState(null);
  const [isInFullscreen, setIsInFullscreen] = useState(false);
  const wasFullscreenRef = useRef(false);
  const isLeavingFullscreenEnforcementRef = useRef(false);

  const [proctorWarning, setProctorWarning] = useState(null);
  const proctorWarningOpenRef = useRef(false);
  const suppressFsAutoSubmitUntilRef = useRef(0);

  useEffect(() => {
    if (!contestId) return;

    // Flash can be passed via navigation state for instant feedback.
    if (contestFlashFromNav?.message) {
      setContestFlash(contestFlashFromNav);
      const t = setTimeout(() => setContestFlash(null), 3500);
      return () => clearTimeout(t);
    }

    // Or restored from sessionStorage after navigation.
    try {
      const raw = sessionStorage.getItem("contest:lastFlash");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.contestId && String(parsed.contestId) !== String(contestId))
        return;
      if (parsed?.message) setContestFlash(parsed);
      sessionStorage.removeItem("contest:lastFlash");
      const t = setTimeout(() => setContestFlash(null), 3500);
      return () => clearTimeout(t);
    } catch {
      // ignore
    }
  }, [contestId, contestFlashFromNav]);

  useEffect(() => {
    let cancelled = false;

    async function loadMySubmissions() {
      if (!isAuthenticated) return;
      if (activeTab !== "submissions") return;

      try {
        setMySubmissionsLoading(true);
        setMySubmissionsError(null);
        const res = await api(`/problems/${id}/my-submissions?limit=20`);
        if (cancelled) return;
        setMySubmissions(Array.isArray(res?.submissions) ? res.submissions : []);
        setMySubmissionStats(res?.stats || null);

        const first = Array.isArray(res?.submissions) ? res.submissions[0] : null;
        const key = first?._id || first?.createdAt || null;
        setSelectedSubmissionKey(key);
      } catch (e) {
        if (!cancelled) setMySubmissionsError(e?.message || "Failed to load submissions");
      } finally {
        if (!cancelled) setMySubmissionsLoading(false);
      }
    }

    loadMySubmissions();
    return () => {
      cancelled = true;
    };
  }, [activeTab, id, isAuthenticated]);

  const selectedSubmission = useMemo(() => {
    if (!selectedSubmissionKey) return null;
    return (
      (mySubmissions || []).find((s) => String(s?._id || s?.createdAt) === String(selectedSubmissionKey)) ||
      null
    );
  }, [mySubmissions, selectedSubmissionKey]);

  function langName(languageId) {
    const idNum = Number(languageId);
    if (idNum === 71) return "Python";
    if (idNum === 62) return "Java";
    if (idNum === 63) return "JavaScript";
    if (idNum === 52) return "C++";
    if (idNum === 48) return "C";
    return `Lang ${languageId}`;
  }

  function verdictClass(v) {
    if (v === "Accepted") return "text-emerald-700";
    if (v === "Wrong Answer") return "text-red-700";
    if (v === "Time Limit Exceeded") return "text-amber-700";
    if (v === "Runtime Error") return "text-orange-700";
    return "text-gray-700";
  }

  const myProblemStatsById = useMemo(() => {
    const map = new Map();
    const stats = contestMyParticipant?.problemStats;
    if (!Array.isArray(stats)) return map;
    for (const ps of stats) {
      const pid = ps?.problemId?._id || ps?.problemId;
      if (pid) map.set(String(pid), ps);
    }
    return map;
  }, [contestMyParticipant]);

  const isProblemSolved = useMemo(() => {
    const ps = myProblemStatsById.get(String(id));
    return ps?.status === "solved";
  }, [myProblemStatsById, id]);

  const currentProblemStat = useMemo(() => {
    return myProblemStatsById.get(String(id)) || null;
  }, [myProblemStatsById, id]);

  const contestProblems = useMemo(() => {
    const list = contestMeta?.problems;
    return Array.isArray(list) ? list : [];
  }, [contestMeta]);

  const otherContestProblems = useMemo(() => {
    return contestProblems.filter((p) => {
      const pid = p?.problemId?._id || p?.problemId;
      if (String(pid) === String(id)) return false;
      const ps = myProblemStatsById.get(String(pid));
      return ps?.status !== "solved";
    });
  }, [contestProblems, id, myProblemStatsById]);

  const getNextUnsolvedProblemId = () => {
    if (!contestProblems.length) return null;
    const ids = contestProblems
      .map((p) => p?.problemId?._id || p?.problemId)
      .filter(Boolean)
      .map((x) => String(x));
    const currentIdx = ids.findIndex((x) => x === String(id));
    if (currentIdx < 0) return null;

    for (let i = currentIdx + 1; i < ids.length; i += 1) {
      const ps = myProblemStatsById.get(ids[i]);
      if (ps?.status !== "solved") return ids[i];
    }

    return null;
  };

  const contestTimeLeftMs = useMemo(() => {
    if (!contestSolve?.expiresAt) return null;
    const expiresAtMs = new Date(contestSolve.expiresAt).getTime();
    if (!Number.isFinite(expiresAtMs)) return null;
    return Math.max(0, expiresAtMs - contestSolveNowMs);
  }, [contestSolve, contestSolveNowMs]);

  const isContestSolveExpired =
    contestTimeLeftMs !== null && contestTimeLeftMs <= 0;

  const isContestLive = useMemo(() => {
    if (!contestMeta?.startTime || !contestMeta?.endTime) return false;
    const now = Date.now();
    const start = new Date(contestMeta.startTime).getTime();
    const end = new Date(contestMeta.endTime).getTime();
    return now >= start && now <= end;
  }, [contestMeta]);

  const getIsInFullscreen = () =>
    Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement,
    );

  const requestFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) return await el.requestFullscreen();
      if (el.webkitRequestFullscreen) return await el.webkitRequestFullscreen();
      if (el.mozRequestFullScreen) return await el.mozRequestFullScreen();
      if (el.msRequestFullscreen) return await el.msRequestFullscreen();
    } catch {
      // ignore
    }
  };
  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) return await document.exitFullscreen();
      if (document.webkitExitFullscreen)
        return await document.webkitExitFullscreen();
      if (document.mozCancelFullScreen)
        return await document.mozCancelFullScreen();
      if (document.msExitFullscreen) return await document.msExitFullscreen();
    } catch {
      // ignore
    }
  };

  const logFullscreenViolation = async () => {
    if (!contestId) return;
    if (!isContestLive) return;
    try {
      await api(`/contests/${contestId}/violation`, {
        method: "POST",
        body: { type: "fullscreen_exit", problemId: id },
      });
    } catch {
      // ignore logging errors
    }
  };

  const openSwitchPopup = (p) => {
    const problemId = p?.problemId?._id || p?.problemId;
    if (!problemId) return;
    if (String(problemId) === String(id)) return;
    setSwitchPopup({
      problemId,
      title: p?.problemId?.title || "Problem",
    });
  };

  const confirmSwitchSolve = async () => {
    if (!contestId || !switchPopup?.problemId) return;

    // Ensure fullscreen when in contest enforced mode.
    if (isFullscreenEnforced && !getIsInFullscreen()) {
      alert(
        "Fullscreen is required to start solving. Please allow fullscreen and try again.",
      );
      return;
    }

    navigate(`/problems/${switchPopup.problemId}?contestId=${contestId}&fs=1`, {
      // Let the destination page start the timer; this avoids an extra request
      // and makes switching feel snappier.
      state: {
        contestSolve: null,
        contestMeta,
        contestParticipant: contestMyParticipant,
      },
    });
    setSwitchPopup(null);
  };

  useEffect(() => {
    fetchProblem();
  }, [id]);

  // If opened from a contest, start the per-problem 60-min solve timer.
  useEffect(() => {
    if (!contestId) return;

    let isMounted = true;
    let timeoutId;
    const start = async () => {
      if (!isAuthenticated) return;

      // If fullscreen is enforced, don't start the timer unless we are actually in fullscreen.
      // If fullscreen was blocked/denied, return to contest dashboard without starting.
      if (isFullscreenEnforced && !getIsInFullscreen()) {
        await new Promise((resolve) => {
          const onFs = () => {
            if (getIsInFullscreen()) {
              document.removeEventListener("fullscreenchange", onFs);
              document.removeEventListener("webkitfullscreenchange", onFs);
              document.removeEventListener("mozfullscreenchange", onFs);
              document.removeEventListener("MSFullscreenChange", onFs);
              resolve();
            }
          };

          document.addEventListener("fullscreenchange", onFs);
          document.addEventListener("webkitfullscreenchange", onFs);
          document.addEventListener("mozfullscreenchange", onFs);
          document.addEventListener("MSFullscreenChange", onFs);

          timeoutId = setTimeout(() => {
            document.removeEventListener("fullscreenchange", onFs);
            document.removeEventListener("webkitfullscreenchange", onFs);
            document.removeEventListener("mozfullscreenchange", onFs);
            document.removeEventListener("MSFullscreenChange", onFs);
            resolve();
          }, 1500);
        });

        if (!getIsInFullscreen()) {
          alert(
            "Fullscreen is required to start solving. Please click Start Solving again and allow fullscreen.",
          );
          navigate(`/contests/${contestId}`);
          return;
        }
      }

      try {
        let contest = contestMetaFromNav;
        if (!contest) {
          const contestRes = await api(`/contests/${contestId}`);
          contest = contestRes?.data;
        }

        setContestMeta(contest);
        if (contestParticipantFromNav) {
          setContestMyParticipant(contestParticipantFromNav);
        } else {
          // Seed user's score panel from contest payload.
          const meId = user?._id ? String(user._id) : null;
          const me = meId
            ? (contest?.participants || []).find((p) => {
                const pid = p?.userId?._id || p?.userId;
                return pid ? String(pid) === meId : false;
              })
            : null;
          setContestMyParticipant(me || null);
        }

        if (!contest?.isRegistered) {
          alert("You are not registered for this contest");
          navigate("/contests");
          return;
        }

        // Timer should start when user clicks Start Solving. If we were navigated here
        // from that click, reuse the server response. If the page is refreshed, fall
        // back to calling start-problem (it won't reset startedAt once set).
        if (!isMounted) return;
        if (contestSolveFromNav?.startedAt && contestSolveFromNav?.expiresAt) {
          setContestSolve(contestSolveFromNav);
        } else {
          const startRes = await api(`/contests/${contestId}/start-problem`, {
            method: "POST",
            body: { problemId: id },
          });
          if (!isMounted) return;
          setContestSolve(startRes?.data);
        }
      } catch (err) {
        alert(err.message || "Failed to start contest timer");
        navigate("/contests");
      }
    };

    start();
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    contestId,
    id,
    isAuthenticated,
    navigate,
    isFullscreenEnforced,
    contestSolveFromNav,
  ]);

  // Fullscreen enforcement + anti-escape monitoring
  useEffect(() => {
    if (!isFullscreenEnforced) return;

    const update = async () => {
      if (isLeavingFullscreenEnforcementRef.current) return;

      const inFs = getIsInFullscreen();
      document.body.classList.toggle("contest-fullscreen", inFs);
      setIsInFullscreen(inFs);

      // Only auto-submit after the solve timer has started.
      const expiresAtMs = contestSolve?.expiresAt
        ? new Date(contestSolve.expiresAt).getTime()
        : NaN;
      const hasValidSolveTimer = Number.isFinite(expiresAtMs);
      if (wasFullscreenRef.current && !inFs && hasValidSolveTimer) {
        // If we are inside a proctor warning flow, don't treat this as an escape.
        if (Date.now() < Number(suppressFsAutoSubmitUntilRef.current || 0)) {
          requestFullscreen();
          wasFullscreenRef.current = inFs;
          return;
        }

        // Exited fullscreen (ESC/browser UI). Auto-submit and go back to leaderboard.
        await logFullscreenViolation();
        if (!autoSubmitted) {
          await autoSubmitDueToFullscreen();
        }
      }

      wasFullscreenRef.current = inFs;
    };

    // init
    update();

    const onFsChange = () => {
      // fire and forget
      update();
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    document.addEventListener("mozfullscreenchange", onFsChange);
    document.addEventListener("MSFullscreenChange", onFsChange);

    return () => {
      document.body.classList.remove("contest-fullscreen");
      setIsInFullscreen(false);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("mozfullscreenchange", onFsChange);
      document.removeEventListener("MSFullscreenChange", onFsChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isFullscreenEnforced,
    contestId,
    isContestLive,
    id,
    autoSubmitted,
    contestSolve?.expiresAt,
  ]);

  const autoSubmitDueToFullscreen = async () => {
    if (!contestId) return;
    try {
      setAutoSubmitted(true);
      await handleContestSubmit({ isAuto: true });
      navigate(`/contests/${contestId}#leaderboard`, { replace: true });
    } catch {
      // ignore
    }
  };

  const proctorStrikeCountRef = useRef(0);
  const proctorAutoEndedRef = useRef(false);
  const autoSubmitDueToProctoringRef = useRef(null);

  const autoSubmitDueToProctoring = async () => {
    if (!contestId) return;
    if (proctorAutoEndedRef.current) return;
    proctorAutoEndedRef.current = true;

    try {
      setAutoSubmitted(true);
      await handleContestSubmit({ isAuto: true });
    } catch {
      // ignore
    }

    isLeavingFullscreenEnforcementRef.current = true;
    try {
      try {
        window.dispatchEvent(
          new CustomEvent("contest:proctor-stop", {
            detail: { contestId, problemId: id },
          }),
        );
      } catch {
        // ignore
      }

      if (isFullscreenEnforced) await exitFullscreen();
    } finally {
      document.body.classList.remove("contest-fullscreen");
      setIsInFullscreen(false);
      navigate(`/contests/${contestId}#leaderboard`, { replace: true });
    }
  };

  autoSubmitDueToProctoringRef.current = autoSubmitDueToProctoring;

  // Proctoring: warn on "moved away" and auto-submit after 3 warnings.
  useEffect(() => {
    if (!contestId) return;

    // Reset strikes on contest problem entry so fullscreen only exits after 3 fresh violations.
    proctorStrikeCountRef.current = 0;
    proctorAutoEndedRef.current = false;
    proctorWarningOpenRef.current = false;
    setProctorWarning(null);

    const onViolation = (e) => {
      const incomingContestId = e?.detail?.contestId;
      const type = e?.detail?.type;
      if (!incomingContestId || incomingContestId !== contestId) return;

      // Only treat "moved away" as strikes (head moved away from center).
      if (type !== "FACE_NOT_CENTERED") return;

      // Don't stack multiple popups at once.
      if (proctorWarningOpenRef.current) return;

      const next = (proctorStrikeCountRef.current || 0) + 1;
      proctorStrikeCountRef.current = next;

      if (next < 3) {
        // While the popup is up (and shortly after OK), ignore fullscreen-exit auto-submit.
        suppressFsAutoSubmitUntilRef.current = Date.now() + 15000;
        proctorWarningOpenRef.current = true;
        setProctorWarning({
          strike: next,
          message: `Warning ${next}/3: Keep your face centered on the screen. After 3 warnings, the test will be auto-submitted.`,
        });
        return;
      }

      if (next >= 3) {
        // fire and forget
        autoSubmitDueToProctoringRef.current?.();
      }
    };

    window.addEventListener("contest:proctor-violation", onViolation);
    return () =>
      window.removeEventListener("contest:proctor-violation", onViolation);
  }, [contestId]);

  const acknowledgeProctorWarning = async () => {
    proctorWarningOpenRef.current = false;
    setProctorWarning(null);

    if (isFullscreenEnforced) {
      suppressFsAutoSubmitUntilRef.current = Date.now() + 4000;
      // OK click is a user gesture, so fullscreen should be allowed.
      await requestFullscreen();
    }
  };

  const handleExitFullscreenClick = async () => {
    if (!contestId) {
      await exitFullscreen();
      return;
    }

    const ok = window.confirm(
      "Exit fullscreen? Your code will be auto-submitted and you will be taken to the contest leaderboard.",
    );
    if (!ok) return;

    isLeavingFullscreenEnforcementRef.current = true;
    try {
      setAutoSubmitted(true);
      await handleContestSubmit({ isAuto: true });
      await exitFullscreen();
    } finally {
      document.body.classList.remove("contest-fullscreen");
      setIsInFullscreen(false);
      navigate(`/contests/${contestId}#leaderboard`, { replace: true });
    }
  };

  // Tick contest solve countdown
  useEffect(() => {
    if (!contestId) return;
    const t = setInterval(() => setContestSolveNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [contestId]);

  const fetchProblem = async () => {
    try {
      setLoading(true);
      const response = await api(`/problems/${id}`);
      setProblem(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load problem");
      if (err.message?.includes("404")) {
        navigate("/problems");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async ({ sourceCode, languageId }) => {
    if (!isAuthenticated) {
      alert("Please login to run code");
      navigate("/login");
      return;
    }

    try {
      setRunning(true);
      setResults(null);

      const response = await api("/code/run", {
        method: "POST",
        body: {
          problemId: id,
          sourceCode,
          languageId,
        },
      });

      setResults(response.results);
    } catch (err) {
      setError(err.message || "Failed to run code");
    } finally {
      setRunning(false);
    }
  };

  const handleContestSubmit = async ({ isAuto = false } = {}) => {
    if (!contestId) {
      alert("Submission feature coming soon!");
      return;
    }
    if (!isAuthenticated) {
      alert("Please login to submit");
      navigate("/login");
      return;
    }
    if (!isAuto && isContestSolveExpired) {
      alert("Time is over for this problem");
      return;
    }

    const { sourceCode, languageId } = editorStateRef.current || {};
    const trimmed = (sourceCode || "").trim();

    if (!isAuto && !trimmed) {
      alert("Please write some code first!");
      return;
    }

    const codeToSend = trimmed ? sourceCode : " ";
    let languageIdNum = Number(languageId || editorLang || 71);
    if (!Number.isFinite(languageIdNum) || languageIdNum <= 0)
      languageIdNum = 71;

    try {
      setSubmitting(true);
      const res = await api(`/contests/${contestId}/submit`, {
        method: "POST",
        body: {
          problemId: id,
          code: codeToSend,
          languageId: languageIdNum,
        },
      });

      if (res?.participant) setContestMyParticipant(res.participant);

      window.dispatchEvent(
        new CustomEvent("contest:submission", { detail: { contestId } }),
      );

      if (!isAuto) {
        const earned = Number.isFinite(res?.earnedScore) ? res.earnedScore : 0;
        const status = res?.status || res?.message || "Recorded";
        setContestFlash({
          type: res?.status === "Accepted" ? "success" : "info",
          message:
            earned > 0
              ? `${status} (+${earned})`
              : String(status || "Recorded"),
        });
      }

      // Stop camera + detection once a contest submission completes.
      try {
        window.dispatchEvent(
          new CustomEvent("contest:proctor-stop", {
            detail: { contestId, problemId: id },
          }),
        );
      } catch {
        // ignore
      }

      return res;
    } catch (err) {
      if (!isAuto) {
        setContestFlash({
          type: "error",
          message: err?.message || "Failed to submit",
        });
      }
      if (isAuto)
        console.warn("Auto contest submit failed:", err?.message || err);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleContestSubmitAndAdvance = async () => {
    const res = await handleContestSubmit({ isAuto: false });
    if (!res) return;

    const nextProblemId = getNextUnsolvedProblemId();
    const earned = Number.isFinite(res?.earnedScore) ? res.earnedScore : 0;
    const baseMsg = res?.status || res?.message || "Recorded";
    const nextFlash = {
      contestId,
      type: res?.status === "Accepted" ? "success" : "info",
      message: earned > 0 ? `${baseMsg} (+${earned})` : String(baseMsg),
    };

    try {
      sessionStorage.setItem("contest:lastFlash", JSON.stringify(nextFlash));
    } catch {
      // ignore
    }

    if (!nextProblemId) {
      navigate(`/contests/${contestId}#leaderboard`, { replace: true });
      return;
    }

    navigate(`/problems/${nextProblemId}?contestId=${contestId}&fs=1`, {
      // Let the destination page start the timer; avoids an extra request.
      state: {
        contestSolve: null,
        contestMeta,
        contestParticipant: res?.participant || contestMyParticipant,
        contestFlash: nextFlash,
      },
    });
  };

  const handleSubmitContestClick = async () => {
    if (!contestId) return;
    const ok = window.confirm(
      "Submit contest and end the test? You will be taken to the leaderboard.",
    );
    if (!ok) return;

    try {
      window.dispatchEvent(
        new CustomEvent("contest:proctor-stop", {
          detail: { contestId, problemId: id },
        }),
      );
    } catch {
      // ignore
    }

    isLeavingFullscreenEnforcementRef.current = true;
    try {
      if (isFullscreenEnforced) await exitFullscreen();
    } finally {
      document.body.classList.remove("contest-fullscreen");
      setIsInFullscreen(false);
      navigate(`/contests/${contestId}#leaderboard`, { replace: true });
    }
  };

  // Auto-submit at expiry (best-effort; requires the user to keep the page open)
  useEffect(() => {
    if (!contestId) return;
    if (!contestSolve?.expiresAt) return;
    if (autoSubmitted) return;

    const expiresAtMs = new Date(contestSolve.expiresAt).getTime();
    if (!Number.isFinite(expiresAtMs)) {
      console.warn(
        "Invalid contestSolve.expiresAt; skipping auto-submit",
        contestSolve?.expiresAt,
      );
      return;
    }
    const rawDelayMs = expiresAtMs - Date.now();
    if (rawDelayMs <= 0) {
      // If the timer is already expired (stale nav state / resumed session),
      // avoid firing an immediate submit request that the server will reject.
      console.warn(
        "Contest solve window already expired; skipping auto-submit",
      );
      setAutoSubmitted(true);
      alert("Time is over for this problem");
      navigate(`/contests/${contestId}#leaderboard`, { replace: true });
      return;
    }

    const t = setTimeout(async () => {
      try {
        setAutoSubmitted(true);
        await handleContestSubmit({ isAuto: true });
        navigate(`/contests/${contestId}#leaderboard`, { replace: true });
      } catch {
        // ignore
      }
    }, rawDelayMs);

    return () => clearTimeout(t);
  }, [contestId, contestSolve, autoSubmitted]);
  const handleSubmit = async () => {
    if (!isAuthenticated) {
      alert("Please login to submit code");
      navigate("/login");
      return;
    }

    if (!editorCode?.trim()) {
      alert("Please write some code first!");
      return;
    }

    // Optional: Warn if sample tests haven't all passed
    if (results && !results.every((r) => r.status === "Accepted")) {
      if (!window.confirm("Some sample tests failed. Submit anyway?")) {
        return;
      }
    }

    try {
      setSubmitting(true);

      const response = await api("/code/submit", {
        method: "POST",
        body: {
          problemId: id,
          sourceCode: editorCode,
          languageId: editorLang,
        },
      });

      // Show result modal
      setSubmissionResult(response);

      // Refresh problem stats after successful submission
      if (response.verdict === "Accepted") {
        fetchProblem();
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      Easy: "text-emerald-600 bg-emerald-100 border-emerald-200",
      Medium: "text-amber-600 bg-amber-100 border-amber-200",
      Hard: "text-red-600 bg-red-100 border-red-200",
    };
    return colors[difficulty] || "text-gray-600 bg-gray-100 border-gray-200";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">
            {error || "Problem not found"}
          </p>
          <Link to="/problems" className="btn btn-primary">
            Back to Problems
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isFullscreenEnforced
          ? isInFullscreen
            ? "h-screen w-screen bg-gray-50"
            : "min-h-screen bg-gray-50 pt-16"
          : "min-h-screen bg-gray-50 pt-16"
      }
    >
      <div
        className={
          isFullscreenEnforced
            ? "h-full w-full px-4 py-4"
            : "container mx-auto px-4 py-6"
        }
      >
        {proctorWarning && contestId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="text-xs text-gray-500">Proctoring warning</div>
              <div className="mt-1 text-lg font-bold text-gray-900">
                Warning {proctorWarning.strike}/3
              </div>
              <div className="mt-3 text-sm text-gray-700">
                {proctorWarning.message}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  className="btn bg-emerald-600 hover:bg-emerald-700 border-none text-white"
                  onClick={acknowledgeProctorWarning}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {switchPopup ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">Before you start</div>
                  <div className="text-lg font-bold text-gray-900 truncate">
                    {switchPopup.title}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost text-gray-500"
                  onClick={() => setSwitchPopup(null)}
                >
                  Close
                </button>
              </div>

              <div className="text-sm text-gray-700 space-y-2">
                <div className="font-semibold text-gray-900">Rules</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You have to sit for the test continuously.</li>
                  <li>Fullscreen is required while solving.</li>
                  <li>You have 60 minutes once you start solving.</li>
                </ul>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSwitchPopup(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmSwitchSolve}
                >
                  Solve
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isFullscreenEnforced && isInFullscreen ? (
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-xs text-gray-600">
              {contestMeta?.title ? (
                <span className="font-medium text-gray-900">
                  {contestMeta.title}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleExitFullscreenClick}
              title="Exit fullscreen"
            >
              Exit Fullscreen
            </button>
          </div>
        ) : null}
        {/* Breadcrumb */}
        {!isFullscreenEnforced && !submissionsOnlyMode ? (
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            {contestId ? (
              <>
                <Link to="/contests" className="hover:text-emerald-600">
                  Contests
                </Link>
                <span>/</span>
                <Link
                  to={`/contests/${contestId}`}
                  className="hover:text-emerald-600"
                >
                  {contestMeta?.title || "Contest"}
                </Link>
                <span>/</span>
                <span className="text-gray-800">{problem.title}</span>
              </>
            ) : (
              <>
                <Link to="/problems" className="hover:text-emerald-600">
                  Problems
                </Link>
                <span>/</span>
                <span className="text-gray-800">{problem.title}</span>
              </>
            )}
          </nav>
        ) : null}

        <div
          className={
            contestId
              ? isFullscreenEnforced
                ? "grid lg:grid-cols-[280px_1fr_1fr] gap-4 h-full"
                : "grid lg:grid-cols-[280px_1fr_1fr] gap-6"
              : isFullscreenEnforced
                ? showEditorPanel
                  ? "grid lg:grid-cols-2 gap-4 h-full"
                  : "grid grid-cols-1 gap-4 h-full"
                : showEditorPanel
                  ? "grid lg:grid-cols-2 gap-6"
                  : "grid grid-cols-1 gap-6"
          }
        >
          {/* Contest Questions Sidebar */}
          {contestId ? (
            <div className={isFullscreenEnforced ? "h-full overflow-auto" : ""}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-500">
                      Contest Questions
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      Remaining
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {otherContestProblems.length}
                  </div>
                </div>

                {otherContestProblems.length === 0 ? (
                  <div className="text-sm text-gray-600">
                    No other questions.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {otherContestProblems.map((p) => {
                      const pid = p?.problemId?._id || p?.problemId;
                      return (
                        <button
                          key={pid}
                          type="button"
                          onClick={() => openSwitchPopup(p)}
                          className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors"
                        >
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {p?.problemId?.title || "Problem"}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Points: {p?.pointValue ?? 0}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">My Score</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {user
                        ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                          "You"
                        : "You"}
                    </div>
                    <div className="text-lg font-bold text-emerald-700">
                      {contestMyParticipant?.totalScore ?? 0}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Penalty: {contestMyParticipant?.totalPenaltyTime ?? 0}
                  </div>
                </div>

                <div className="mt-4">
                  <Link
                    to={`/contests/${contestId}`}
                    className="btn btn-sm btn-outline w-full"
                    title="Back to contest dashboard"
                  >
                    Contest Dashboard
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          {/* Problem Statement Panel */}
          <div
            className={
              isFullscreenEnforced
                ? "space-y-4 h-full overflow-auto"
                : "space-y-4"
            }
          >
            {submissionsOnlyMode ? null : (
              /* Header */
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {problem.title}
                    </h1>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold border ${getDifficultyColor(problem.difficulty)}`}
                      >
                        {problem.difficulty}
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {problem.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={contestId ? `/contests/${contestId}` : "/problems"}
                    className="btn btn-sm btn-ghost text-gray-500 hover:text-gray-700"
                  >
                    ← Back
                  </Link>
                </div>
              </div>
            )}

            {submissionsOnlyMode ? null : (
              <>
                {/* Tabs / Content */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="flex border-b border-gray-200">
                    {["description", "testcases", "submissions"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                          activeTab === tab
                            ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50"
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="p-5">
                    {activeTab === "description" ? (
                  <div className="prose prose-sm max-w-none">
                    <div
                      className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: problem.description }}
                    />
                    {problem.description?.includes("Constraints") && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Constraints:
                        </h4>
                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                          <li>Time Limit: {problem.timeLimit || 2} seconds</li>
                          <li>Memory Limit: 256 MB</li>
                        </ul>
                      </div>
                    )}
                  </div>
                    ) : activeTab === "testcases" ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800">
                        Sample Test Cases
                      </h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {problem.sampleTestcases?.length || 0} cases
                      </span>
                    </div>

                    {problem.sampleTestcases?.map((tc, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            Test Case
                          </span>
                        </div>

                        <div className="grid gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Input
                              </span>
                            </div>
                            <pre className="bg-white border border-gray-200 text-gray-800 p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                              {tc.input || (
                                <span className="text-gray-400 italic">
                                  (empty)
                                </span>
                              )}
                            </pre>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Expected Output
                              </span>
                            </div>
                            <pre className="bg-white border border-gray-200 text-gray-800 p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                              {tc.output || (
                                <span className="text-gray-400 italic">
                                  (empty)
                                </span>
                              )}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(!problem.sampleTestcases ||
                      problem.sampleTestcases.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No sample test cases available</p>
                      </div>
                    )}
                  </div>
                    ) : (
                  <div className="space-y-4">
                    {!isAuthenticated ? (
                      <div className="text-sm text-gray-600">
                        Please <Link to="/login" className="text-emerald-700 font-semibold">login</Link> to view your submissions.
                      </div>
                    ) : mySubmissionsLoading ? (
                      <div className="text-sm text-gray-600">Loading submissions...</div>
                    ) : mySubmissionsError ? (
                      <div className="text-sm text-red-600">{mySubmissionsError}</div>
                    ) : (mySubmissions || []).length === 0 ? (
                      <div className="text-sm text-gray-600">No submissions yet for this problem.</div>
                    ) : (
                      <>
                        <div className="grid sm:grid-cols-3 gap-3">
                          <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                            <div className="text-xs text-gray-500">Total submissions</div>
                            <div className="text-lg font-bold text-gray-900">
                              {mySubmissionStats?.totalSubmissions ?? mySubmissions.length}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                            <div className="text-xs text-gray-500">Accepted</div>
                            <div className="text-lg font-bold text-emerald-700">
                              {mySubmissionStats?.acceptedSubmissions ?? 0}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                            <div className="text-xs text-gray-500">Acceptance rate</div>
                            <div className="text-lg font-bold text-gray-900">
                              {mySubmissionStats?.acceptanceRate ?? 0}%
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-gray-700">My submissions</div>
                          <div className="space-y-2">
                            {(mySubmissions || []).map((s) => {
                              const key = String(s?._id || s?.createdAt);
                              const isSelected = String(selectedSubmissionKey) === key;
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => setSelectedSubmissionKey(key)}
                                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                                    isSelected
                                      ? "border-emerald-300 bg-emerald-50/40"
                                      : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/20"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className={`text-sm font-semibold ${verdictClass(s?.verdict)}`}>
                                      {s?.verdict || "—"}
                                    </div>
                                    <div className="text-xs text-gray-500 whitespace-nowrap">
                                      {s?.createdAt ? new Date(s.createdAt).toLocaleString() : ""}
                                    </div>
                                  </div>
                                  <div className="mt-1 flex items-center justify-between gap-3 text-xs text-gray-600">
                                    <div className="truncate">{langName(s?.languageId)}</div>
                                    <div className="whitespace-nowrap">
                                      {typeof s?.passedTestcases === "number" && typeof s?.totalTestcases === "number"
                                        ? `${s.passedTestcases}/${s.totalTestcases} tests`
                                        : ""}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-gray-700">Submitted code</div>
                          <pre className="bg-white border border-gray-200 text-gray-800 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                            {selectedSubmission?.sourceCode || ""}
                          </pre>
                        </div>
                      </>
                    )}
                  </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {submissionsOnlyMode ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5">
                <div className="text-sm font-semibold text-gray-800 mb-3">
                  Submissions
                </div>
                <div className="space-y-4">
                  {!isAuthenticated ? (
                    <div className="text-sm text-gray-600">
                      Please{" "}
                      <Link to="/login" className="text-emerald-700 font-semibold">
                        login
                      </Link>{" "}
                      to view your submissions.
                    </div>
                  ) : mySubmissionsLoading ? (
                    <div className="text-sm text-gray-600">Loading submissions...</div>
                  ) : mySubmissionsError ? (
                    <div className="text-sm text-red-600">{mySubmissionsError}</div>
                  ) : (mySubmissions || []).length === 0 ? (
                    <div className="text-sm text-gray-600">
                      No submissions yet for this problem.
                    </div>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                          <div className="text-xs text-gray-500">Total submissions</div>
                          <div className="text-lg font-bold text-gray-900">
                            {mySubmissionStats?.totalSubmissions ?? mySubmissions.length}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                          <div className="text-xs text-gray-500">Accepted</div>
                          <div className="text-lg font-bold text-emerald-700">
                            {mySubmissionStats?.acceptedSubmissions ?? 0}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                          <div className="text-xs text-gray-500">Acceptance rate</div>
                          <div className="text-lg font-bold text-gray-900">
                            {mySubmissionStats?.acceptanceRate ?? 0}%
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-700">My submissions</div>
                        <div className="space-y-2">
                          {(mySubmissions || []).map((s) => {
                            const key = String(s?._id || s?.createdAt);
                            const isSelected = String(selectedSubmissionKey) === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setSelectedSubmissionKey(key)}
                                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                                  isSelected
                                    ? "border-emerald-300 bg-emerald-50/40"
                                    : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/20"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className={`text-sm font-semibold ${verdictClass(s?.verdict)}`}>
                                    {s?.verdict || "—"}
                                  </div>
                                  <div className="text-xs text-gray-500 whitespace-nowrap">
                                    {s?.createdAt ? new Date(s.createdAt).toLocaleString() : ""}
                                  </div>
                                </div>
                                <div className="mt-1 flex items-center justify-between gap-3 text-xs text-gray-600">
                                  <div className="truncate">{langName(s?.languageId)}</div>
                                  <div className="whitespace-nowrap">
                                    {typeof s?.passedTestcases === "number" && typeof s?.totalTestcases === "number"
                                      ? `${s.passedTestcases}/${s.totalTestcases} tests`
                                      : ""}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-700">Submitted code</div>
                        <pre className="bg-white border border-gray-200 text-gray-800 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                          {selectedSubmission?.sourceCode || ""}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {/* Removed Problem Stats card */}
          </div>

          {/* Code Editor Panel */}
          {showEditorPanel ? (
            <div
              className={
                isFullscreenEnforced
                  ? "h-full overflow-auto"
                  : "lg:sticky lg:top-20 lg:self-start"
              }
            >
              <div className="relative">
                <CodeEditor
                  problemId={id}
                  onRun={handleRun}
                  running={running}
                  results={results}
                  onChange={({ sourceCode, languageId }) => {
                    setEditorCode(sourceCode);
                    setEditorLang(languageId);
                  }}
                  onClearResults={() => setResults(null)}
                />

                {contestId ? (
                  <ContestProctoringOverlay
                    contestId={contestId}
                    problemId={id}
                    enabled={true}
                  />
                ) : null}
              </div>

            {contestId && contestSolve?.expiresAt ? (
              <div className="mt-4 bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">
                      Contest Problem Timer
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      Time left
                    </div>
                  </div>
                  <div className="font-mono text-2xl font-bold text-emerald-600">
                    {formatSolveCountdown(contestTimeLeftMs ?? 0)}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <div className="text-gray-500">This question</div>
                  <div
                    className={
                      isProblemSolved
                        ? "font-semibold text-emerald-700"
                        : "font-semibold text-gray-700"
                    }
                  >
                    {isProblemSolved
                      ? "Solved"
                      : currentProblemStat?.status
                        ? String(currentProblemStat.status)
                        : "Not solved"}
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <div className="text-gray-500">Wrong attempts</div>
                  <div className="font-semibold text-gray-700">
                    {currentProblemStat?.wrongAttempts ?? 0}
                  </div>
                </div>
                {isContestSolveExpired ? (
                  <div className="mt-2 text-xs text-red-600">
                    Time is over — submitting is disabled.
                  </div>
                ) : null}

                {contestFlash?.message ? (
                  <div
                    className={
                      contestFlash.type === "error"
                        ? "mt-2 text-xs text-red-600"
                        : contestFlash.type === "success"
                          ? "mt-2 text-xs text-emerald-700"
                          : "mt-2 text-xs text-gray-700"
                    }
                  >
                    {contestFlash.message}
                  </div>
                ) : null}
              </div>
            ) : null}

            {isAuthenticated && contestId ? (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  className="btn btn-lg w-full bg-linear-to-r from-emerald-500 to-cyan-600 border-none text-white disabled:opacity-50"
                  onClick={handleContestSubmitAndAdvance}
                  disabled={isContestSolveExpired || submitting}
                  title="Submit this question and move to the next one"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>

                <button
                  type="button"
                  className="btn btn-lg btn-outline border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                  onClick={handleSubmitContestClick}
                  title="End the test and go to leaderboard"
                >
                  Submit Contest
                </button>
              </div>
            ) : null}

            {/* Submit Button + Modal */}
            {isAuthenticated && !contestId && (
              <>
                <button
                  className="w-full mt-4 btn btn-lg bg-linear-to-r from-emerald-500 to-cyan-600 border-none text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Submitting...
                    </>
                  ) : (
                    "Submit Solution"
                  )}
                </button>

                {/* Helper text */}
                {!results?.every((r) => r.status === "Accepted") &&
                  results?.length > 0 && (
                    <p className="text-xs text-center text-amber-600 mt-2">
                      💡 Pass all sample tests before submitting
                    </p>
                  )}

                {/* Submission Result Modal */}
                {submissionResult && (
                  <SubmissionResult
                    result={submissionResult}
                    sourceCode={editorCode}
                    languageId={editorLang}
                    onClose={() => setSubmissionResult(null)}
                    onRetry={() => {
                      setSubmissionResult(null);
                      document.querySelector("textarea")?.focus();
                    }}
                  />
                )}
              </>
            )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
