const User = require("../models/User");
const Debate = require("../models/Debate");
const Message = require("../models/Message");
const Vote = require("../models/Vote");

async function getNextAvailableID(role) {
  const users = await User.find({ role }).sort({ userID: 1 });
  const start = role === "student" ? 1 : 501;
  const end   = role === "student" ? 200 : 600;

  for (let i = start; i <= end; i++) {
    if (!users.find(u => Number(u.userID) === i)) return i;
  }
  return null;
}

async function generateStudentIDs(req, res) {
  try {
    const newID = await getNextAvailableID("student");
    if (!newID) {
      return res.status(400).json({ message: "No Student IDs available (001–200 all used)." });
    }
    res.json({ message: "Next available Student ID", userID: newID });
  } catch (err) {
    console.error("Error generating student ID:", err);
    res.status(500).json({ error: err.message });
  }
}

async function generateInstructorIDs(req, res) {
  try {
    const newID = await getNextAvailableID("instructor");
    if (!newID) {
      return res.status(400).json({ message: "No Instructor IDs available (501–600 all used)." });
    }
    res.json({ message: "Next available Instructor ID", userID: newID });
  } catch (err) {
    console.error("Error generating instructor ID:", err);
    res.status(500).json({ error: err.message });
  }
}

async function resetID(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const newID = await getNextAvailableID(user.role);
    if (!newID) {
      return res.status(400).json({ message: `No IDs available for role: ${user.role}` });
    }

    user.userID = newID;
    await user.save();
    res.json({ message: `ID reset successfully. New ID: ${newID}`, userID: newID });
  } catch (err) {
    console.error("Error resetting ID:", err);
    res.status(500).json({ error: err.message });
  }
}

async function getUserProfile(req, res) {
  try {
    const user = await User.findById(req.params.id).select("-password -passwordHash").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    const messageCount = await Message.countDocuments({ senderID: user.userID });
    res.json({
      user,
      stats: { messageCount },
    });
  } catch (err) {
    console.error("getUserProfile error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
}

async function setUserID(req, res) {
  try {
    const { userID } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!/^\d{3}$/.test(String(userID))) {
      return res.status(400).json({ message: "userID must be a 3-digit string" });
    }
    const numericUserID = Number(userID);

    const taken = await User.findOne({ userID: numericUserID, _id: { $ne: user._id } });
    if (taken) return res.status(409).json({ message: "This ID is already in use" });

    user.userID = numericUserID;
    await user.save();
    res.json({ message: "User ID updated", userID: String(user.userID).padStart(3, "0") });
  } catch (err) {
    console.error("setUserID error:", err);
    res.status(500).json({ message: "Failed to update user ID" });
  }
}

async function deleteUserMessages(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("userID");
    if (!user) return res.status(404).json({ message: "User not found" });

    const r = await Message.deleteMany({ senderID: user.userID });
    const deletedCount = r.deletedCount || 0;
    res.json({ message: "Messages deleted", deleted: deletedCount, deletedCount });
  } catch (err) {
    console.error("deleteUserMessages error:", err);
    res.status(500).json({ message: "Failed to delete messages" });
  }
}

async function getDebateDetails(req, res) {
  try {
    const joincode = Number(req.params.joincode);
    const debate = await Debate.findOne({ joincode }).lean();
    if (!debate) return res.status(404).json({ message: "Debate not found" });

    const [messagesCount, proponentVotes, opponentVotes, instructor] = await Promise.all([
      Message.countDocuments({ joincode }),
      Vote.countDocuments({ joincode, side: "proponent" }),
      Vote.countDocuments({ joincode, side: "opponent" }),
      User.findOne({ userID: Number(debate.instructor) })
        .select("userID name email role")
        .lean(),
    ]);

    const participantIDs = [...new Set((debate.sides || []).flatMap((s) => s.participants || []))];
    const participantRows = await User.find(
      { userID: { $in: participantIDs } },
      { _id: 0, userID: 1, name: 1, email: 1, role: 1 }
    ).lean();
    const byId = new Map(participantRows.map((u) => [Number(u.userID), u]));

    const participants = (debate.sides || []).map((s) => ({
      side: s.name,
      participants: (s.participants || [])
        .map((uid) => byId.get(Number(uid)))
        .filter(Boolean),
    }));

    let winner = "draw";
    if (proponentVotes > opponentVotes) winner = "proponent";
    else if (opponentVotes > proponentVotes) winner = "opponent";

    res.json({
      joincode: debate.joincode,
      title: debate.title,
      status: debate.status,
      instructor: instructor || null,
      isPublic: debate.isPublic,
      createdAt: debate.createdAt,
      participants,
      votes: {
        proponent: proponentVotes,
        opponent: opponentVotes,
      },
      winner,
      totalMessages: messagesCount,
    });
  } catch (err) {
    console.error("getDebateDetails error:", err);
    res.status(500).json({ message: "Failed to fetch debate details" });
  }
}

async function getDebateMessages(req, res) {
  try {
    const joincode = Number(req.params.joincode);
    const rows = await Message.find({ joincode }).sort({ createdAt: 1 }).lean();
    res.json(rows);
  } catch (err) {
    console.error("getDebateMessages error:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
}

async function deleteDebate(req, res) {
  try {
    const joincode = Number(req.params.joincode);
    await Promise.all([
      Message.deleteMany({ joincode }),
      Vote.deleteMany({ joincode }),
    ]);
    const r = await Debate.deleteOne({ joincode });
    if (r.deletedCount === 0) return res.status(404).json({ message: "Debate not found" });
    res.json({ message: "Debate deleted" });
  } catch (err) {
    console.error("deleteDebate error:", err);
    res.status(500).json({ message: "Failed to delete debate" });
  }
}

module.exports = {
  generateStudentIDs,
  generateInstructorIDs,
  resetID,
  getUserProfile,
  setUserID,
  deleteUserMessages,
  getDebateDetails,
  getDebateMessages,
  deleteDebate,
};
