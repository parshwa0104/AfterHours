import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import User from './src/models/User.js';
import Offer from './src/models/Offer.js';
import Dream from './src/models/Dream.js';
import Task from './src/models/Task.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'replace_me_in_production';

const createToken = (userId) => jwt.sign({ sub: String(userId) }, JWT_SECRET, { expiresIn: '7d' });

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  return {
    id: String(userDoc._id),
    displayName: userDoc.displayName,
    email: userDoc.email,
    skills: userDoc.skills ?? [],
    bio: userDoc.bio ?? '',
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  };
};

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing bearer token.' });
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return res.status(401).json({ error: 'Invalid auth token.' });
    }

    req.auth = { userId: String(user._id), user };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/users', async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  res.json(users.map(sanitizeUser));
});

app.post('/api/users', async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(sanitizeUser(user));
});

/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: JWT Auth APIs
=============================================================================
*
* Register/Login return:
* - `token` (JWT)
* - `user` (safe public profile)
*
* Client should store token and send it as:
* Authorization: Bearer <token>
*/
app.post('/api/auth/register', async (req, res) => {
  const { displayName, email, password } = req.body;
  if (!displayName || !email || !password) {
    return res.status(400).json({ error: 'displayName, email, and password are required.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const existing = await User.findOne({ email: String(email).toLowerCase().trim() }).lean();
  if (existing) {
    return res.status(409).json({ error: 'Email already in use.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    displayName: String(displayName).trim(),
    email: String(email).toLowerCase().trim(),
    passwordHash,
    skills: [],
    bio: '',
  });

  const token = createToken(user._id);
  return res.status(201).json({ token, user: sanitizeUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash');
  if (!user?.passwordHash) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = createToken(user._id);
  return res.json({ token, user: sanitizeUser(user) });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.auth.userId).lean();
  return res.json({ user: sanitizeUser(user) });
});

app.get('/api/offers', async (_req, res) => {
  const offers = await Offer.find().populate('owner', 'displayName email').sort({ createdAt: -1 }).lean();
  res.json(offers);
});

app.post('/api/offers', async (req, res) => {
  const offer = await Offer.create(req.body);
  res.status(201).json(offer);
});

/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: Multi-user Dream + Task APIs
=============================================================================
*
* Current version uses simple `userId` query/body values to identify actor.
* This keeps onboarding easy while you prototype with friends.
*
* Production upgrade path:
* - Replace `userId` params with authenticated JWT user claims.
* - Enforce authorization through middleware.
*/

app.get('/api/dreams', requireAuth, async (req, res) => {
  const userId = req.auth.userId;

  const dreams = await Dream.find({
    isArchived: false,
    $or: [{ owner: userId }, { members: userId }],
  })
    .populate('owner', 'displayName email')
    .populate('members', 'displayName email')
    .sort({ updatedAt: -1 })
    .lean();

  res.json(dreams);
});

app.post('/api/dreams', requireAuth, async (req, res) => {
  const { title, description = '' } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'title is required.' });
  }

  const dream = await Dream.create({
    title,
    description,
    owner: req.auth.userId,
    members: [],
  });

  res.status(201).json(dream);
});

app.post('/api/dreams/:dreamId/members', requireAuth, async (req, res) => {
  const { dreamId } = req.params;
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required in request body.' });
  }

  const dreamOwner = await Dream.findById(dreamId).select('owner').lean();
  if (!dreamOwner) {
    return res.status(404).json({ error: 'Dream not found.' });
  }
  if (String(dreamOwner.owner) !== req.auth.userId) {
    return res.status(403).json({ error: 'Only owner can add members.' });
  }

  const dream = await Dream.findByIdAndUpdate(
    dreamId,
    { $addToSet: { members: userId } },
    { new: true },
  )
    .populate('owner', 'displayName email')
    .populate('members', 'displayName email');

  if (!dream) {
    return res.status(404).json({ error: 'Dream not found.' });
  }

  res.json(dream);
});

app.get('/api/dreams/:dreamId/tasks', requireAuth, async (req, res) => {
  const { dreamId } = req.params;
  const dream = await Dream.findOne({
    _id: dreamId,
    $or: [{ owner: req.auth.userId }, { members: req.auth.userId }],
  }).select('_id').lean();

  if (!dream) {
    return res.status(403).json({ error: 'Not authorized for this dream.' });
  }

  const tasks = await Task.find({ dream: dreamId })
    .populate('assignedTo', 'displayName email')
    .populate('createdBy', 'displayName email')
    .sort({ createdAt: -1 })
    .lean();

  res.json(tasks);
});

app.post('/api/dreams/:dreamId/tasks', requireAuth, async (req, res) => {
  const { dreamId } = req.params;
  const {
    title,
    category = 'General',
    difficulty = 1,
    isOffline = true,
    assignedTo = null,
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required.' });
  }

  const dream = await Dream.findOne({
    _id: dreamId,
    $or: [{ owner: req.auth.userId }, { members: req.auth.userId }],
  }).select('_id').lean();

  if (!dream) {
    return res.status(403).json({ error: 'Not authorized for this dream.' });
  }

  const task = await Task.create({
    dream: dreamId,
    title,
    category,
    difficulty,
    isOffline,
    assignedTo,
    createdBy: req.auth.userId,
  });

  res.status(201).json(task);
});

app.patch('/api/tasks/:taskId', requireAuth, async (req, res) => {
  const { taskId } = req.params;
  const updates = req.body;

  const allowedFields = ['title', 'category', 'difficulty', 'isOffline', 'status', 'assignedTo'];
  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowedFields.includes(key)),
  );

  const existingTask = await Task.findById(taskId).select('dream').lean();
  if (!existingTask) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const dream = await Dream.findOne({
    _id: existingTask.dream,
    $or: [{ owner: req.auth.userId }, { members: req.auth.userId }],
  }).select('_id').lean();

  if (!dream) {
    return res.status(403).json({ error: 'Not authorized for this task.' });
  }

  const task = await Task.findByIdAndUpdate(taskId, safeUpdates, { new: true });

  res.json(task);
});

app.use((err, _req, res, _next) => {
  const message = err?.message || 'Unknown server error';
  res.status(500).json({ error: message });
});

io.on('connection', (socket) => {
  socket.on('connection:request', (payload) => {
    io.to(payload.toUserId).emit('connection:incoming', {
      fromUserId: payload.fromUserId,
      message: payload.message || '',
      sentAt: Date.now(),
    });
  });

  socket.on('connection:join-user-room', (userId) => {
    socket.join(userId);
  });
});

const start = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is required in environment variables.');
    }

    await mongoose.connect(MONGODB_URI);
    server.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Server bootstrap failed:', error.message);
    process.exit(1);
  }
};

start();
