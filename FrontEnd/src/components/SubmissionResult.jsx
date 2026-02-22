// components/SubmissionResult.jsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { API_BASE } from "../utils/api";

export default function SubmissionResult({
    result,
    sourceCode,
    languageId,
    onClose,
    onRetry,
}) {
    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!result) return null;

    const isAccepted = result.verdict === "Accepted";

    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const languageLabel = useMemo(() => {
        const map = {
            48: "C (GCC)",
            52: "C++ (GCC)",
            62: "Java (OpenJDK)",
            63: "JavaScript (Node.js)",
            71: "Python (3.8.1)",
        };
        const numeric = Number(languageId);
        return map[numeric] || String(languageId ?? "unknown");
    }, [languageId]);

    const scoreColorClass = useMemo(() => {
        const score = aiAnalysis?.score;
        if (typeof score !== "number") return "text-gray-700";
        if (score < 50) return "text-red-600";
        if (score < 80) return "text-amber-600";
        return "text-emerald-600";
    }, [aiAnalysis]);

    useEffect(() => {
        let cancelled = false;

        const analyze = async () => {
            if (!isAccepted) return;

            const code = typeof sourceCode === "string" ? sourceCode : "";
            if (!code.trim()) return;

            try {
                setIsAnalyzing(true);

                const res = await fetch(`${API_BASE}/api/code/analyze`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        code,
                        language: languageLabel,
                    }),
                });

                const data = await res.json().catch(() => null);
                if (!res.ok) {
                    const msg = data?.message || "AI readability analysis failed";
                    throw new Error(msg);
                }

                if (!cancelled) setAiAnalysis(data);
            } catch (err) {
                if (!cancelled) {
                    setAiAnalysis({
                        score: 0,
                        feedback: `AI readability analysis failed: ${err?.message || "Unknown error"}`,
                    });
                }
            } finally {
                if (!cancelled) setIsAnalyzing(false);
            }
        };

        analyze();
        return () => {
            cancelled = true;
        };
        // Run once on mount (as requested)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getVerdictStyles = (verdict) => {
        const styles = {
            "Accepted": "bg-emerald-100 text-emerald-800 border-emerald-300",
            "Wrong Answer": "bg-red-100 text-red-800 border-red-300",
            "Time Limit Exceeded": "bg-amber-100 text-amber-800 border-amber-300",
            "Runtime Error": "bg-purple-100 text-purple-800 border-purple-300",
            "Compilation Error": "bg-gray-100 text-gray-800 border-gray-300",
        };
        return styles[verdict] || "bg-gray-100 text-gray-800 border-gray-300";
    };

    const progressPercent = Math.round((result.passedTestcases / result.totalTestcases) * 100);

    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[calc(100vh-6rem)] overflow-y-auto">

                {/* Header */}
                <div className={`px-6 py-4 border-b ${isAccepted ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAccepted ? "bg-emerald-500" : "bg-red-500"}`}>
                                {isAccepted ? (
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {isAccepted ? "🎉 Accepted!" : "❌ Submission Failed"}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {isAccepted ? "All test cases passed" : `Failed at test case #${result.stats?.failedAt || "?"}`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">

                    {/* Verdict Badge */}
                    <div className="flex items-center justify-center">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getVerdictStyles(result.verdict)}`}>
                            {result.verdict}
                        </span>
                    </div>

                    {/* Test Cases Progress */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Test Cases Passed</span>
                            <span className="text-sm font-bold text-gray-900">
                                {result.passedTestcases}/{result.totalTestcases}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-3 rounded-full transition-all duration-500 ${isAccepted ? "bg-emerald-500" : "bg-red-500"}`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg Runtime</p>
                            <p className="text-lg font-bold text-gray-900">{result.stats?.avgRuntime || "—"}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Max Memory</p>
                            <p className="text-lg font-bold text-gray-900">{result.stats?.maxMemory || "—"}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Submission ID</p>
                            <p className="text-sm font-mono text-gray-700 truncate">{result.submissionId?.slice(-8) || "—"}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                            <p className={`text-sm font-semibold ${isAccepted ? "text-emerald-600" : "text-red-600"}`}>
                                {isAccepted ? "✓ Saved" : "✗ Failed"}
                            </p>
                        </div>
                    </div>

                    {/* AI Feedback (Readability Score) */}
                    {isAccepted && (
                        <div className="pt-1">
                            {isAnalyzing && (
                                <div className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-sm text-slate-700">
                                        🤖 AI Senior Engineer is reviewing your code readability...
                                    </div>
                                    <div className="mt-3 h-3 w-24 rounded bg-slate-200" />
                                    <div className="mt-2 h-3 w-full rounded bg-slate-200" />
                                    <div className="mt-2 h-3 w-5/6 rounded bg-slate-200" />
                                </div>
                            )}

                            {!isAnalyzing && aiAnalysis && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="shrink-0">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                                                AI Readability Score
                                            </p>
                                            <p className={`text-3xl font-bold leading-none ${scoreColorClass}`}>
                                                {aiAnalysis.score}
                                            </p>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                                                Feedback
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                {aiAnalysis.feedback}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onRetry}
                            className="flex-1 btn btn-outline border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={onClose}
                            className={`flex-1 btn ${isAccepted ? "bg-emerald-500 hover:bg-emerald-600 text-white border-none" : "bg-gray-800 hover:bg-gray-900 text-white border-none"}`}
                        >
                            {isAccepted ? "Next Problem →" : "Close"}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}