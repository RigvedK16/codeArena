// routes/problems.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Problem = require("../models/problem");
const Submission = require("../models/submission");
const { userAuth, adminAuth } = require("../middleware/adminAuth");

const CANONICAL_TAGS = [
  "Array",
  "String",
  "Hash Table",
  "Math",
  "Dynamic Programming",
  "Sorting",
  "Greedy",
  "Depth-First Search",
  "Binary Search",
  "Database",
  "Bit Manipulation",
  "Matrix",
  "Tree",
  "Breadth-First Search",
  "Two Pointers",
  "Prefix Sum",
  "Heap (Priority Queue)",
  "Simulation",
  "Counting",
  "Graph Theory",
  "Binary Tree",
  "Stack",
  "Sliding Window",
  "Enumeration",
  "Design",
  "Backtracking",
  "Union-Find",
  "Number Theory",
  "Linked List",
  "Ordered Set",
  "Segment Tree",
  "Monotonic Stack",
  "Divide and Conquer",
  "Trie",
  "Combinatorics",
  "Bitmask",
  "Queue",
  "Recursion",
  "Geometry",
  "Binary Indexed Tree",
  "Memoization",
  "Binary Search Tree",
  "Hash Function",
  "Topological Sort",
  "Shortest Path",
  "String Matching",
  "Rolling Hash",
  "Game Theory",
  "Interactive",
  "Data Stream",
  "Monotonic Queue",
  "Brainteaser",
  "Doubly-Linked List",
  "Merge Sort",
  "Randomized",
  "Counting Sort",
  "Iterator",
  "Concurrency",
  "Quickselect",
  "Suffix Array",
  "Sweep Line",
  "Probability and Statistics",
  "Minimum Spanning Tree",
  "Bucket Sort",
  "Shell",
  "Reservoir Sampling",
  "Strongly Connected Component",
  "Eulerian Circuit",
  "Radix Sort",
  "Rejection Sampling",
  "Biconnected Component",
];

const TAG_ALIASES = {
  Array: ["arrays"],
  String: ["strings"],
  "Binary Tree": ["binarytree"],
  "Hash Table": ["hashtable"],
  "Depth-First Search": ["dfs", "depth first search"],
  "Breadth-First Search": ["bfs", "breadth first search"],
  "Heap (Priority Queue)": ["heap", "priority queue", "priorityqueue"],
  "Union-Find": ["union find", "disjoint set", "disjointset"],
  "Two Pointers": ["two pointers", "two-pointer", "two pointer"],
  "Prefix Sum": ["prefixsum"],
  "Binary Indexed Tree": ["fenwick tree", "fenwicktree"],
  "Topological Sort": ["toposort", "topological"],
  "Minimum Spanning Tree": ["mst"],
  "Doubly-Linked List": ["doubly linked list", "doubly linkedlist"],
  "Strongly Connected Component": ["scc"],
};

const normalizeTag = (tag) =>
  String(tag || "")
    .trim()
    .toLowerCase();

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  const cleaned = tags
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter(Boolean);

  const seen = new Set();
  const deduped = [];
  for (const t of cleaned) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(t);
  }
  return deduped;
};

const normalizeTestcases = (tcs) => {
  if (!Array.isArray(tcs)) return [];
  return tcs
    .map((tc) => {
      const input = typeof tc?.input === "string" ? tc.input : "";
      const output = typeof tc?.output === "string" ? tc.output : "";
      return { input, output };
    })
    .filter((tc) => tc.input !== "" && tc.output !== "");
};

const normalizeConstraints = (constraints) => {
  if (Array.isArray(constraints)) {
    return constraints
      .map((c) => (typeof c === "string" ? c.trim() : ""))
      .filter(Boolean);
  }
  if (typeof constraints === "string") {
    return constraints
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
  }
  return [];
};

