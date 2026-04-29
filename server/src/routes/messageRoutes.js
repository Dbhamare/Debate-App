const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Debate = require('../models/Debate');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { messageSchemas } = require('../validation/schemas');

function parseJoincodeOr400(raw, res) {
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    res.status(400).json({ message: 'Invalid joincode' });
    return null;
  }
  return n;
}

async function getAuthUser(req) {
  const payload = req.user || {};
  let u = null;

  if (payload.userId) {
    try {
      u = await User.findById(payload.userId).select('userID role name email');
    } catch {}
  }

  if (!u && payload.userID) {
    u = await User.findOne({ userID: payload.userID }).select('userID role name email');
  }

  if (!u && payload.email) {
    u = await User.findOne({ email: payload.email }).select('userID role name email');
  }

  return u;
}

function emit(io, joincode, event, payload) {
  if (io) io.to(`debate:${joincode}`).emit(`${event}:${joincode}`, payload);
}

function ensureReactions(msg) {
  if (!msg) return null;
  msg.likes     ||= [];
  msg.dislikes  ||= [];
  msg.upvotes   ||= [];
  msg.downvotes ||= [];
  msg.flags     ||= [];
  return msg;
}

function isInstructorOwner(debateDoc, authUser) {
  return (
    authUser &&
    authUser.role === 'instructor' &&
    String(debateDoc?.instructor) === String(authUser.userID)
  );
}

function isAdmin(authUser) {
  return !!(authUser && authUser.role === 'admin');
}

function isAssignedParticipant(debateDoc, authUser) {
  if (!debateDoc || !authUser) return false;
  return (debateDoc.sides || []).some((s) =>
    (s.participants || []).includes(Number(authUser.userID))
  );
}

function assignedSideForUser(debateDoc, authUser) {
  if (!debateDoc || !authUser) return null;
  const uid = Number(authUser.userID);
  const hit = (debateDoc.sides || []).find((s) => (s.participants || []).includes(uid));
  return hit?.name || null;
}

function canAccessDebate(debateDoc, authUser) {
  if (!debateDoc) return false;
  if (debateDoc.isPublic) return true;
  return isAdmin(authUser) || isInstructorOwner(debateDoc, authUser) || isAssignedParticipant(debateDoc, authUser);
}

function canModerateDebate(debateDoc, authUser) {
  return isAdmin(authUser) || isInstructorOwner(debateDoc, authUser);
}

function attachOptionalAuth(req) {
  if (req.user) return;
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return;
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userID: decoded.userID || decoded.userId || decoded._id,
      role: decoded.role,
    };
  } catch (_) {}
}

