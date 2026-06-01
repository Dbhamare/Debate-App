const Debate = require('../models/Debate');
const User = require('../models/User');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();
const Message = require('../models/Message');
const Vote = require('../models/Vote');

async function getAuthUser(req) {
  const payload = req.user || {};
  let u = null;
  if (payload.userId) {
    try { u = await User.findById(payload.userId).select('userID role name email'); } catch {}
  }
  if (!u && payload.userID) u = await User.findOne({ userID: payload.userID }).select('userID role name email');
  if (!u && payload.email)  u = await User.findOne({ email: payload.email }).select('userID role name email');
  return u;
}

function isInstructorOwner(debate, user) {
  return !!(
    debate &&
    user &&
    user.role === 'instructor' &&
    String(debate.instructor) === String(user.userID)
  );
}

function isAdmin(user) {
  return !!(user && user.role === 'admin');
}

function isAssignedParticipant(debate, user) {
  if (!debate || !user) return false;
  return (debate.sides || []).some((s) => (s.participants || []).includes(Number(user.userID)));
}

function canViewDebate(debate, user) {
  if (!debate) return false;
  if (debate.isPublic) return true;
  return isAdmin(user) || isInstructorOwner(debate, user) || isAssignedParticipant(debate, user);
}

function canManageDebate(debate, user) {
  return isInstructorOwner(debate, user);
}