const validateProblemPayload = (body) => {
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  const constraints = normalizeConstraints(body?.constraints);
  const difficulty =
    typeof body?.difficulty === "string" ? body.difficulty : "";

  if (!title) return { ok: false, message: "title is required" };
  if (!description) return { ok: false, message: "description is required" };
  if (!constraints.length)
    return { ok: false, message: "constraints are required" };
  if (!difficulty) return { ok: false, message: "difficulty is required" };
  if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
    return { ok: false, message: "difficulty must be Easy, Medium, or Hard" };
  }

  const timeLimit =
    body?.timeLimit === undefined || body?.timeLimit === null
      ? undefined
      : Number(body.timeLimit);
  if (timeLimit !== undefined) {
    if (Number.isNaN(timeLimit) || timeLimit <= 0) {
      return { ok: false, message: "timeLimit must be a positive number" };
    }
  }

  return { ok: true };
};

// GET all problems (login required)
router.get("/", userAuth, async (req, res) => {
  try {
    const { difficulty, tag, search } = req.query;

    let filter = {};

    if (difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)) {
      filter.difficulty = difficulty;
    }

    if (tag) {
      filter.tags = { $in: [new RegExp(tag, "i")] };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
        { constraints: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const problems = await Problem.find(filter)
      .select("title difficulty tags acceptanceRate solvedCount")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: problems.length,
      data: problems,
    });
  } catch (error) {
    console.error("Error fetching problems:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET tag counts for Problems page (login required)
router.get("/tags", userAuth, async (req, res) => {
  try {
    const raw = await Problem.aggregate([
      { $unwind: "$tags" },
      {
        $project: {
          tagLower: { $toLower: "$tags" },
        },
      },
      {
        $group: {
          _id: "$tagLower",
          count: { $sum: 1 },
        },
      },
    ]);

    const countByLower = new Map(raw.map((r) => [r._id, r.count]));

    const data = CANONICAL_TAGS.map((canonical) => {
      const base = normalizeTag(canonical);
      const aliasList = [
        base,
        ...(TAG_ALIASES[canonical] || []).map(normalizeTag),
      ];
      const count = aliasList.reduce(
        (sum, a) => sum + (countByLower.get(a) || 0),
        0,
      );
      return { tag: canonical, count };
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching tag counts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// CREATE a problem (login required)
router.post("/", adminAuth, async (req, res) => {
  try {
    const validation = validateProblemPayload(req.body);
    if (!validation.ok) {
      return res
        .status(400)
        .json({ success: false, message: validation.message });
    }

    const problem = new Problem({
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      constraints: normalizeConstraints(req.body.constraints),
      difficulty: req.body.difficulty,
      tags: normalizeTags(req.body.tags),
      patterns: normalizeTags(req.body.patterns),
      sampleTestcases: normalizeTestcases(req.body.sampleTestcases),
      hiddenTestcases: normalizeTestcases(req.body.hiddenTestcases),
      ...(req.body.timeLimit !== undefined && req.body.timeLimit !== null
        ? { timeLimit: Number(req.body.timeLimit) }
        : {}),
    });

    const saved = await problem.save();

    return res.status(201).json({
      success: true,
      message: "Problem created",
      data: { _id: saved._id },
    });
  } catch (error) {
    console.error("Error creating problem:", error);
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message,
      });
    }
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate key error",
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error?.message || String(error),
    });
  }
});

// BULK create problems (login required)
router.post("/bulk", adminAuth, async (req, res) => {
  try {
    const items = Array.isArray(req.body?.problems) ? req.body.problems : [];
    if (items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "problems array is required" });
    }

    const docs = [];
    for (let i = 0; i < items.length; i++) {
      const v = validateProblemPayload(items[i]);
      if (!v.ok) {
        return res.status(400).json({
          success: false,
          message: `problems[${i}]: ${v.message}`,
        });
      }
      docs.push({
        title: items[i].title.trim(),
        description: items[i].description.trim(),
        constraints: normalizeConstraints(items[i].constraints),
        difficulty: items[i].difficulty,
        tags: normalizeTags(items[i].tags),
        patterns: normalizeTags(items[i].patterns),
        sampleTestcases: normalizeTestcases(items[i].sampleTestcases),
        hiddenTestcases: normalizeTestcases(items[i].hiddenTestcases),
        ...(items[i].timeLimit !== undefined && items[i].timeLimit !== null
          ? { timeLimit: Number(items[i].timeLimit) }
          : {}),
      });
    }

    const inserted = await Problem.insertMany(docs, { ordered: true });

    return res.status(201).json({
      success: true,
      message: "Problems created",
      count: inserted.length,
      data: inserted.map((p) => ({ _id: p._id })),
    });
  } catch (error) {
    console.error("Error bulk creating problems:", error);
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message,
      });
    }
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate key error",
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error?.message || String(error),
    });
  }
});

