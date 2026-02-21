// pages/ProblemDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { api } from "../utils/api";
import CodeEditor from "../components/CodeEditor";

export default function ProblemDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const contestId = new URLSearchParams(location.search).get("contestId");

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState("description");
    const [editorState, setEditorState] = useState({ sourceCode: "", languageId: 71 });

    useEffect(() => {
        fetchProblem();
    }, [id]);

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

    const handleContestSubmit = async () => {
        if (!contestId) {
            alert("Submission feature coming soon!");
            return;
        }
        if (!isAuthenticated) {
            alert("Please login to submit");
            navigate("/login");
            return;
        }
        if (!editorState.sourceCode?.trim()) {
            alert("Please write some code first!");
            return;
        }

        try {
            const res = await api(`/contests/${contestId}/submit`, {
                method: "POST",
                body: {
                    problemId: id,
                    code: editorState.sourceCode,
                    languageId: editorState.languageId,
                },
            });

            window.dispatchEvent(
                new CustomEvent("contest:submission", { detail: { contestId } })
            );
            alert(`Contest Submission: ${res.status}`);
        } catch (err) {
            alert(err.message || "Failed to submit");
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
                    <p className="text-red-600 text-lg mb-4">{error || "Problem not found"}</p>
                    <Link to="/problems" className="btn btn-primary">Back to Problems</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-16">
            <div className="container mx-auto px-4 py-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link to="/problems" className="hover:text-emerald-600">Problems</Link>
                    <span>/</span>
                    <span className="text-gray-800">{problem.title}</span>
                </nav>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Problem Statement Panel */}
                    <div className="space-y-4">
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
                    <div className="lg:sticky lg:top-20 lg:self-start">
                        <CodeEditor
                            problemId={id}
                            onRun={handleRun}
                            running={running}
                            results={results}
                            onClearResults={() => setResults(null)}
                            onChange={({ sourceCode, languageId }) => setEditorState({ sourceCode, languageId })}
                        />

                        {/* Submit Button (Contest-enabled when opened with ?contestId=...) */}
                        {isAuthenticated && (
                            <button
                                className="w-full mt-4 btn btn-lg bg-gradient-to-r from-emerald-500 to-cyan-600 border-none text-white"
                                onClick={handleContestSubmit}
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