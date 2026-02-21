import { useMemo, useState } from "react";
import { api } from "../utils/api";

const emptySingle = {
  title: "",
  description: "",
  constraints: "",
  difficulty: "Easy",
  tags: "",
  timeLimit: 2,
  sampleTestcases: [{ input: "", output: "" }],
  hiddenTestcases: [{ input: "", output: "" }],
};

const toStringArray = (multiline) =>
  String(multiline || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

const toTagsArray = (csv) =>
  String(csv || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const cleanTestcases = (tcs) =>
  (Array.isArray(tcs) ? tcs : [])
    .map((tc) => ({
      input: String(tc?.input || ""),
      output: String(tc?.output || ""),
    }))
    .filter((tc) => tc.input.trim() && tc.output.trim());

export default function UploadProblems() {
  const [mode, setMode] = useState("single");
  const [single, setSingle] = useState(emptySingle);
  const [bulkJson, setBulkJson] = useState(
    JSON.stringify({ problems: [] }, null, 2),
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const payloadSingle = useMemo(() => {
    return {
      title: single.title,
      description: single.description,
      constraints: toStringArray(single.constraints),
      difficulty: single.difficulty,
      tags: toTagsArray(single.tags),
      timeLimit: Number(single.timeLimit) || 2,
      sampleTestcases: cleanTestcases(single.sampleTestcases),
      hiddenTestcases: cleanTestcases(single.hiddenTestcases),
    };
  }, [single]);

  const setTc = (which, idx, field, value) => {
    setSingle((prev) => {
      const next = { ...prev };
      const list = [...next[which]];
      list[idx] = { ...list[idx], [field]: value };
      next[which] = list;
      return next;
    });
  };

  const addTc = (which) => {
    setSingle((prev) => ({
      ...prev,
      [which]: [...prev[which], { input: "", output: "" }],
    }));
  };

  const removeTc = (which, idx) => {
    setSingle((prev) => ({
      ...prev,
      [which]: prev[which].filter((_, i) => i !== idx),
    }));
  };

  const submitSingle = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api("/problems", {
        method: "POST",
        body: payloadSingle,
      });
      setMessage({ type: "success", text: res?.message || "Problem created" });
      setSingle(emptySingle);
    } catch (e) {
      setMessage({
        type: "error",
        text: e.message || "Failed to create problem",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitBulk = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const parsed = JSON.parse(bulkJson);
      const res = await api("/problems/bulk", { method: "POST", body: parsed });
      setMessage({ type: "success", text: res?.message || "Bulk insert done" });
    } catch (e) {
      setMessage({ type: "error", text: e.message || "Bulk insert failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Upload Problems</h1>
          <p className="text-gray-600">Admin-only: create problems via API</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${mode === "single" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Single
          </button>
          <button
            type="button"
            onClick={() => setMode("bulk")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${mode === "bulk" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Bulk
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm border ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}
          >
            {message.text}
          </div>
        )}

        {mode === "single" ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  className="input input-bordered w-full bg-gray-50 mt-1"
                  value={single.title}
                  onChange={(e) =>
                    setSingle({ ...single, title: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  className="textarea textarea-bordered w-full bg-gray-50 mt-1 min-h-30"
                  value={single.description}
                  onChange={(e) =>
                    setSingle({ ...single, description: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Constraints (one per line)
                </label>
                <textarea
                  className="textarea textarea-bordered w-full bg-gray-50 mt-1 min-h-24"
                  value={single.constraints}
                  onChange={(e) =>
                    setSingle({ ...single, constraints: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Difficulty
                </label>
                <select
                  className="select select-bordered w-full bg-gray-50 mt-1"
                  value={single.difficulty}
                  onChange={(e) =>
                    setSingle({ ...single, difficulty: e.target.value })
                  }
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Time Limit (seconds)
                </label>
                <input
                  type="number"
                  min={1}
                  className="input input-bordered w-full bg-gray-50 mt-1"
                  value={single.timeLimit}
                  onChange={(e) =>
                    setSingle({ ...single, timeLimit: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Tags (comma separated)
                </label>
                <input
                  className="input input-bordered w-full bg-gray-50 mt-1"
                  value={single.tags}
                  onChange={(e) =>
                    setSingle({ ...single, tags: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">
                    Sample Testcases
                  </h3>
                  <button
                    type="button"
                    className="btn btn-xs"
                    onClick={() => addTc("sampleTestcases")}
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {single.sampleTestcases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-xl p-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500">
                          #{idx + 1}
                        </span>
                        {single.sampleTestcases.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => removeTc("sampleTestcases", idx)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        className="input input-bordered w-full bg-gray-50 mb-2"
                        placeholder="Input"
                        value={tc.input}
                        onChange={(e) =>
                          setTc("sampleTestcases", idx, "input", e.target.value)
                        }
                      />
                      <input
                        className="input input-bordered w-full bg-gray-50"
                        placeholder="Output"
                        value={tc.output}
                        onChange={(e) =>
                          setTc(
                            "sampleTestcases",
                            idx,
                            "output",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">
                    Hidden Testcases
                  </h3>
                  <button
                    type="button"
                    className="btn btn-xs"
                    onClick={() => addTc("hiddenTestcases")}
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {single.hiddenTestcases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-xl p-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500">
                          #{idx + 1}
                        </span>
                        {single.hiddenTestcases.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => removeTc("hiddenTestcases", idx)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        className="input input-bordered w-full bg-gray-50 mb-2"
                        placeholder="Input"
                        value={tc.input}
                        onChange={(e) =>
                          setTc("hiddenTestcases", idx, "input", e.target.value)
                        }
                      />
                      <input
                        className="input input-bordered w-full bg-gray-50"
                        placeholder="Output"
                        value={tc.output}
                        onChange={(e) =>
                          setTc(
                            "hiddenTestcases",
                            idx,
                            "output",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                disabled={submitting}
                onClick={submitSingle}
                className="btn bg-emerald-500 border-none text-white"
              >
                {submitting ? "Uploading..." : "Create Problem"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <label className="text-sm font-medium text-gray-700">
              Bulk JSON
            </label>
            <textarea
              className="textarea textarea-bordered w-full bg-gray-50 mt-1 min-h-64 font-mono text-xs"
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-2">
              Format:{" "}
              <code className="font-mono">
                {
                  '{"problems":[{"title":"...","description":"...","constraints":["..."],"difficulty":"Easy"}]}'
                }
              </code>
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={submitting}
                onClick={submitBulk}
                className="btn bg-emerald-500 border-none text-white"
              >
                {submitting ? "Uploading..." : "Bulk Upload"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
