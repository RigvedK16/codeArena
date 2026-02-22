import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { api } from "../utils/api";

function getPhase(startTime, endTime) {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (now < start) return "Upcoming";
  if (now > end) return "Past";
  return "Live";
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function ContestDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nowMs, setNowMs] = useState(Date.now());

  const [registering, setRegistering] = useState(false);

  const [solvePopup, setSolvePopup] = useState(null);

  const fetchContest = async () => {
    const res = await api(`/contests/${id}`);
    return res.data;
  };

  const fetchLeaderboard = async () => {
    const res = await api(`/contests/${id}/leaderboard`);
    return res.data || [];
  };

  const refreshAll = async () => {
    try {
      setLoading(true);
      const [c, lb] = await Promise.all([fetchContest(), fetchLeaderboard()]);
      setContest(c);
      setLeaderboard(lb);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load contest");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, [id]);

  // If navigated from an auto-submit, scroll to leaderboard.
  useEffect(() => {
    if (location.hash !== "#leaderboard") return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        // Re-fetch once to ensure latest standings after auto-submit navigation.
        const lb = await fetchLeaderboard();
        if (!cancelled) setLeaderboard(lb);
      } catch {
        // ignore
      }

      const el = document.getElementById("leaderboard");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => clearTimeout(t);
  }, [location.hash, loading]);

  // Countdown tick
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const phase = useMemo(() => {
    if (!contest) return null;
    return getPhase(contest.startTime, contest.endTime);
  }, [contest, nowMs]);

  const canRegisterNow = useMemo(() => {
    if (!contest) return false;
    if (contest.isRegistered) return false;
    const startMs = new Date(contest.startTime).getTime();
    if (!Number.isFinite(startMs)) return false;
    const closesAtMs = startMs - 5 * 60 * 1000;
    return nowMs <= closesAtMs;
  }, [contest, nowMs]);

  const canSolve = useMemo(() => {
    if (!contest) return false;
    return phase === "Live" && Boolean(contest.isRegistered);
  }, [contest, phase]);

  const handleRegister = async () => {
    try {
      setRegistering(true);
      await api(`/contests/${id}/register`, { method: "POST" });
      await refreshAll();
    } catch (err) {
      alert(err.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const openSolvePopup = (problem) => {
    setSolvePopup({
      problemId: problem.problemId?._id || problem.problemId,
      title: problem.problemId?.title || "Problem",
    });
  };

  const requestFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) return await el.requestFullscreen();
      if (el.webkitRequestFullscreen) return await el.webkitRequestFullscreen();
      if (el.mozRequestFullScreen) return await el.mozRequestFullScreen();
      if (el.msRequestFullscreen) return await el.msRequestFullscreen();
    } catch {
      // ignore; problem view will force re-entry overlay
    }
  };

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

  const stopStreamTracks = (stream) => {
    try {
      stream?.getTracks?.().forEach((t) => t.stop());
    } catch {
      // ignore
    }
  };

  const getIsInFullscreen = () =>
    Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement,
    );

  const confirmSolve = async () => {
    if (!solvePopup?.problemId || !contest?._id) return;

    // Ask for camera permission BEFORE fullscreen by triggering the prompt first.
    // We don't await immediately so that fullscreen request still counts as a user gesture.
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Your browser does not support camera access.");
      return;
    }

    let cameraStreamPromise;
    try {
      cameraStreamPromise = navigator.mediaDevices.getUserMedia({ video: true });
    } catch {
      alert("Camera permission is required to start solving.");
      return;
    }

    await requestFullscreen();
    if (!getIsInFullscreen()) {
      // If the user denies fullscreen, stop the camera stream if it got granted.
      Promise.resolve(cameraStreamPromise)
        .then((s) => stopStreamTracks(s))
        .catch(() => null);
      alert(
        "Fullscreen is required to start solving. Please allow fullscreen and try again.",
      );
      return;
    }

    let cameraStream;
    try {
      cameraStream = await cameraStreamPromise;
      stopStreamTracks(cameraStream);
    } catch {
      await exitFullscreen();
      alert("Camera permission is required to start solving.");
      return;
    }

    // Reset proctoring strikes for this contest attempt.
    try {
      sessionStorage.setItem(
        `contest:proctorStrikes:${contest._id}`,
        "0",
      );
    } catch {
      // ignore
    }

    // Start the 60-min timer exactly when the user clicks Start Solving.
    const startRes = await api(`/contests/${contest._id}/start-problem`, {
      method: "POST",
      body: { problemId: solvePopup.problemId },
    });

    navigate(
      `/problems/${solvePopup.problemId}?contestId=${contest._id}&fs=1`,
      {
        state: { contestSolve: startRes?.data || null },
      },
    );
  };

  // Poll leaderboard while Live
  useEffect(() => {
    if (!contest) return;
    if (phase !== "Live") return;
    const t = setInterval(async () => {
      try {
        const lb = await fetchLeaderboard();
        setLeaderboard(lb);
      } catch {
        // ignore polling errors
      }
    }, 10000);
    return () => clearInterval(t);
  }, [contest, phase]);

  // Immediate refresh on successful submission
  useEffect(() => {
    const handler = async (e) => {
      const submittedContestId = e?.detail?.contestId;
      if (!submittedContestId || submittedContestId !== id) return;
      try {
        const lb = await fetchLeaderboard();
        setLeaderboard(lb);
      } catch {
        // ignore
      }
    };
    window.addEventListener("contest:submission", handler);
    return () => window.removeEventListener("contest:submission", handler);
  }, [id]);

  const countdownLabel = useMemo(() => {
    if (!contest) return "";
    const start = new Date(contest.startTime).getTime();
    const end = new Date(contest.endTime).getTime();
    if (nowMs < start) return "Starts In";
    if (nowMs <= end) return "Ends In";
    return "Ended";
  }, [contest, nowMs]);

  const countdownValue = useMemo(() => {
    if (!contest) return "00:00:00";
    const start = new Date(contest.startTime).getTime();
    const end = new Date(contest.endTime).getTime();
    if (nowMs < start) return formatCountdown(start - nowMs);
    if (nowMs <= end) return formatCountdown(end - nowMs);
    return "00:00:00";
  }, [contest, nowMs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">
            {error || "Contest not found"}
          </p>
          <Link to="/contests" className="btn btn-primary">
            Back to Contests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      {solvePopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Before you start</div>
                <div className="text-lg font-bold text-gray-900 truncate">
                  {solvePopup.title}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-ghost text-gray-500"
                onClick={() => setSolvePopup(null)}
              >
                Close
              </button>
            </div>

            <div className="text-sm text-gray-700 space-y-2">
              <div className="font-semibold text-gray-900">Rules</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>You have 60 minutes once you start solving.</li>
                <li>Submit within 60 minutes, otherwise it auto-submits.</li>
                <li>Leaving the page may prevent auto-submit.</li>
              </ul>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSolvePopup(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmSolve}
              >
                Start Solving
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            <Link
              to="/contests"
              className="text-sm text-gray-500 hover:text-emerald-600"
            >
              ← Back to Contests
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 truncate mt-1">
              {contest.title}
            </h1>
            {contest.description ? (
              <p className="text-gray-600 mt-1">{contest.description}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {phase === "Upcoming" && !contest.isRegistered ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={registering || !canRegisterNow}
                onClick={handleRegister}
                title="Register to unlock solving"
              >
                {registering ? "Registering..." : "Register"}
              </button>
            ) : null}
            <button
              onClick={refreshAll}
              className="btn btn-outline border-gray-300 text-gray-900 hover:bg-gray-100"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Countdown + Phase */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div className="text-lg font-semibold text-gray-900">{phase}</div>
              {phase === "Upcoming" && !contest.isRegistered && !canRegisterNow ? (
                <div className="mt-1 text-xs text-red-700">
                  Registration is closed (closes 5 minutes before start).
                </div>
              ) : null}
              {phase === "Live" && !contest.isRegistered ? (
                <div className="mt-1 text-xs text-amber-700">
                  Registration is closed. You must register before the contest starts.
                </div>
              ) : null}
            </div>
            <div className="text-center md:text-right">
              <div className="text-xs text-gray-500">{countdownLabel}</div>
              <div className="font-mono text-3xl font-bold text-emerald-600">
                {countdownValue}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Problems */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Problems</h2>

              <div className="space-y-3">
                {(contest.problems || []).map((p) => (
                  <div
                    key={p.problemId?._id || p.problemId}
                    role={canSolve ? "button" : undefined}
                    tabIndex={canSolve ? 0 : undefined}
                    onClick={canSolve ? () => openSolvePopup(p) : undefined}
                    onKeyDown={
                      canSolve
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openSolvePopup(p);
                            }
                          }
                        : undefined
                    }
                    className={
                      canSolve
                        ? "p-4 rounded-xl border border-gray-200 hover:border-emerald-300 transition-colors cursor-pointer"
                        : "p-4 rounded-xl border border-gray-200 transition-colors"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {p.problemId?.title || "Problem"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Points: {p.pointValue}
                        </div>
                      </div>
                      {canSolve ? (
                        <button
                          type="button"
                          className="btn btn-sm border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSolvePopup(p);
                          }}
                        >
                          Solve
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm border-gray-300 text-gray-500 opacity-70 cursor-not-allowed"
                          disabled
                          title={
                            phase !== "Live"
                              ? phase === "Upcoming"
                                ? "Contest has not started yet"
                                : "Contest has ended"
                              : "Register to solve contest problems"
                          }
                        >
                          Solve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-2" id="leaderboard">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {phase === "Live"
                    ? "Live Leaderboard"
                    : phase === "Past"
                      ? "Final Leaderboard"
                      : "Leaderboard"}
                </h2>
                <div className="text-xs text-gray-500">
                  Sorted by score ↓, penalty ↑
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="table w-full text-gray-900">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th>Rank</th>
                      <th>User</th>
                      <th className="text-right">Solved</th>
                      <th className="text-right">Score</th>
                      <th className="text-right">Time Taken</th>
                      <th className="text-right">Penalty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center text-gray-500 py-10"
                        >
                          No participants yet
                        </td>
                      </tr>
                    ) : (
                      leaderboard.map((row, idx) => (
                        <tr key={row.user?._id || idx}>
                          <td className="font-medium">{idx + 1}</td>
                          <td>
                            <div className="font-medium text-gray-900">
                              {row.user
                                ? `${row.user.firstName || ""} ${row.user.lastName || ""}`.trim()
                                : "Unknown"}
                            </div>
                            {row.user?.emailId ? (
                              <div className="text-xs text-gray-500">
                                {row.user.emailId}
                              </div>
                            ) : null}
                          </td>
                          <td className="text-right font-mono text-gray-700">
                            {`${row.solvedCount ?? 0}/${row.totalProblems ?? (contest?.problems || []).length}`}
                          </td>
                          <td className="text-right font-semibold text-emerald-700">
                            {row.totalScore}
                          </td>
                          <td className="text-right font-mono text-gray-700">{`${row.totalTimeTaken ?? 0}mins`}</td>
                          <td className="text-right font-mono text-gray-700">
                            {row.totalPenaltyTime}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
