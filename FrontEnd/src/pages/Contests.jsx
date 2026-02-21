import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

function getContestStatus(contest) {
  const now = Date.now();
  const start = new Date(contest.startTime).getTime();
  const end = new Date(contest.endTime).getTime();
  if (now < start) return "Upcoming";
  if (now > end) return "Past";
  return "Live";
}

function formatDateTime(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt);
  }
}

export default function Contests() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const res = await api("/contests");
      setContests(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load contests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const contestsWithStatus = useMemo(() => {
    return (contests || []).map((c) => ({ ...c, status: getContestStatus(c) }));
  }, [contests]);

  const statusBadgeClass = (status) => {
    if (status === "Live") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "Upcoming") return "bg-cyan-100 text-cyan-700 border-cyan-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Contests</h1>
            <p className="text-gray-600">Compete live, climb the leaderboard.</p>
          </div>
          <button onClick={fetchContests} className="btn btn-outline">Refresh</button>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">{error}</p>
            <button onClick={fetchContests} className="btn btn-primary mt-4">Retry</button>
          </div>
        ) : contestsWithStatus.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-600">No contests available yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {contestsWithStatus.map((contest) => (
              <Link
                key={contest._id}
                to={`/contests/${contest._id}`}
                className="block bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-emerald-300 transition-all"
              >
                <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass(contest.status)}`}>
                        {contest.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {contest.problemsCount || 0} problems • {contest.participantsCount || 0} participants
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 truncate">{contest.title}</h3>
                    {contest.description ? (
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{contest.description}</p>
                    ) : null}
                    <div className="text-xs text-gray-500 mt-3">
                      <span className="font-medium">Start:</span> {formatDateTime(contest.startTime)}
                      <span className="mx-2">•</span>
                      <span className="font-medium">End:</span> {formatDateTime(contest.endTime)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-sm font-medium text-emerald-600">Open</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
