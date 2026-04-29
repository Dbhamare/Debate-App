require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const User = require('./models/User');
const Debate = require('./models/Debate');

const server = http.createServer(app);
const corsOrigin = String(process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST', 'PATCH', 'DELETE'] }
});

app.set('io', io);

function parseToken(socket) {
  const authToken = socket.handshake?.auth?.token;
  if (authToken) return String(authToken).replace(/^Bearer\s+/i, '');
  const authHeader = socket.handshake?.headers?.authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

async function getSocketUser(socket) {
  const token = parseToken(socket);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userID = Number(decoded.userID || decoded.userId || decoded._id);
    if (!Number.isFinite(userID)) return null;
    return await User.findOne({ userID }).select('userID role').lean();
  } catch {
    return null;
  }
}

function canAccessDebate(debate, user) {
  if (!debate) return false;
  if (debate.isPublic) return true;
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'instructor' && String(debate.instructor) === String(user.userID)) return true;
  return (debate.sides || []).some((s) => (s.participants || []).includes(Number(user.userID)));
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinDebate', async (payload = {}, cb = () => {}) => {
    try {
      const joincode = Number(payload.joincode);
      if (!Number.isFinite(joincode)) return cb({ ok: false, message: 'Invalid joincode' });

      const debate = await Debate.findOne({ joincode }).lean();
      if (!debate) return cb({ ok: false, message: 'Debate not found' });

      const user = await getSocketUser(socket);
      if (!canAccessDebate(debate, user)) return cb({ ok: false, message: 'Forbidden' });

      socket.join(`debate:${joincode}`);
      socket.data.user = user || null;
      return cb({ ok: true });
    } catch (e) {
      return cb({ ok: false, message: 'Failed to join room' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => console.error("MongoDB connection failed:", err.message));

if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}
