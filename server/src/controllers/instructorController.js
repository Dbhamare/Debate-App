const Debate = require("../models/Debate");
const Message = require("../models/Message");
const User = require("../models/User");
const Sentiment = require("sentiment");
const sentiment = new Sentiment();

function isInstructor(user) {
  return !!(user && user.role === 'instructor');
}

function canManageDebate(user, debate) {
  if (!user || !debate) return false;
  return isInstructor(user) && String(debate.instructor) === String(user.userID);
}

exports.createDebate = async (req, res) => {
  try {
    const { title, topic, description, rules, isPublic, sides, startTime, endTime } = req.body;

    if (!title || !description || !rules) {
      return res.status(400).json({ message: "Title, description, and rules are required." });
    }
    if (!isInstructor(req.user)) {
      return res.status(403).json({ message: "Only instructors can create debates." });
    }

    const joinCode = Math.floor(100000 + Math.random() * 900000);

    console.log("🟢 createDebate -> req.user:", req.user);

    const debate = await Debate.create({
      title,
      topic,
      description,
      rules,
      isPublic: isPublic || false,

      instructor: req.user.userID || req.user.userId || req.user._id,

      sides: sides && sides.length > 0 ? sides : [
        { name: "proponent", participants: [] },
        { name: "opponent", participants: [] },
        { name: "neutral", participants: [] }
      ],
      joincode: joinCode,
      status: "upcoming",
      startTime,
      endTime
    });

    res.status(201).json(debate);
  } catch (err) {
    console.error("Error creating debate:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.updateDebate = async (req, res) => {
  try {
    const current = await Debate.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Debate not found" });
    if (!canManageDebate(req.user, current)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const debate = await Debate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!debate) return res.status(404).json({ message: "Debate not found" });

    res.json(debate);
  } catch (err) {
    console.error("Error updating debate:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDebate = async (req, res) => {
  try {
    const current = await Debate.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Debate not found" });
    if (!canManageDebate(req.user, current)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const debate = await Debate.findByIdAndDelete(req.params.id);
    if (!debate) return res.status(404).json({ message: "Debate not found" });

    res.json({ message: "Debate deleted successfully" });
  } catch (err) {
    console.error("Error deleting debate:", err);
    res.status(500).json({ error: err.message });
  }
};



exports.getDebateAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const debate = await Debate.findById(id);
    if (!debate) return res.status(404).json({ message: "Debate not found" });
    if (!canManageDebate(req.user, debate)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const messages = await Message.find({ joincode: debate.joincode });

    const counts = { proponent: 0, opponent: 0, neutral: 0 };
    const sentimentScores = { proponent: [], opponent: [], neutral: [] };

    messages.forEach(msg => {
      const side = msg.side || "neutral";
      counts[side]++;
      sentimentScores[side].push(sentiment.analyze(msg.content).score);
    });

    const sentimentAverages = {};
    for (const side in sentimentScores) {
      const scores = sentimentScores[side];
      sentimentAverages[side] = scores.length
        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
        : 0;
    }

    res.json({ counts, sentiment: sentimentAverages });
  } catch (err) {
    console.error("Error fetching debate analytics:", err);
    res.status(500).json({ error: err.message });
  }
};