router.get('/search', validate({ query: messageSchemas.searchQuery }), async (req, res) => {
  try {
    const { q = '', joincode = '' } = req.query;
    const jc = Number(joincode);
    if (!Number.isFinite(jc)) {
      return res.status(400).json({ message: 'Invalid joincode' });
    }

    attachOptionalAuth(req);
    const authUser = await getAuthUser(req);
    const debateDoc = await Debate.findOne({ joincode: jc }).lean();
    if (!debateDoc) return res.status(404).json({ message: 'Debate not found' });
    if (!canAccessDebate(debateDoc, authUser)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const term = String(q).trim();
    if (!term) return res.json([]);

    const rows = await Message.find({
      joincode: jc,
      content: { $regex: term, $options: 'i' }
    })
      .select('content side senderID senderName createdAt replyTo _id likes dislikes upvotes downvotes')
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    res.json(rows);
  } catch (e) {
    console.error('Message search error:', e);
    res.status(500).json({ message: 'Failed to search messages' });
  }
});

router.get('/:joincode', validate({ params: messageSchemas.joincodeParams }), async (req, res) => {
  try {
    const jc = parseJoincodeOr400(req.params.joincode, res);
    if (jc === null) return;
    attachOptionalAuth(req);
    const authUser = await getAuthUser(req);
    const debateDoc = await Debate.findOne({ joincode: jc }).lean();
    if (!debateDoc) return res.status(404).json({ message: 'Debate not found' });
    if (!canAccessDebate(debateDoc, authUser)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const rows = await Message.find({ joincode: jc })
      .sort({ createdAt: 1 })
      .lean();
    res.json(rows);
  } catch (e) {
    console.error('Failed to fetch messages:', e);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

router.post('/', authMiddleware, validate({ body: messageSchemas.createMessageBody }), async (req, res) => {
  try {
    const { debate, content, side, replyTo = null, isAnonymous = false } = req.body;

    if (!['proponent', 'opponent', 'neutral'].includes(side)) {
      return res.status(400).json({ message: 'Invalid side value.' });
    }

    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ message: 'User not found' });

    const joincode = Number(debate);
    const debateDoc = await Debate.findOne({ joincode });
    if (!debateDoc) return res.status(404).json({ message: 'Debate not found' });
    if (!canAccessDebate(debateDoc, authUser)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (debateDoc.status !== 'active' && !isInstructorOwner(debateDoc, authUser)) {
      return res.status(403).json({ message: 'Debate not active' });
    }

    if (!debateDoc.isPublic) {
      const uid = Number(authUser.userID);

      const owner = Number(debateDoc.instructor) === uid;

      const assigned = (debateDoc.sides || []).some(s =>
        (s.participants || []).includes(uid)
      );
      const assignedSide = assignedSideForUser(debateDoc, authUser);

      const isAdmin = authUser.role === 'admin';

      if (!owner && !assigned && !isAdmin && !isInstructorOwner(debateDoc, authUser)) {
        return res.status(403).json({ message: 'You are not a participant in this debate' });
      }

      if (!owner && !isAdmin && !isInstructorOwner(debateDoc, authUser) && assignedSide && assignedSide !== side) {
        return res.status(403).json({ message: 'You can only post in your assigned side' });
      }
    }

    const newMessage = await Message.create({
      joincode,
      content,
      side,
      replyTo,
      senderID: authUser.userID,
      senderName: isAnonymous ? 'Anonymous' : authUser.name,
      isAnonymous,
    });

    emit(req.app.get('io'), joincode, 'newMessage', newMessage.toObject());
    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Failed to post message:', err);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

router.patch('/:id', authMiddleware, validate({ params: messageSchemas.messageIdParams, body: messageSchemas.updateMessageBody }), async (req, res) => {
  try {
    const { content } = req.body;
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ message: 'User not found' });

    if (msg.senderID !== authUser.userID) {
      return res.status(403).json({ message: 'You can edit only your own messages' });
    }

    msg.content = content;
    msg.editedAt = new Date();
    await msg.save();

    emit(req.app.get('io'), msg.joincode, 'messageEdited', msg.toObject());
    res.json(msg);
  } catch (err) {
    console.error('Edit message error:', err);
    res.status(500).json({ message: 'Failed to edit message' });
  }
});

router.delete('/:id', authMiddleware, validate({ params: messageSchemas.messageIdParams }), async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ message: 'User not found' });
    const debateDoc = await Debate.findOne({ joincode: msg.joincode });
    if (!debateDoc) return res.status(404).json({ message: 'Debate not found' });
    if (!canAccessDebate(debateDoc, authUser)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const isOwner = msg.senderID === authUser.userID;
    const isModerator = canModerateDebate(debateDoc, authUser);

    if (!isOwner && !isModerator) {
      return res.status(403).json({ message: 'Not allowed to delete this message' });
    }

    const joincode = msg.joincode;
    const id = String(msg._id);
    await msg.deleteOne();
    emit(req.app.get('io'), joincode, 'messageDeleted', { _id: id });

    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

router.post('/:id/like', authMiddleware, validate({ params: messageSchemas.messageIdParams }), async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ message: 'User not found' });

    const msg = ensureReactions(await Message.findById(req.params.id));
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    const debateDoc = await Debate.findOne({ joincode: msg.joincode });
    if (!debateDoc) return res.status(404).json({ message: 'Debate not found' });
    if (!canAccessDebate(debateDoc, authUser)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const uid = authUser.userID;

    const likeIdx = msg.likes.indexOf(uid);
    if (likeIdx === -1) {
      msg.likes.push(uid);
      msg.dislikes = msg.dislikes.filter(x => x !== uid);
    } else {
      msg.likes.splice(likeIdx, 1);
    }

    await msg.save();

    const payload = { _id: msg._id, likes: msg.likes, dislikes: msg.dislikes };
    emit(req.app.get('io'), msg.joincode, 'messageUpdated', payload);
    res.json(payload);
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ message: 'Failed to like' });
  }
});