// Helpful message if someone hits /bulk with GET in Postman/browser
router.get("/bulk", userAuth, async (req, res) => {
  return res.status(405).json({
    success: false,
    message: "Method not allowed. Use POST /problems/bulk to insert in bulk.",
  });
});

// GET /problems/:id/my-submissions?limit=20
// Returns the authenticated user's submissions for this problem (includes sourceCode) + basic stats.
router.get("/:id/my-submissions", userAuth, async (req, res) => {
  try {
    const problemId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid problem id" });
    }

    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 50)
      : 20;

    const [totalSubmissions, acceptedSubmissions, verdictAgg, langAgg, submissions] =
      await Promise.all([
        Submission.countDocuments({ userId: req.user._id, problemId }),
        Submission.countDocuments({
          userId: req.user._id,
          problemId,
          verdict: "Accepted",
        }),
        Submission.aggregate([
          { $match: { userId: req.user._id, problemId: new mongoose.Types.ObjectId(problemId) } },
          { $group: { _id: "$verdict", count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ]),
        Submission.aggregate([
          { $match: { userId: req.user._id, problemId: new mongoose.Types.ObjectId(problemId) } },
          { $group: { _id: "$languageId", count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ]),
        Submission.find({ userId: req.user._id, problemId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .select(
            "verdict languageId runtime passedTestcases totalTestcases sourceCode createdAt",
          )
          .lean(),
      ]);

    const acceptanceRate = totalSubmissions
      ? Math.round((acceptedSubmissions / totalSubmissions) * 1000) / 10
      : 0;

    const verdictCounts = {};
    for (const v of verdictAgg || []) {
      if (v && v._id) verdictCounts[v._id] = v.count;
    }

    const languageCounts = (langAgg || []).map((l) => ({
      languageId: l._id,
      count: l.count,
    }));

    return res.json({
      success: true,
      problemId,
      stats: {
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate,
        verdictCounts,
        languageCounts,
      },
      submissions,
    });
  } catch (error) {
    console.error("Error fetching my submissions:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /problems/:id/similar?limit=6
// Returns similar problems based on tag/pattern overlap, with an upsolving bias.
router.get("/:id/similar", userAuth, async (req, res) => {
  try {
    const problemId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid problem id" });
    }

    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 12)
      : 6;

    const baseProblem = await Problem.findById(problemId)
      .select("difficulty tags patterns title")
      .lean();
    if (!baseProblem) {
      return res
        .status(404)
        .json({ success: false, message: "Problem not found" });
    }

    const difficultyRankByName = { Easy: 0, Medium: 1, Hard: 2 };
    const baseRank = difficultyRankByName[baseProblem.difficulty] ?? 0;
    // Upsolving bias:
    // - Easy -> recommend Medium/Hard
    // - Medium -> recommend Medium/Hard
    // - Hard -> recommend Hard
    const minRecommendedRank = baseRank === 0 ? 1 : baseRank;

    const baseTags = Array.isArray(baseProblem.tags)
      ? baseProblem.tags
          .map((t) => (typeof t === "string" ? t.trim() : ""))
          .filter(Boolean)
      : [];

    const basePatterns = Array.isArray(baseProblem.patterns)
      ? baseProblem.patterns
          .map((t) => (typeof t === "string" ? t.trim() : ""))
          .filter(Boolean)
      : [];

    const baseLabelsLower = Array.from(
      new Set([...baseTags, ...basePatterns].map((t) => t.toLowerCase())),
    );

    // If tags/patterns are empty, fall back to recommending harder (and then same) problems.
    if (baseLabelsLower.length === 0) {
      const allowedDifficulties =
        minRecommendedRank >= 2 ? ["Hard"] : ["Medium", "Hard"];

      const harderFirst = await Problem.find({
        _id: { $ne: problemId },
        difficulty: { $in: allowedDifficulties },
      })
        .select("title difficulty tags patterns")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return res.json({
        success: true,
        base: {
          _id: baseProblem._id,
          title: baseProblem.title,
          difficulty: baseProblem.difficulty,
          tags: baseProblem.tags || [],
          patterns: baseProblem.patterns || [],
        },
        data: (harderFirst || []).map((p) => ({
          _id: p._id,
          title: p.title,
          difficulty: p.difficulty,
          tags: p.tags || [],
          patterns: p.patterns || [],
          sharedTags: [],
          tagOverlap: 0,
          upsolveDelta:
            (difficultyRankByName[p.difficulty] ?? 0) - (baseRank ?? 0),
        })),
      });
    }

    const difficultyRankSwitch = {
      $switch: {
        branches: [
          { case: { $eq: ["$difficulty", "Easy"] }, then: 0 },
          { case: { $eq: ["$difficulty", "Medium"] }, then: 1 },
          { case: { $eq: ["$difficulty", "Hard"] }, then: 2 },
        ],
        default: 0,
      },
    };

    const pipeline = [
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(problemId) },
        },
      },
      {
        $addFields: {
          __tagsLower: {
            $map: {
              input: {
                $concatArrays: [
                  { $ifNull: ["$tags", []] },
                  { $ifNull: ["$patterns", []] },
                ],
              },
              as: "t",
              in: {
                $toLower: {
                  $trim: {
                    input: { $toString: "$$t" },
                  },
                },
              },
            },
          },
          __difficultyRank: difficultyRankSwitch,
        },
      },
      // Keep recommendations at the same difficulty or harder.
      { $match: { __difficultyRank: { $gte: minRecommendedRank } } },
      {
        $addFields: {
          __sharedTags: {
            $setIntersection: ["$__tagsLower", baseLabelsLower],
          },
          __upsolveDelta: { $subtract: ["$__difficultyRank", baseRank] },
        },
      },
      {
        $addFields: {
          __tagOverlap: { $size: { $ifNull: ["$__sharedTags", []] } },
          __upsolveBoost: {
            $cond: [
              { $gt: ["$__upsolveDelta", 0] },
              3,
              {
                $cond: [{ $eq: ["$__upsolveDelta", 0] }, 1, 0],
              },
            ],
          },
        },
      },
      // Require at least 1 shared tag/pattern to keep recommendations relevant.
      { $match: { __tagOverlap: { $gt: 0 } } },
      {
        $addFields: {
          __similarityScore: {
            $add: [
              { $multiply: ["$__tagOverlap", 10] },
              "$__upsolveBoost",
            ],
          },
        },
      },
      {
        $sort: {
          __similarityScore: -1,
          __tagOverlap: -1,
          __upsolveDelta: -1,
          createdAt: -1,
        },
      },
      { $limit: limit },
      {
        $project: {
          title: 1,
          difficulty: 1,
          tags: 1,
          patterns: 1,
          sharedTags: "$__sharedTags",
          tagOverlap: "$__tagOverlap",
          upsolveDelta: "$__upsolveDelta",
        },
      },
    ];

    const recommendations = await Problem.aggregate(pipeline);

    return res.json({
      success: true,
      base: {
        _id: baseProblem._id,
        title: baseProblem.title,
        difficulty: baseProblem.difficulty,
        tags: baseProblem.tags || [],
        patterns: baseProblem.patterns || [],
      },
      data: recommendations || [],
    });
  } catch (error) {
    console.error("Error fetching similar problems:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET single problem by ID (login required)
router.get("/:id", userAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid problem id" });
    }
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res
        .status(404)
        .json({ success: false, message: "Problem not found" });
    }

    // Send problem data WITHOUT hidden testcases
    const { hiddenTestcases, ...problemData } = problem.toObject();

    res.json({
      success: true,
      data: problemData,
    });
  } catch (error) {
    console.error("Error fetching problem:", error);
    if (error?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid problem id",
        error: error.message,
      });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
