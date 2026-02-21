const connectDB = require("../src/config/databse");
const Contest = require("../src/models/contest");

async function main() {
  const rawTitle = process.argv.slice(2).join(" ").trim();
  if (!rawTitle) {
    console.error("Usage: node scripts/makeContestLiveByTitle.js <contest title>");
    process.exit(1);
  }

  await connectDB();

  let contest = await Contest.findOne({ title: rawTitle });
  if (!contest) {
    const regex = new RegExp(`^${rawTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    contest = await Contest.findOne({ title: { $regex: regex } });
  }

  if (!contest) {
    const partial = new RegExp(rawTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const matches = await Contest.find({ title: { $regex: partial } })
      .select("_id title startTime endTime")
      .limit(10)
      .lean();

    if (!matches.length) {
      console.error("Contest not found by title:", rawTitle);
      process.exit(1);
    }

    console.error("No exact match. Did you mean one of these?");
    for (const m of matches) {
      console.error(`- ${m._id} :: ${m.title}`);
    }
    process.exit(1);
  }

  const now = new Date();
  const startTime = new Date(now.getTime() - 5 * 60 * 1000);
  const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const updated = await Contest.findByIdAndUpdate(
    contest._id,
    { $set: { startTime, endTime } },
    { new: true }
  ).lean();

  console.log("Updated contest timings:");
  console.log({
    _id: String(updated._id),
    title: updated.title,
    startTime: updated.startTime,
    endTime: updated.endTime,
  });

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