router.post('/:id/dislike', authMiddleware, validate({ params: messageSchemas.messageIdParams }), async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ message: 'User not found' });

    const msg = ensureReactions(await Message.findById(req.params.id));
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    const debateDoc = await Debate.findOne({ joincode: msg.joincode });
    if (!debateDoc) return res.status(404).json({ message: 'Debate not found' });
    if (!canAccessDebate(debateDoc, authUser)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const uid = authUser.userID;

    const dIdx = msg.dislikes.indexOf(uid);
    if (dIdx === -1) {
      msg.dislikes.push(uid);
      msg.likes = msg.likes.filter(x => x !== uid);
    } else {
      msg.dislikes.splice(dIdx, 1);
    }

    await msg.save();

    const payload = { _id: msg._id, likes: msg.likes, dislikes: msg.dislikes };
    emit(req.app.get('io'), msg.joincode, 'messageUpdated', payload);
    res.json(payload);
  } catch (err) {
    console.error('Dislike error:', err);
    res.status(500).json({ message: 'Failed to dislike' });
  }
});

router.post('/:id/upvote', authMiddleware, validate({ params: messageSchemas.messageIdParams }), async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ message: 'User not found' });

    const msg = ensureReactions(await Message.findById(req.params.id));
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    const debateDoc = await Debate.findOne({ joincode: msg.joincode });
    if (!debateDoc) return res.status(404).json({ message: 'Debate not found' });
    if (!canAccessDebate(debateDoc, authUser)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const uid = authUser.userID;

    const uIdx = msg.upvotes.indexOf(uid);
    if (uIdx === -1) {
      msg.upvotes.push(uid);
      msg.downvotes = msg.downvotes.filter(x => x !== uid);
    } else {
      msg.upvotes.splice(uIdx, 1);
    }

    await msg.save();

    const payload = { _id: msg._id, upvotes: msg.upvotes, downvotes: msg.downvotes };
    emit(req.app.get('io'), msg.joincode, 'messageUpdated', payload);
    res.json(payload);
  } catch (err) {
    console.error('Upvote error:', err);
    res.status(500).json({ message: 'Failed to upvote' });
  }
});

router.post('/:id/downvote', authMiddleware, validate({ params: messageSchemas.messageIdParams }), async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ message: 'User not found' });

    const msg = ensureReactions(await Message.findById(req.params.id));
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    const debateDoc = await Debate.findOne({ joincode: msg.joincode });
    if (!debateDoc) return res.status(404).json({ message: 'Debate not found' });
    if (!canAccessDebate(debateDoc, authUser)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const uid = authUser.userID;

    const dIdx = msg.downvotes.indexOf(uid);
    if (dIdx === -1) {
      msg.downvotes.push(uid);
      msg.upvotes = msg.upvotes.filter(x => x !== uid);
    } else {
      msg.downvotes.splice(dIdx, 1);
    }

    await msg.save();

    const payload = { _id: msg._id, upvotes: msg.upvotes, downvotes: msg.downvotes };
    emit(req.app.get('io'), msg.joincode, 'messageUpdated', payload);
    res.json(payload);
  } catch (err) {
    console.error('Downvote error:', err);
    res.status(500).json({ message: 'Failed to downvote' });
  }
});

