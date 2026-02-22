import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { api } from "../utils/api";

function intensityClass(count) {
  if (!count) return "bg-gray-100";
  if (count <= 2) return "bg-emerald-100";
  if (count <= 5) return "bg-emerald-300";
  return "bg-emerald-500";
}

const APP_TIMEZONE = import.meta.env.VITE_APP_TIMEZONE || "Asia/Kolkata";

function toYmd(date) {
  // Match backend aggregation keys (same timezone).
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function weekdayIndex(date) {
  const wk = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
  }).format(date);
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wk] ?? 0;
}

function monthShort(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    month: "short",
  }).format(date);
}

function monthKey(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

function formatPrettyFromYmd(ymd) {
  const [y, m, d] = String(ymd || "").split("-");
  if (!y || !m || !d) return String(ymd || "");
  const date = new Date(`${y}-${m}-${d}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function computeStreakFromYmdDays(daysAsc) {
  let best = 0;
  let currentRun = 0;

  for (let i = 0; i < daysAsc.length; i++) {
    if (i === 0) {
      currentRun = 1;
      best = 1;
      continue;
    }
    const prev = new Date(daysAsc[i - 1] + "T00:00:00Z");
    const cur = new Date(daysAsc[i] + "T00:00:00Z");
    const diffDays = Math.round((cur - prev) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) currentRun += 1;
    else currentRun = 1;
    if (currentRun > best) best = currentRun;
  }

  const set = new Set(daysAsc);
  const today = toYmd(new Date());
  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  const yesterday = toYmd(yd);

  let current = 0;
  let cursor = set.has(today)
    ? new Date(today + "T00:00:00Z")
    : set.has(yesterday)
      ? new Date(yesterday + "T00:00:00Z")
      : null;

  while (cursor) {
    const key = toYmd(cursor);
    if (!set.has(key)) break;
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, best };
}

function YearHeatmap({ activity, days = 365 }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries?.[0]?.contentRect?.width || 0);
      setContainerWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const map = useMemo(() => {
    const m = new Map();
    for (const row of activity || []) {
      if (row?.date) m.set(row.date, row.count || 0);
    }
    return m;
  }, [activity]);

  const enableMonthGaps = containerWidth >= 640;

  const { gridStart, totalWeeks, monthLabels, inRangeSet, columns, weekToCol, spacerCount } = useMemo(() => {
    const now = new Date();
    // Use noon to avoid DST/edge-case shifts when moving by days.
    const end = new Date(now);
    end.setHours(12, 0, 0, 0);
    const rangeDates = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      rangeDates.push(d);
    }

    const inRangeKeys = new Set(rangeDates.map((d) => toYmd(d)));
    const first = rangeDates[0];
    const padStart = weekdayIndex(first); // 0=Sun

    const start = new Date(first);
    start.setDate(start.getDate() - padStart);
    start.setHours(12, 0, 0, 0);

    const padEnd = (7 - ((days + padStart) % 7)) % 7;
    const totalGridDays = days + padStart + padEnd;
    const weeks = Math.ceil(totalGridDays / 7);

    const labels = [];
    const cols = [];
    const wToCol = [];
    let lastMonth = "";
    let col = 0;
    let gapCols = 0;
    for (let w = 0; w < weeks; w++) {
      const weekDate = new Date(start);
      weekDate.setDate(weekDate.getDate() + w * 7);
      // Avoid showing labels for the padded days before the real range.
      const effective = weekDate < first ? first : weekDate;
      const mk = monthKey(effective);

      if (w !== 0 && mk !== lastMonth) {
        if (enableMonthGaps) {
          cols.push("spacer");
          col += 1;
          gapCols += 1;
        }
        labels.push({ week: w, text: monthShort(effective) });
      } else if (w === 0) {
        labels.push({ week: w, text: monthShort(effective) });
      }

      cols.push("cell");
      wToCol[w] = col;
      col += 1;
      lastMonth = mk;
    }

    return {
      gridStart: start,
      totalWeeks: weeks,
      monthLabels: labels,
      inRangeSet: inRangeKeys,
      columns: cols,
      weekToCol: wToCol,
      spacerCount: gapCols,
    };
  }, [days, enableMonthGaps]);

  const { cellSize, gapSize, spacerSize } = useMemo(() => {
    const w = containerWidth || 0;
    const cellCount = totalWeeks;
    const totalCols = columns.length;
    if (!w || !cellCount || !totalCols) {
      return { cellSize: 10, gapSize: 2, spacerSize: enableMonthGaps ? 6 : 0 };
    }

    const tryLayout = (gap, spacer) => {
      const gapsTotal = Math.max(0, totalCols - 1) * gap;
      const spaceForCells = w - spacerCount * spacer - gapsTotal;
      const cell = Math.floor(spaceForCells / cellCount);
      return { cell, gap, spacer };
    };

    // Start slightly roomy, then tighten to fit.
    let best = tryLayout(2, enableMonthGaps ? 6 : 0);
    if (best.cell < 7) best = tryLayout(2, enableMonthGaps ? 2 : 0);
    if (best.cell < 7) best = tryLayout(1, enableMonthGaps ? 2 : 0);
    if (best.cell < 7) best = tryLayout(1, 0);

    const cellSizeClamped = Math.max(6, Math.min(12, best.cell));
    return {
      cellSize: cellSizeClamped,
      gapSize: best.gap,
      spacerSize: best.spacer,
    };
  }, [columns.length, containerWidth, enableMonthGaps, spacerCount, totalWeeks]);

  const gridTemplateColumns = useMemo(() => {
    return columns
      .map((c) => (c === "spacer" ? `${spacerSize}px` : `${cellSize}px`))
      .join(" ");
  }, [cellSize, columns, spacerSize]);

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="grid"
        style={{
          gridTemplateColumns,
          gridTemplateRows: `repeat(7, ${cellSize}px)`,
          gap: `${gapSize}px`,
        }}
      >
          {Array.from({ length: totalWeeks }).flatMap((_, week) => {
            return Array.from({ length: 7 }).map((__, dayOfWeek) => {
              const d = new Date(gridStart);
              d.setDate(d.getDate() + week * 7 + dayOfWeek);
              const key = toYmd(d);
              const inRange = inRangeSet.has(key);
              const count = inRange ? map.get(key) || 0 : 0;
              const colStart = (weekToCol[week] ?? 0) + 1;
              const tip = inRange
                ? `${count} problem${count === 1 ? "" : "s"} solved on ${formatPrettyFromYmd(key)}`
                : "";

              return (
                <div
                  key={`${week}-${dayOfWeek}`}
                  title={tip}
                  data-tip={tip}
                  className={`rounded ${
                    inRange ? intensityClass(count) : "bg-transparent"
                  } ${tip ? "tooltip tooltip-top cursor-pointer" : ""}`}
                  style={{ gridColumnStart: colStart, gridRowStart: dayOfWeek + 1 }}
                />
              );
            });
          })}
      </div>

      <div
        className="grid text-xs text-gray-500 mt-2"
        style={{
          gridTemplateColumns,
          columnGap: `${gapSize}px`,
        }}
      >
        {monthLabels.map((m) => (
          <div
            key={m.week}
            style={{ gridColumnStart: (weekToCol[m.week] ?? 0) + 1 }}
            className="whitespace-nowrap"
          >
            {m.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutSolved({ solved, totals, attempting }) {
  const totalProblems = totals?.total ?? 0;
  const easyTotal = totals?.easy ?? 0;
  const medTotal = totals?.medium ?? 0;
  const hardTotal = totals?.hard ?? 0;

  const easySolved = solved?.easy ?? 0;
  const medSolved = solved?.medium ?? 0;
  const hardSolved = solved?.hard ?? 0;
  const totalSolved = solved?.total ?? 0;

  const denom = totalProblems || 1;
  const easyPct = (easySolved / denom) * 100;
  const medPct = (medSolved / denom) * 100;
  const hardPct = (hardSolved / denom) * 100;
  const solvedPct = (totalSolved / denom) * 100;

  const bg = `conic-gradient(
    #10b981 0 ${easyPct}%,
    #f59e0b ${easyPct}% ${easyPct + medPct}%,
    #ef4444 ${easyPct + medPct}% ${easyPct + medPct + hardPct}%,
    #e5e7eb ${easyPct + medPct + hardPct}% 100%
  )`;

  return (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <div
            className="w-32 h-32 rounded-full"
            style={{ background: bg }}
            aria-label="Solved donut"
          />
          <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center text-center">
            <div className="text-3xl font-bold text-gray-900 leading-none">{totalSolved}</div>
            <div className="text-xs text-gray-600">/{totalProblems}</div>
            <div className="text-xs text-emerald-700 font-medium mt-1">Solved</div>
          </div>
          <div className="sr-only">{Math.round(solvedPct)}% solved</div>
        </div>
        <div className="text-xs text-gray-500 mt-3">{attempting ?? 0} Attempting</div>
      </div>

      <div className="flex-1 grid gap-2">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-emerald-700">Easy</span>
          <span className="text-sm text-gray-700">{easySolved}/{easyTotal}</span>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-amber-700">Med.</span>
          <span className="text-sm text-gray-700">{medSolved}/{medTotal}</span>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-red-700">Hard</span>
          <span className="text-sm text-gray-700">{hardSolved}/{hardTotal}</span>
        </div>
      </div>
    </div>
  );
}

const LANGUAGE_ID_TO_NAME = {
  71: "Python",
  62: "Java",
  63: "JavaScript",
  52: "C++",
  48: "C",
};

function languageName(id) {
  return LANGUAGE_ID_TO_NAME[id] || `Lang ${id}`;
}

function SkillChips({ skills }) {
  const items = (skills || [])
    .filter((s) => s && typeof s._id === "string")
    .map((s) => ({ tag: s._id, count: Number(s.count) || 0 }))
    .filter((s) => s.count > 0);

  const advanced = items.filter((i) => i.count >= 5);
  const intermediate = items.filter((i) => i.count >= 2 && i.count <= 4);
  const fundamental = items.filter((i) => i.count === 1);

  const Section = ({ title, rows }) => {
    if (!rows.length) return null;
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-700">{title}</div>
        <div className="flex flex-wrap gap-2">
          {rows.slice(0, 10).map((r) => (
            <span
              key={r.tag}
              className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs border border-gray-200"
            >
              {r.tag} <span className="text-gray-500">x{r.count}</span>
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Section title="Advanced" rows={advanced} />
      <Section title="Intermediate" rows={intermediate} />
      <Section title="Fundamental" rows={fundamental} />
    </div>
  );
}

export default function Dashboard() {
  const { userId: routeUserId } = useParams();
  const { user: me } = useSelector((state) => state.auth);
  const userId = routeUserId || me?._id;

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const displayName = useMemo(() => {
    const first = (profile?.firstName || "").trim();
    const last = (profile?.lastName || "").trim();
    const full = `${first} ${last}`.trim();
    return full || "User";
  }, [profile?.firstName, profile?.lastName]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!userId) return;
      try {
        setLoading(true);
        setError(null);

        const [statsRes, actRes, solvedRes] = await Promise.all([
          api(`/users/${userId}/stats`),
          api(`/users/${userId}/activity?all=1&metric=solved`),
          api(`/users/${userId}/solved-problems?limit=50`),
        ]);
        if (cancelled) return;
        setProfile(statsRes?.user || null);
        setStats(statsRes?.stats || null);
        setActivity(actRes?.data || []);
        setSolvedProblems(solvedRes?.data || []);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const solved = stats?.solved || { total: 0, easy: 0, medium: 0, hard: 0 };
  const totals = stats?.problemTotals || { total: 0, easy: 0, medium: 0, hard: 0 };

  const heatmapWindow = useMemo(() => {
    const todayKey = toYmd(new Date());
    // Always show last 12 calendar months (including current month).
    // Example: Feb 2026 -> window starts Mar 1, 2025.
    const todayDate = new Date(todayKey + "T12:00:00Z");
    const start = new Date(todayDate);
    // Avoid month-length shifting by anchoring mid-month first.
    start.setUTCDate(15);
    start.setUTCMonth(start.getUTCMonth() - 11);
    start.setUTCDate(1);
    const startKey = toYmd(start);

    const windowDays = Math.max(
      1,
      Math.round((todayDate - new Date(startKey + "T12:00:00Z")) / (1000 * 60 * 60 * 24)) + 1,
    );

    const titleSuffix = "in the past 12 months";

    return {
      startKey,
      endKey: todayKey,
      windowDays,
      titleSuffix,
    };
  }, [activity]);

  const activitySummary = useMemo(() => {
    const startKey = heatmapWindow.startKey;
    const endKey = heatmapWindow.endKey;

    const inWindow = (activity || []).filter((r) => {
      if (!r?.date) return false;
      return r.date >= startKey && r.date <= endKey;
    });

    const totalSubmissions = inWindow.reduce(
      (sum, r) => sum + (Number(r.count) || 0),
      0,
    );

    const daysAsc = inWindow
      .filter((r) => (Number(r.count) || 0) > 0 && typeof r.date === "string")
      .map((r) => r.date)
      .sort();

    const activeDays = daysAsc.length;
    const streak = computeStreakFromYmdDays(daysAsc);
    return { totalSubmissions, activeDays, streak };
  }, [activity, heatmapWindow.endKey, heatmapWindow.startKey]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="container mx-auto px-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-red-600 text-lg">{error}</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500 bg-white">
                  <img
                    src={profile?.photoUrl || me?.photoUrl}
                    alt={profile?.firstName || "User"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{displayName}</h1>
                  <p className="text-gray-600 text-sm">Profile</p>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-[2fr_1fr] gap-6 items-start">
              {/* Left column */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 h-fit">
                  <DonutSolved
                    solved={solved}
                    totals={totals}
                    attempting={stats?.attempting ?? 0}
                  />
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="text-gray-800">
                      <span className="text-xl font-semibold">{stats?.totalSubmissions ?? 0}</span>{" "}
                      <span className="text-sm text-gray-600">submissions</span>{" "}
                      <span className="text-xs text-gray-400 ml-2">(all-time)</span>
                      <span className="text-sm text-gray-600 ml-3">
                        · Problems solved {heatmapWindow.titleSuffix}
                      </span>
                    </div>

                    <div className="hidden md:flex items-center gap-5 text-sm text-gray-600 whitespace-nowrap">
                      <div>
                        Total active days:{" "}
                        <span className="font-semibold text-gray-800">{activitySummary.activeDays}</span>
                      </div>
                      <div>
                        Max streak:{" "}
                        <span className="font-semibold text-gray-800">{activitySummary.streak.best}</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:hidden flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      Total active days:{" "}
                      <span className="font-semibold text-gray-800">{activitySummary.activeDays}</span>
                    </div>
                    <div>
                      Max streak:{" "}
                      <span className="font-semibold text-gray-800">{activitySummary.streak.best}</span>
                    </div>
                  </div>

                  <YearHeatmap activity={activity} days={heatmapWindow.windowDays} />
                </div>
              </div>

              {/* Right column (no badges) */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Solved Problems</h2>
                  {solvedProblems.length === 0 ? (
                    <p className="text-sm text-gray-600">No solved problems yet.</p>
                  ) : (
                    <div
                      className={
                        solvedProblems.length > 4
                          ? "max-h-64 overflow-y-auto hide-scrollbar space-y-2"
                          : "space-y-2"
                      }
                    >
                      {solvedProblems.map((p) => (
                        <Link
                          key={p.problemId}
                          to={`/problems/${p.problemId}?tab=submissions`}
                          className="block p-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {p.title}
                            </div>
                            <div
                              className={
                                p.difficulty === "Easy"
                                  ? "text-xs font-semibold text-emerald-700"
                                  : p.difficulty === "Medium"
                                    ? "text-xs font-semibold text-amber-700"
                                    : "text-xs font-semibold text-red-700"
                              }
                            >
                              {p.difficulty}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Languages</h2>
                  {(stats?.languages || []).length === 0 ? (
                    <p className="text-sm text-gray-600">No accepted solutions yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.languages.slice(0, 6).map((l) => (
                        <div key={l._id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-800">{languageName(l._id)}</span>
                          <span className="text-sm text-gray-600">{l.problemsSolved} problems solved</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
                  <SkillChips skills={stats?.skills || []} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
