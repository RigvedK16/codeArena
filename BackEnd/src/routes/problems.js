// routes/problems.js
const express = require("express");
const router = express.Router();
const Problem = require("../models/problem");
const { userAuth } = require("../middleware/adminAuth");

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

// GET single problem by ID (login required)
router.get("/:id", userAuth, async (req, res) => {
  try {
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
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
