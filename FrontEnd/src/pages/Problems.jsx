// pages/Problems.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

export default function Problems() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        difficulty: "",
        tag: "",
        search: "",
    });

    const difficulties = ["All", "Easy", "Medium", "Hard"];
    const popularTags = ["Arrays", "Strings", "DP", "Graphs", "Trees", "Sorting", "Binary Search"];

    const fetchProblems = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.difficulty && filters.difficulty !== "All") {
                params.append("difficulty", filters.difficulty);
            }
            if (filters.tag) params.append("tag", filters.tag);
            if (filters.search) params.append("search", filters.search);

            const response = await api(`/problems?${params}`);
            setProblems(response.data);
            setError(null);
        } catch (err) {
            setError(err.message || "Failed to load problems");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProblems();
    }, [filters.difficulty, filters.tag]);

    const getDifficultyColor = (difficulty) => {
        const colors = {
            Easy: "text-emerald-600 bg-emerald-100",
            Medium: "text-amber-600 bg-amber-100",
            Hard: "text-red-600 bg-red-100",
        };
        return colors[difficulty] || "text-gray-600 bg-gray-100";
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        Practice Problems
                    </h1>
                    <p className="text-gray-600">
                        Sharpen your coding skills with {problems.length}+ curated problems
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search problems by title or tag..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                onKeyDown={(e) => e.key === "Enter" && fetchProblems()}
                                className="input input-bordered w-full bg-gray-50"
                            />
                        </div>

                        {/* Difficulty Filter */}
                        <div className="flex gap-2 flex-wrap">
                            {difficulties.map((diff) => (
                                <button
                                    key={diff}
                                    onClick={() => setFilters({ ...filters, difficulty: diff })}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filters.difficulty === diff
                                            ? "bg-emerald-500 text-white shadow-md"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    {diff}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-gray-100">
                        {popularTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() =>
                                    setFilters({ ...filters, tag: filters.tag === tag ? "" : tag })
                                }
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filters.tag === tag
                                        ? "bg-cyan-500 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-cyan-100 hover:text-cyan-700"
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                        {filters.tag && (
                            <button
                                onClick={() => setFilters({ ...filters, tag: "" })}
                                className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200"
                            >
                                Clear Tag ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Problems List */}
                {loading ? (
                    <div className="grid gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-red-600 text-lg">{error}</p>
                        <button onClick={fetchProblems} className="btn btn-primary mt-4">
                            Retry
                        </button>
                    </div>
                ) : problems.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl">
                        <p className="text-gray-500 text-lg">No problems found matching your filters</p>
                        <button
                            onClick={() => setFilters({ difficulty: "", tag: "", search: "" })}
                            className="btn btn-outline mt-4"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {problems.map((problem) => (
                            <Link
                                key={problem._id}
                                to={`/problems/${problem._id}`}
                                className="block bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md hover:border-emerald-300 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getDifficultyColor(
                                                    problem.difficulty
                                                )}`}
                                            >
                                                {problem.difficulty}
                                            </span>
                                            <div className="flex gap-1 flex-wrap">
                                                {problem.tags?.slice(0, 3).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                                {problem.tags?.length > 3 && (
                                                    <span className="px-2 py-0.5 text-gray-400 text-xs">
                                                        +{problem.tags.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                                            {problem.title}
                                        </h3>
                                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                                            {problem.description?.substring(0, 150)}
                                            {problem.description?.length > 150 ? "..." : ""}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 group-hover:text-emerald-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Load More (Optional - implement pagination later) */}
                {problems.length > 0 && (
                    <div className="text-center mt-8">
                        <button className="btn btn-outline btn-lg" disabled>
                            Load More Problems
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}