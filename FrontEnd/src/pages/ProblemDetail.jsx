// pages/ProblemDetail.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { api } from "../utils/api";
import CodeEditor, { LANGUAGES } from "../components/CodeEditor";

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

    const contestId = new URLSearchParams(location.search).get("contestId");
    const isFullscreenEnforced = Boolean(contestId) && new URLSearchParams(location.search).get("fs") === "1";

    const contestSolveFromNav = location.state?.contestSolve;

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState("description");
    const [editorState, setEditorState] = useState({ sourceCode: "", languageId: 71 });

    const editorStateRef = useRef(editorState);
    useEffect(() => {
        editorStateRef.current = editorState;
    }, [editorState]);

    const [contestSolve, setContestSolve] = useState(null);
    const [contestSolveNowMs, setContestSolveNowMs] = useState(Date.now());
    const [autoSubmitted, setAutoSubmitted] = useState(false);

    const [contestMeta, setContestMeta] = useState(null);
    const [isInFullscreen, setIsInFullscreen] = useState(false);
    const wasFullscreenRef = useRef(false);
    const isLeavingFullscreenEnforcementRef = useRef(false);

    const contestTimeLeftMs = useMemo(() => {
        if (!contestSolve?.expiresAt) return null;
        const expiresAtMs = new Date(contestSolve.expiresAt).getTime();
        return Math.max(0, expiresAtMs - contestSolveNowMs);
    }, [contestSolve, contestSolveNowMs]);

    const isContestSolveExpired = contestTimeLeftMs !== null && contestTimeLeftMs <= 0;

    const isContestLive = useMemo(() => {
        if (!contestMeta?.startTime || !contestMeta?.endTime) return false;
        const now = Date.now();
        const start = new Date(contestMeta.startTime).getTime();
        const end = new Date(contestMeta.endTime).getTime();
        return now >= start && now <= end;
    }, [contestMeta]);

    const getIsInFullscreen = () => Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    );

    const exitFullscreen = async () => {
        try {
            if (document.exitFullscreen) return await document.exitFullscreen();
            if (document.webkitExitFullscreen) return await document.webkitExitFullscreen();
            if (document.mozCancelFullScreen) return await document.mozCancelFullScreen();
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
                    alert("Fullscreen is required to start solving. Please click Start Solving again and allow fullscreen.");
                    navigate(`/contests/${contestId}`);
                    return;
                }
            }

            try {
                const contestRes = await api(`/contests/${contestId}`);
                const contest = contestRes?.data;
                setContestMeta(contest);
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
    }, [contestId, id, isAuthenticated, navigate, isFullscreenEnforced, contestSolveFromNav]);

    // Fullscreen enforcement + anti-escape monitoring
    useEffect(() => {
        if (!isFullscreenEnforced) return;

        const update = async () => {
            if (isLeavingFullscreenEnforcementRef.current) return;

            const inFs = getIsInFullscreen();
            document.body.classList.toggle("contest-fullscreen", inFs);
            setIsInFullscreen(inFs);

            if (wasFullscreenRef.current && !inFs) {
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
    }, [isFullscreenEnforced, contestId, isContestLive, id, autoSubmitted]);

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

    const handleExitFullscreenClick = async () => {
        if (!contestId) {
            await exitFullscreen();
            return;
        }

        const ok = window.confirm(
            "Exit fullscreen? Your code will be auto-submitted and you will be taken to the contest leaderboard."
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

        const currentEditorState = isAuto ? editorStateRef.current : editorState;

        const codeToSend = currentEditorState.sourceCode?.trim()
            ? currentEditorState.sourceCode
            : " ";

        if (!isAuto && !currentEditorState.sourceCode?.trim()) {
            alert("Please write some code first!");
            return;
        }

        try {
            const res = await api(`/contests/${contestId}/submit`, {
                method: "POST",
                body: {
                    problemId: id,
                    code: codeToSend,
                    languageId: currentEditorState.languageId,
                },
            });

            window.dispatchEvent(
                new CustomEvent("contest:submission", { detail: { contestId } })
            );
            if (!isAuto) alert(`Contest Submission: ${res.status}`);
        } catch (err) {
            if (!isAuto) alert(err.message || "Failed to submit");
        }
    };

    // Auto-submit at expiry (best-effort; requires the user to keep the page open)
    useEffect(() => {
        if (!contestId) return;
        if (!contestSolve?.expiresAt) return;
        if (autoSubmitted) return;

        const expiresAtMs = new Date(contestSolve.expiresAt).getTime();
        const delayMs = Math.max(0, expiresAtMs - Date.now());

        const t = setTimeout(async () => {
            try {
                setAutoSubmitted(true);
                await handleContestSubmit({ isAuto: true });
                navigate(`/contests/${contestId}#leaderboard`, { replace: true });
            } catch {
                // ignore
            }
        }, delayMs);

        return () => clearTimeout(t);
    }, [contestId, contestSolve, autoSubmitted]);

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
                    <p className="text-red-600 text-lg mb-4">{error || "Problem not found"}</p>
                    <Link to="/problems" className="btn btn-primary">Back to Problems</Link>
                </div>
            </div>
        );
    }

    return (
        <div
            className={
                isFullscreenEnforced
                    ? (isInFullscreen ? "h-screen w-screen bg-gray-50" : "min-h-screen bg-gray-50 pt-16")
                    : "min-h-screen bg-gray-50 pt-16"
            }
        >
            <div className={isFullscreenEnforced ? "h-full w-full px-4 py-4" : "container mx-auto px-4 py-6"}>
                {isFullscreenEnforced && isInFullscreen ? (
                    <div className="flex items-center justify-end mb-3">
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
                {!isFullscreenEnforced ? (
                    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                        <Link to="/problems" className="hover:text-emerald-600">Problems</Link>
                        <span>/</span>
                        <span className="text-gray-800">{problem.title}</span>
                    </nav>
                ) : null}

                <div className={isFullscreenEnforced ? "grid lg:grid-cols-2 gap-4 h-full" : "grid lg:grid-cols-2 gap-6"}>
                    {/* Problem Statement Panel */}
                    <div className={isFullscreenEnforced ? "space-y-4 h-full overflow-auto" : "space-y-4"}>
                        {/* Header */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{problem.title}</h1>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getDifficultyColor(problem.difficulty)}`}>
                                            {problem.difficulty}
                                        </span>
                                        <div className="flex gap-1 flex-wrap">
                                            {problem.tags?.map((tag) => (
                                                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    to="/problems"
                                    className="btn btn-sm btn-ghost text-gray-500 hover:text-gray-700"
                                >
                                    ← Back
                                </Link>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="flex border-b border-gray-200">
                                {["description", "testcases"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab
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

                                        {/* Constraints Section (if present in description) */}
                                        {problem.description?.includes("Constraints") && (
                                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                                <h4 className="font-semibold text-gray-800 mb-2">Constraints:</h4>
                                                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                                                    <li>Time Limit: {problem.timeLimit || 2} seconds</li>
                                                    <li>Memory Limit: 256 MB</li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* ✅ UPDATED: Sample Test Cases Tab with Better Styling */
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-gray-800">Sample Test Cases</h4>
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
                                                    <span className="text-sm font-medium text-gray-700">Test Case</span>
                                                </div>

                                                <div className="grid gap-3">
                                                    {/* Input */}
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Input</span>
                                                        </div>
                                                        <pre className="bg-white border border-gray-200 text-gray-800 p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                                                            {tc.input || <span className="text-gray-400 italic">(empty)</span>}
                                                        </pre>
                                                    </div>

                                                    {/* Expected Output */}
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expected Output</span>
                                                        </div>
                                                        <pre className="bg-white border border-gray-200 text-gray-800 p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                                                            {tc.output || <span className="text-gray-400 italic">(empty)</span>}
                                                        </pre>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {(!problem.sampleTestcases || problem.sampleTestcases.length === 0) && (
                                            <div className="text-center py-8 text-gray-500">
                                                <p>No sample test cases available</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submission Stats (Placeholder) */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5">
                            <h4 className="font-semibold text-gray-800 mb-3">Problem Stats</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Acceptance Rate</p>
                                    <p className="font-semibold text-emerald-600">—</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Submissions</p>
                                    <p className="font-semibold text-gray-800">—</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Code Editor Panel */}
                    <div className={isFullscreenEnforced ? "h-full overflow-auto" : "lg:sticky lg:top-20 lg:self-start"}>
                        <CodeEditor
                            problemId={id}
                            onRun={handleRun}
                            running={running}
                            results={results}
                            onClearResults={() => setResults(null)}
                            onChange={({ sourceCode, languageId }) => setEditorState({ sourceCode, languageId })}
                            editorHeightClass={isFullscreenEnforced ? "h-[calc(100vh-6rem)]" : "h-[20rem]"}
                        />

                        {contestId && contestSolve?.expiresAt ? (
                            <div className="mt-4 bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs text-gray-500">Contest Problem Timer</div>
                                        <div className="text-sm font-semibold text-gray-900">Time left</div>
                                    </div>
                                    <div className="font-mono text-2xl font-bold text-emerald-600">
                                        {formatSolveCountdown(contestTimeLeftMs ?? 0)}
                                    </div>
                                </div>
                                {isContestSolveExpired ? (
                                    <div className="mt-2 text-xs text-red-600">Time is over — submitting is disabled.</div>
                                ) : null}
                            </div>
                        ) : null}

                        {/* Submit Button (Contest-enabled when opened with ?contestId=...) */}
                        {isAuthenticated && (
                            <button
                                className="w-full mt-4 btn btn-lg bg-gradient-to-r from-emerald-500 to-cyan-600 border-none text-white"
                                onClick={() => handleContestSubmit({ isAuto: false })}
                                disabled={Boolean(contestId) && isContestSolveExpired}
                            >
                                {contestId ? "Submit to Contest" : "Submit Solution"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}