exports.getAllDebates = async (req, res) => {
  try {
    const debates = await Debate.find({ instructor: req.user.userID }).sort({ createdAt: -1 });
    res.json(debates);
  } catch (err) {
    console.error("Error fetching debates:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDebateByJoincode = async (req, res) => {
  try {
    const debate = await Debate.findOne({ joincode: req.params.joincode });
    if (!debate) return res.status(404).json({ message: "Debate not found" });
    const authUser = await getAuthUser(req);
    if (!canViewDebate(debate, authUser)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(debate);
  } catch (err) {
    console.error("Error fetching debate:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createDebate = async (req, res) => {
  try {
    const { title, topic, rules, description, sides, isPublic, startTime, endTime } = req.body;

    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'instructor') {
      return res.status(403).json({ message: "Only instructors can create debates." });
    }

    if (!title || !topic || !description) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    const joinCode = Math.floor(100000 + Math.random() * 900000);

    const debate = await Debate.create({
      title,
      topic,
      rules,
      description,
      instructor: Number(authUser.userID),
      sides,
      status: 'upcoming',
      joincode: joinCode,
      isPublic: isPublic || false,
      startTime,
      endTime
    });
    console.log('createDebate -> req.user:', req.user);
    res.status(201).json(debate);
  } catch (err) {
    console.error("Error creating debate:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPublicDebates = async (req, res) => {
  try {
    const debates = await Debate.find({ isPublic: true }).sort({ createdAt: -1 });
    res.json(debates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPublicDebateByJoincode = async (req, res) => {
  try {
    const debate = await Debate.findOne({ joincode: req.params.joincode, isPublic: true });
    if (!debate) return res.status(404).json({ message: "Debate not found or not public" });
    res.json(debate);
  } catch (err) {
    console.error("Error fetching public debate:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const debate = await Debate.findOne({ joincode: req.params.joincode });
    if (!debate) return res.status(404).json({ message: "Debate not found" });
    const authUser = await getAuthUser(req);
    if (!canManageDebate(debate, authUser)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const nextStatus = String(req.body?.status || '');
    if (!['upcoming', 'active', 'closed'].includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    debate.status = nextStatus;
    await debate.save();

    const io = req.app.get('io');
    if (io) io.to(`debate:${debate.joincode}`).emit(`statusUpdated:${debate.joincode}`, { status: nextStatus });

    res.json({ message: "Debate status updated", debate });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ message: "Error updating debate status" });
  }
};

exports.assignStudent = async (req, res) => {
  try {
    const { studentId, side } = req.body;

    const debate = await Debate.findOne({ joincode: req.params.joincode });
    if (!debate) return res.status(404).json({ message: "Debate not found" });
    const authUser = await getAuthUser(req);
    if (!canManageDebate(debate, authUser)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const student = await User.findOne({ userID: studentId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    debate.sides.forEach(s => {
      s.participants = s.participants.filter(p => p !== studentId);
    });

    const sideObj = debate.sides.find(s => s.name === side);
    if (!sideObj) return res.status(400).json({ message: "Invalid side" });

    sideObj.participants.push(studentId);

    await debate.save();

    res.json({ message: "Student assigned successfully", debate });
  } catch (err) {
    console.error("Error assigning student:", err);
    res.status(500).json({ message: "Error assigning student" });
  }
};

exports.getAssignedDebates = async (req, res) => {
  try {
    const userID = req.user.userID;
    const debates = await Debate.find({
      $or: [
        { isPublic: true },
        { 'sides.participants': userID }
      ]
    }).sort({ createdAt: -1 });
    res.json(debates);
  } catch (err) {
    console.error("Error fetching assigned debates:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const debate = await Debate.findOne({ joincode: req.params.joincode });
    if (!debate) return res.status(404).json({ message: "Debate not found" });

    const analytics = {
      totalMessages: debate.messages?.length || 0,
      sideBreakdown: {
        proponent: debate.messages?.filter(m => m.side === 'proponent').length || 0,
        opponent: debate.messages?.filter(m => m.side === 'opponent').length || 0,
        neutral: debate.messages?.filter(m => m.side === 'neutral').length || 0
      },
      studentAssignments: debate.sides.map(s => ({
        side: s.name,
        students: s.participants
      }))
    };

    res.json(analytics);
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ message: "Error fetching analytics" });
  }
};

exports.assignStudentsBulk = async (req, res) => {
  try {
    const { joincode } = req.params;
    const { assignments = [] } = req.body;

    const debate = await Debate.findOne({ joincode: Number(joincode) });
    if (!debate) return res.status(404).json({ message: "Debate not found" });
    const authUser = await getAuthUser(req);
    if (!canManageDebate(debate, authUser)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const requested = new Map();
    for (const a of assignments) {
      if (!a || typeof a.userID !== 'number') continue;
      if (!['proponent', 'opponent', 'neutral'].includes(a.side)) continue;
      requested.set(a.userID, a.side);
    }

    debate.sides.forEach(s => {
      s.participants = s.participants.filter(uid => !requested.has(uid));
    });

    debate.sides.forEach(s => {
      for (const [uid, side] of requested.entries()) {
        if (s.name === side && !s.participants.includes(uid)) {
          s.participants.push(uid);
        }
      }
    });

    await debate.save();
    res.json({ message: "Bulk assignment complete", debate });
  } catch (err) {
    console.error("Error in assignStudentsBulk:", err);
    res.status(500).json({ message: "Error assigning students in bulk" });
  }
};

exports.removeStudentFromDebate = async (req, res) => {
  try {
    const { joincode, userID } = req.params;
    const debate = await Debate.findOne({ joincode: Number(joincode) });
    if (!debate) return res.status(404).json({ message: "Debate not found" });
    const authUser = await getAuthUser(req);
    if (!canManageDebate(debate, authUser)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    let changed = false;
    debate.sides.forEach(s => {
      const before = s.participants.length;
      s.participants = s.participants.filter(uid => uid !== Number(userID));
      if (s.participants.length !== before) changed = true;
    });

    if (changed) await debate.save();
    res.json({ message: "User removed from debate", debate });
  } catch (err) {
    console.error("Error removing user from debate:", err);
    res.status(500).json({ message: "Error removing user" });
  }
};

exports.deleteDebateByJoincode = async (req, res) => {
  try {
    const joincode = Number(req.params.joincode);
    if (!Number.isFinite(joincode)) {
      return res.status(400).json({ message: "Invalid joincode" });
    }

    const debate = await Debate.findOne({ joincode });
    if (!debate) return res.status(404).json({ message: "Debate not found" });

    const authUser = await getAuthUser(req);
    if (!canManageDebate(debate, authUser)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Promise.all([
      Message.deleteMany({ joincode }),
      Vote.deleteMany({ joincode }),
      Debate.deleteOne({ joincode }),
    ]);

    return res.json({ message: "Debate deleted" });
  } catch (err) {
    console.error("Error deleting debate:", err);
    return res.status(500).json({ message: "Error deleting debate" });
  }
};

async function assertInstructorOwner(req, joincode) {
  const debate = await Debate.findOne({ joincode: Number(joincode) });
  if (!debate) return { error: { code: 404, msg: 'Debate not found' } };
  if (String(debate.instructor) !== String(req.user.userID)) {
    return { error: { code: 403, msg: 'Only the instructor can perform this action' } };
  }
  return { debate };
}

exports.startDebate = async (req, res) => {
  try {
    const { joincode } = req.params;
    const { debate, error } = await assertInstructorOwner(req, joincode);
    if (error) return res.status(error.code).json({ message: error.msg });

    if (debate.status === 'active') return res.json({ message: 'Already active', debate });
    debate.status = 'active';
    await debate.save();

    const io = req.app.get('io');
    if (io) io.to(`debate:${joincode}`).emit(`statusUpdated:${joincode}`, { status: 'active' });

    res.json({ message: 'Debate started', debate });
  } catch (err) {
    console.error('startDebate error:', err);
    res.status(500).json({ message: 'Failed to start debate' });
  }
};

exports.stopDebate = async (req, res) => {
  try {
    const { joincode } = req.params;
    const { debate, error } = await assertInstructorOwner(req, joincode);
    if (error) return res.status(error.code).json({ message: error.msg });

    if (debate.status === 'closed') return res.json({ message: 'Already closed', debate });
    debate.status = 'closed';
    await debate.save();

    const io = req.app.get('io');
    if (io) io.to(`debate:${joincode}`).emit(`statusUpdated:${joincode}`, { status: 'closed' });

    res.json({ message: 'Debate stopped', debate });
  } catch (err) {
    console.error('stopDebate error:', err);
    res.status(500).json({ message: 'Failed to stop debate' });
  }
};

const SCORE = { like: +1, dislike: -1, upvote: +2, downvote: -2 };

exports.getResults = async (req, res) => {
  try {
    const { joincode } = req.params;
    const jc = Number(joincode);
    const debate = await Debate.findOne({ joincode: jc });
    if (!debate) return res.status(404).json({ message: 'Debate not found' });
    const authUser = await getAuthUser(req);
    if (!canViewDebate(debate, authUser)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const msgs = await Message.find({ joincode: jc });

    const tallies = {
      proponent: { likes: 0, dislikes: 0, upvotes: 0, downvotes: 0, points: 0 },
      opponent:  { likes: 0, dislikes: 0, upvotes: 0, downvotes: 0, points: 0 },
      neutral:   { likes: 0, dislikes: 0, upvotes: 0, downvotes: 0, points: 0 },
    };

    let mostLiked = null, mostDisliked = null, mostUpvoted = null, mostDownvoted = null;

    msgs.forEach(m => {
      const likes = (m.likes || []).length;
      const dislikes = (m.dislikes || []).length;
      const upvotes = (m.upvotes || []).length;
      const downvotes = (m.downvotes || []).length;

      const s = m.side;
      if (!tallies[s]) return;

      tallies[s].likes += likes;
      tallies[s].dislikes += dislikes;
      tallies[s].upvotes += upvotes;
      tallies[s].downvotes += downvotes;
      tallies[s].points += (
        likes * SCORE.like +
        dislikes * SCORE.dislike +
        upvotes * SCORE.upvote +
        downvotes * SCORE.downvote
      );

      if (!mostLiked || likes > (mostLiked.likes || 0))                 mostLiked = { ...m.toObject(), likes };
      if (!mostDisliked || dislikes > (mostDisliked.dislikes || 0))     mostDisliked = { ...m.toObject(), dislikes };
      if (!mostUpvoted || upvotes > (mostUpvoted.upvotes || 0))         mostUpvoted = { ...m.toObject(), upvotes };
      if (!mostDownvoted || downvotes > (mostDownvoted.downvotes || 0)) mostDownvoted = { ...m.toObject(), downvotes };
    });

    const [vp, vo] = await Promise.all([
      Vote.countDocuments({ joincode: jc, side: 'proponent' }),
      Vote.countDocuments({ joincode: jc, side: 'opponent' }),
    ]);
    const votes = { proponent: vp, opponent: vo };

    let winner = 'draw';
    if (vp > vo) winner = 'proponent';
    else if (vo > vp) winner = 'opponent';

    return res.json({
      status: debate.status,
      tallies,
      votes,
      winner,
      mostLiked,
      mostDisliked,
      mostUpvoted,
      mostDownvoted
    });
  } catch (err) {
    console.error('getResults error:', err);
    res.status(500).json({ message: 'Failed to compute results' });
  }
};

exports.getVotes = async (req, res) => {
  try {
    const jc = Number(req.params.joincode);
    if (!Number.isFinite(jc)) return res.status(400).json({ message: 'Invalid joincode' });
    const debate = await Debate.findOne({ joincode: jc });
    if (!debate) return res.status(404).json({ message: 'Debate not found' });

    const authUser = await getAuthUser(req);
    if (!canViewDebate(debate, authUser)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const [proponent, opponent] = await Promise.all([
      Vote.countDocuments({ joincode: jc, side: 'proponent' }),
      Vote.countDocuments({ joincode: jc, side: 'opponent' }),
    ]);

    let my = null;
    if (authUser) {
      const v = await Vote.findOne({ joincode: jc, userID: authUser.userID });
      my = v ? v.side : null;
    }

    res.json({ proponent, opponent, my });
  } catch (e) {
    console.error('votes fetch error:', e);
    res.status(500).json({ message: 'Failed to fetch votes' });
  }
};

exports.castVote = async (req, res) => {
  try {
    const jc = Number(req.params.joincode);
    const { side } = req.body || {};
    if (!Number.isFinite(jc)) return res.status(400).json({ message: 'Invalid joincode' });
    if (side !== 'proponent' && side !== 'opponent') {
      return res.status(400).json({ message: 'Invalid side' });
    }

    const debate = await Debate.findOne({ joincode: jc });
    if (!debate) return res.status(404).json({ message: 'Debate not found' });
    if (debate.status !== 'active') {
      return res.status(403).json({ message: 'Voting is allowed only while debate is active' });
    }

    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ message: 'User not found' });
    if (!canViewDebate(debate, authUser)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await Vote.findOneAndUpdate(
      { joincode: jc, userID: authUser.userID },
      { $set: { side } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const [proponent, opponent] = await Promise.all([
      Vote.countDocuments({ joincode: jc, side: 'proponent' }),
      Vote.countDocuments({ joincode: jc, side: 'opponent' }),
    ]);

    const io = req.app.get('io');
    if (io) io.to(`debate:${jc}`).emit(`voteUpdated:${jc}`, { proponent, opponent });

    res.json({ ok: true, proponent, opponent, my: side });
  } catch (e) {
    console.error('vote cast error:', e);
    res.status(500).json({ message: 'Failed to cast vote' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const jc = Number(req.params.joincode);
    if (!Number.isFinite(jc)) return res.status(400).json({ message: 'Invalid joincode' });

    const debate = await Debate.findOne({ joincode: jc }).lean();
    if (!debate) return res.status(404).json({ message: 'Debate not found' });

    let viewer = null;
    if (req.user?.userId) {
      viewer = await User.findById(req.user.userId).select('userID role name email').lean();
    }
    if (!viewer && req.user?.userID) {
      viewer = await User.findOne({ userID: req.user.userID }).select('userID role name email').lean();
    }
    if (!viewer) return res.status(401).json({ message: 'Unauthorized' });

    const isOwner =
      viewer.role === 'instructor' && String(debate.instructor) === String(viewer.userID);
    const isAdmin = viewer.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const msgs = await Message.find({ joincode: jc })
      .select('side content createdAt likes dislikes upvotes downvotes senderID senderName replyTo')
      .lean();

    const sides = ['proponent', 'opponent', 'neutral'];
    const perSide = {};
    for (const s of sides) {
      perSide[s] = {
        messages: 0,
        likes: 0,
        dislikes: 0,
        upvotes: 0,
        downvotes: 0,
        sentimentSum: 0,
        sentimentCount: 0,
        sentimentAvg: 0,
      };
    }

    const perUser = {}; 
    const timelineMap = {};
    const toMinuteIso = (d) => {
      const t = new Date(d);
      t.setSeconds(0, 0);
      return t.toISOString();
    };

    let mostLiked = null,
      mostDisliked = null,
      mostUpvoted = null,
      mostDownvoted = null;

    for (const m of msgs) {
      if (!sides.includes(m.side)) continue;
      const likes = (m.likes || []).length;
      const dislikes = (m.dislikes || []).length;
      const upvotes = (m.upvotes || []).length;
      const downvotes = (m.downvotes || []).length;

      const sRes = sentiment.analyze(String(m.content || ''));
      const sScore = Number(sRes.score || 0);

      const sideAgg = perSide[m.side];
      sideAgg.messages += 1;
      sideAgg.likes += likes;
      sideAgg.dislikes += dislikes;
      sideAgg.upvotes += upvotes;
      sideAgg.downvotes += downvotes;
      sideAgg.sentimentSum += sScore;
      sideAgg.sentimentCount += 1;

      const uid = Number(m.senderID || 0);
      if (uid) {
        if (!perUser[uid]) {
          perUser[uid] = {
            userID: uid,
            name: m.senderName || 'Anonymous',
            messages: 0,
            likesReceived: 0,
            upvotesReceived: 0,
            sentimentSum: 0,
            sentimentCount: 0,
          };
        }
        perUser[uid].messages += 1;
        perUser[uid].likesReceived += likes;
        perUser[uid].upvotesReceived += upvotes;
        perUser[uid].sentimentSum += sScore;
        perUser[uid].sentimentCount += 1;
      }

      const minute = toMinuteIso(m.createdAt);
      if (!timelineMap[minute]) {
        timelineMap[minute] = { minute, messages: 0, sentimentSum: 0, sentimentCount: 0 };
      }
      timelineMap[minute].messages += 1;
      timelineMap[minute].sentimentSum += sScore;
      timelineMap[minute].sentimentCount += 1;

      if (!mostLiked || likes > (mostLiked.likes || 0)) mostLiked = { ...m, likes };
      if (!mostDisliked || dislikes > (mostDisliked.dislikes || 0))
        mostDisliked = { ...m, dislikes };
      if (!mostUpvoted || upvotes > (mostUpvoted.upvotes || 0))
        mostUpvoted = { ...m, upvotes };
      if (!mostDownvoted || downvotes > (mostDownvoted.downvotes || 0))
        mostDownvoted = { ...m, downvotes };
    }

    for (const s of sides) {
      const agg = perSide[s];
      agg.sentimentAvg =
        agg.sentimentCount > 0 ? Number((agg.sentimentSum / agg.sentimentCount).toFixed(3)) : 0;
      delete agg.sentimentSum;
      delete agg.sentimentCount;
    }

    const perUserArr = Object.values(perUser).map((u) => ({
      ...u,
      sentimentAvg:
        u.sentimentCount > 0 ? Number((u.sentimentSum / u.sentimentCount).toFixed(3)) : 0,
    }));
    perUserArr.sort((a, b) => b.messages - a.messages);

    const timeline = Object.values(timelineMap)
      .map((t) => ({
        minute: t.minute,
        messages: t.messages,
        sentimentAvg:
          t.sentimentCount > 0 ? Number((t.sentimentSum / t.sentimentCount).toFixed(3)) : 0,
      }))
      .sort((a, b) => new Date(a.minute) - new Date(b.minute));

    const [proponentVotes, opponentVotes] = await Promise.all([
      Vote.countDocuments({ joincode: jc, side: 'proponent' }),
      Vote.countDocuments({ joincode: jc, side: 'opponent' }),
    ]);
    const votes = { proponent: proponentVotes, opponent: opponentVotes };

    return res.json({
      debate: { joincode: debate.joincode, title: debate.title, status: debate.status, isPublic: debate.isPublic },
      votes,
      perSide,
      perUser: perUserArr.slice(0, 50),
      timeline,
      topMessages: { mostLiked, mostDisliked, mostUpvoted, mostDownvoted },
    });
  } catch (err) {
    console.error('getAnalytics error:', err);
    return res.status(500).json({ message: 'Failed to compute analytics' });
  }
};