router.post('/:id/flag', authMiddleware, validate({ params: messageSchemas.messageIdParams }), async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ message: 'User not found' });

    const msg = ensureReactions(await Message.findById(req.params.id));
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    const debateDoc = await Debate.findOne({ joincode: msg.joincode });
    if (!debateDoc) return res.status(404).json({ message: 'Debate not found' });
    if (!canAccessDebate(debateDoc, authUser)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const i = msg.flags.indexOf(authUser.userID);
    if (i === -1) msg.flags.push(authUser.userID);
    else msg.flags.splice(i, 1);

    if (msg.flags.length >= 5) {
      const joincode = msg.joincode;
      const id = String(msg._id);
      await msg.deleteOne();
      emit(req.app.get('io'), joincode, 'messageDeleted', { _id: id });
      return res.json({ message: 'Message removed due to flags threshold' });
    }

    await msg.save();
    emit(req.app.get('io'), msg.joincode, 'messageUpdated', { _id: msg._id, flags: msg.flags });
    res.json({ flags: msg.flags });
  } catch (err) {
    console.error('Flag error:', err);
    res.status(500).json({ message: 'Failed to flag' });
  }
});

router.post('/:id/pin', authMiddleware, validate({ params: messageSchemas.messageIdParams, body: messageSchemas.pinBody }), async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ message: 'User not found' });
    const { pinned = true } = req.body;
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    const debateDoc = await Debate.findOne({ joincode: msg.joincode });
    if (!debateDoc) return res.status(404).json({ message: 'Debate not found' });
    if (!canModerateDebate(debateDoc, authUser)) {
      return res.status(403).json({ message: 'Only debate moderators can pin/unpin' });
    }

    msg.pinned = !!pinned;
    await msg.save();

    emit(req.app.get('io'), msg.joincode, 'messagePinned', { _id: msg._id, pinned: msg.pinned });
    res.json({ pinned: msg.pinned });
  } catch (err) {
    console.error('Pin error:', err);
    res.status(500).json({ message: 'Failed to pin/unpin' });
  }
});

router.post('/:id/reply', authMiddleware, validate({ params: messageSchemas.messageIdParams, body: messageSchemas.replyBody }), async (req, res) => {
  try {
    const parent = await Message.findById(req.params.id);
    if (!parent) return res.status(404).json({ message: 'Parent message not found' });

    const { content, side, isAnonymous = false } = req.body;
    if (!['proponent', 'opponent', 'neutral'].includes(side)) {
      return res.status(400).json({ message: 'Invalid side value.' });
    }

    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ message: 'User not found' });

    const debateDoc = await Debate.findOne({ joincode: parent.joincode });
    if (!debateDoc) return res.status(404).json({ message: 'Debate not found' });
    if (!canAccessDebate(debateDoc, authUser)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (debateDoc.status !== 'active' && !isInstructorOwner(debateDoc, authUser)) {
      return res.status(403).json({ message: 'Debate not active' });
    }

    if (!debateDoc.isPublic && !isAdmin(authUser) && !isInstructorOwner(debateDoc, authUser)) {
      const assignedSide = assignedSideForUser(debateDoc, authUser);
      if (!assignedSide) {
        return res.status(403).json({ message: 'You are not a participant in this debate' });
      }
      if (assignedSide !== side) {
        return res.status(403).json({ message: 'You can only reply in your assigned side' });
      }
    }

    const reply = await Message.create({
      joincode: parent.joincode,
      content,
      side,
      replyTo: parent._id,
      senderID: authUser.userID,
      senderName: isAnonymous ? 'Anonymous' : authUser.name,
      isAnonymous,    
    });

    emit(req.app.get('io'), reply.joincode, 'newMessage', reply.toObject());
    res.status(201).json(reply);
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ message: 'Failed to reply' });
  }
});

module.exports = router;
