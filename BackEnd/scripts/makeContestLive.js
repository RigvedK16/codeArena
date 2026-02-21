const connectDB = require("../src/config/databse");
const Contest = require("../src/models/contest");

async function main() {
  const contestId = process.argv[2];
  if (!contestId) {
    console.error("Usage: node scripts/makeContestLive.js <contestId>");
    process.exit(1);
  }

  await connectDB();

  const now = new Date();
  const startTime = new Date(now.getTime() - 5 * 60 * 1000);
  const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const updated = await Contest.findByIdAndUpdate(
    contestId,
    { $set: { startTime, endTime } },
    { new: true }
  ).lean();

  if (!updated) {
    console.error("Contest not found:", contestId);
    process.exit(1);
  }

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
