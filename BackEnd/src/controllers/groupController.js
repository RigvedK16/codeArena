const Group = require('../models/group'); // Adjust path to your Group model

// ... keep your existing createGroup function here ...

// ADD THIS NEW FUNCTION
exports.getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Find groups where the 'participants.user' field matches the logged-in user
    // 2. Sort by newest first (-1)
    // 3. Populate the 'admin' field to get their names
    const groups = await Group.find({ 
      "participants.user": userId 
    })
    .sort({ createdAt: -1 })
    .populate('admin', 'firstName lastName emailId');

    res.status(200).json({
      success: true,
      count: groups.length,
      groups: groups
    });

  } catch (error) {
    console.error("Error fetching my groups:", error);
    res.status(500).json({
      success: false,
      message: "Server Error fetching groups"
    });
  }
};