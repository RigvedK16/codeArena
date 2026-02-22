import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGlobalLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api("/contests/global-leaderboard");
      setRows(res?.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Global Leaderboard</h1>
            <p className="text-gray-600">Ranked by total contest score across all contests.</p>
          </div>
          <button onClick={fetchGlobalLeaderboard} className="btn btn-outline">Refresh</button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-red-600 text-lg">{error}</p>
            <button onClick={fetchGlobalLeaderboard} className="btn btn-primary mt-4">Retry</button>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-600">No contest participation yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>User</th>
                    <th className="text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.user?._id || row.rank}>
                      <td className="font-semibold">{row.rank}</td>
                      <td>
                        {row.user?._id ? (
                          <Link
                            to={`/dashboard/${row.user._id}`}
                            className="font-medium text-gray-900 hover:text-emerald-700"
                          >
                            {`${row.user.firstName || ""} ${row.user.lastName || ""}`.trim() || row.user.emailId || "User"}
                          </Link>
                        ) : (
                          <div className="font-medium text-gray-900">Unknown</div>
                        )}
                        {row.user?.emailId ? <div className="text-xs text-gray-500">{row.user.emailId}</div> : null}
                      </td>
                      <td className="text-right font-semibold text-emerald-700">{row.totalScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
