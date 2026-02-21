import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDatetimeLocalValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function CreateContest() {
  const navigate = useNavigate();

  const now = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => toDatetimeLocalValue(now), [now]);
  const defaultEnd = useMemo(
    () => toDatetimeLocalValue(new Date(now.getTime() + 60 * 60 * 1000)),
    [now],
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);

  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [selected, setSelected] = useState(() => ({}));

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected],
  );

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoadingProblems(true);
        const res = await api("/problems");
        setProblems(res?.data || []);
      } catch (e) {
        setMessage({
          type: "error",
          text: e.message || "Failed to load problems",
        });
      } finally {
        setLoadingProblems(false);
      }
    };

    fetchProblems();
  }, []);

  const toggleProblem = (problemId) => {
    setSelected((prev) => {
      const exists = prev[problemId];
      if (exists) {
        const next = { ...prev };
        delete next[problemId];
        return next;
      }
      return { ...prev, [problemId]: { pointValue: 100 } };
    });
  };

  const setPointValue = (problemId, value) => {
    setSelected((prev) => {
      if (!prev[problemId]) return prev;
      return {
        ...prev,
        [problemId]: {
          ...prev[problemId],
          pointValue: value,
        },
      };
    });
  };

  const submit = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        title,
        description,
        startTime,
        endTime,
        problems: Object.entries(selected).map(([problemId, meta]) => ({
          problemId,
          pointValue: Number(meta?.pointValue) || 0,
        })),
      };

      await api("/contests", { method: "POST", body: payload });
      setMessage({ type: "success", text: "Contest created" });
      setTimeout(() => navigate("/contests"), 400);
    } catch (e) {
      setMessage({
        type: "error",
        text: e.message || "Failed to create contest",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    !submitting && title.trim() && startTime && endTime && selectedCount > 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 text-gray-900">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Contest</h1>
            <p className="text-gray-600">
              Admin-only: create a contest dynamically
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate("/upload-problems")}
          >
            Back
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm border ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Title</label>
              <input
                className="input input-bordered w-full bg-gray-50 mt-1 text-gray-900"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekly Contest #1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="textarea textarea-bordered w-full bg-gray-50 mt-1 min-h-28 text-gray-900"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Start Time
              </label>
              <input
                type="datetime-local"
                className="input input-bordered w-full bg-gray-50 mt-1 text-gray-900"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                End Time
              </label>
              <input
                type="datetime-local"
                className="input input-bordered w-full bg-gray-50 mt-1 text-gray-900"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Problems</h2>
              <span className="text-sm text-gray-600">
                Selected: {selectedCount}
              </span>
            </div>

            {loadingProblems ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-600">
                Loading problems...
              </div>
            ) : problems.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-600">
                No problems found. Upload problems first.
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
                <table className="table w-full text-gray-900">
                  <thead className="text-gray-700">
                    <tr>
                      <th className="w-12 text-gray-700">Pick</th>
                      <th className="text-gray-700">Title</th>
                      <th className="w-32 text-gray-700">Difficulty</th>
                      <th className="w-44 text-gray-700">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((p) => {
                      const isSelected = Boolean(selected[p._id]);
                      return (
                        <tr
                          key={p._id}
                          className={isSelected ? "bg-emerald-50/40" : ""}
                        >
                          <td>
                            <input
                              type="checkbox"
                              className="h-5 w-5 accent-emerald-600 cursor-pointer"
                              checked={isSelected}
                              onChange={() => toggleProblem(p._id)}
                            />
                          </td>
                          <td>
                            <div className="font-medium text-gray-900">
                              {p.title}
                            </div>
                            {Array.isArray(p.tags) && p.tags.length ? (
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                {p.tags.slice(0, 6).join(", ")}
                              </div>
                            ) : null}
                          </td>
                          <td>
                            <span className="text-sm text-gray-700">
                              {p.difficulty}
                            </span>
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              disabled={!isSelected}
                              className="input input-bordered w-full bg-gray-50 text-gray-900"
                              value={
                                isSelected
                                  ? (selected[p._id]?.pointValue ?? 100)
                                  : 100
                              }
                              onChange={(e) =>
                                setPointValue(p._id, e.target.value)
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              className="btn btn-outline"
              disabled={submitting}
              onClick={() => navigate("/contests")}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canSubmit}
              onClick={submit}
              title={
                !canSubmit
                  ? "Fill required fields and select at least one problem"
                  : ""
              }
            >
              {submitting ? "Creating..." : "Create Contest"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
