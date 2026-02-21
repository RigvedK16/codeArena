/*
Usage:
  npm run contest:live -- <contestId>

Sets:
  startTime = now - 30 minutes
  endTime   = now + 120 minutes

This makes the contest "Live" for frontend helpers that do:
  new Date(contest.startTime/endTime).getTime()
*/

const mongoose = require("mongoose");
const connectDB = require("../config/databse");
const Contest = require("../models/contest");

async function main() {
  const contestId = process.argv[2];
  if (!contestId) {
    console.error("Missing contestId. Example: npm run contest:live -- <contestId>");
    process.exit(1);
  }

  if (!mongoose.isValidObjectId(contestId)) {
    console.error("Invalid contestId (not a valid Mongo ObjectId):", contestId);
    process.exit(1);
  }

  await connectDB();

  const startTime = new Date(Date.now() - 30 * 60000);
  const endTime = new Date(Date.now() + 120 * 60000);

  const updated = await Contest.findByIdAndUpdate(
    contestId,
    { $set: { startTime, endTime } },
    { new: true }
  ).select("title startTime endTime");

  if (!updated) {
    console.error("Contest not found:", contestId);
    process.exit(1);
  }

  console.log("Updated contest times:");
  console.log({
    _id: String(updated._id),
    title: updated.title,
    startTime: updated.startTime,
    endTime: updated.endTime,
    startTimeISO: updated.startTime?.toISOString?.(),
    endTimeISO: updated.endTime?.toISOString?.(),
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to set contest Live:", err);
    process.exit(1);
  });
