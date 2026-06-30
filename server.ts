import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// Mongoose Schemas
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  handle: String,
  badge: String,
  capturedBP: { type: Number, default: 0 },
  pendingBP: { type: Number, default: 0 },
  avatar: String,
  civic_trust_score: Number,
  requiresDoubleUpvotes: { type: Boolean, default: false },
  district: { type: String, default: 'District 4' },
  achievedBadges: [String],
  unlockedAssets: [String],
  unlockedTitles: [String],
  activeCosmetics: {
    glowColor: { type: String, default: null },
    avatarBorder: { type: String, default: null },
    currentTitle: { type: String, default: null }
  },
  manualLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  lastKnownLocation: {
    lat: Number,
    lng: Number
  }
});

const commentSchema = new mongoose.Schema({
  id: String,
  userId: String,
  text: String,
  timestamp: Date,
});

const issueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: String,
  lat: Number,
  lng: Number,
  description: String,
  image: String,
  timestamp: Date,
  status: String,
  reporterId: String,
  verificationUpvotes: { type: Number, default: 0 },
  spamDownvotes: { type: Number, default: 0 },
  upvotedBy: [String],
  downvotedBy: [String],
  fixVerificationsCount: { type: Number, default: 0 },
  fixWitnesses: [String],
  comments: [commentSchema],
  severityScore: Number,
  assignedDepartment: String,
  resolvedImage: String,
  confidenceScore: { type: Number, default: 1 },
  communityVerified: { type: Boolean, default: true },
  bountyTier: String,
  bountyPoints: Number,
  district: String,
});

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

const User = mongoose.model("User", userSchema);
const Issue = mongoose.model("Issue", issueSchema);
const Message = mongoose.model("Message", messageSchema);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize MongoDB
  if (process.env.MONGODB_URI) {
    (async () => {
      try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        // Seed initial data if empty
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            await User.create([
            { id: '1', name: 'Elena R.', handle: '@elena_reports', badge: 'Champion', capturedBP: 1250, pendingBP: 0, avatar: 'https://i.pravatar.cc/150?u=elena', civic_trust_score: 100, requiresDoubleUpvotes: false, district: 'District 4', achievedBadges: ['Founding Member'], lastKnownLocation: { lat: 10.5200, lng: 76.2200 } },
            { id: '2', name: 'Marcus T.', handle: '@marcust', badge: 'Advocate', capturedBP: 980, pendingBP: 0, avatar: 'https://i.pravatar.cc/150?u=marcus', civic_trust_score: 100, requiresDoubleUpvotes: false, district: 'District 4', achievedBadges: [], lastKnownLocation: { lat: 10.5100, lng: 76.2050 } },
            { id: '3', name: 'Sarah J.', handle: '@sarahj_civic', badge: 'Defender', capturedBP: 845, pendingBP: 0, avatar: 'https://i.pravatar.cc/150?u=sarah', civic_trust_score: 100, requiresDoubleUpvotes: false, district: 'Sector 7', achievedBadges: [], lastKnownLocation: { lat: 10.5300, lng: 76.2300 } },
            { id: '4', name: 'David W.', handle: '@david_walker', badge: 'Scout', capturedBP: 620, pendingBP: 0, avatar: 'https://i.pravatar.cc/150?u=david', civic_trust_score: 100, requiresDoubleUpvotes: false, district: 'District 4', achievedBadges: [], lastKnownLocation: { lat: 10.5050, lng: 76.2100 } },
            ])
          
          await Issue.insertMany([
            {
              id: '1',
              type: 'pothole',
              lat: 34.0650,
              lng: -118.2750,
              description: 'Massive pothole on main street. Almost blew out my tire! City needs to fix this ASAP.',
              image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800',
              timestamp: new Date(Date.now() - 3600000),
              status: 'active',
              reporterId: '2',
              likes: 12,
              hasLiked: false,
              comments: [
                { id: 'c1', userId: '3', text: 'I hit that yesterday! It is so dangerous.', timestamp: new Date(Date.now() - 1800000) }
              ],
              severityScore: 3,
              assignedDepartment: 'Public Works Roads Div'
            },
            {
              id: '2',
              type: 'water',
              lat: 34.0400,
              lng: -118.2350,
              description: 'Major water leak from a broken hydrant near the park. It is flooding the sidewalk.',
              image: 'https://images.unsplash.com/photo-1541888062561-396349603f90?auto=format&fit=crop&q=80&w=800',
              timestamp: new Date(Date.now() - 7200000),
              status: 'active',
              reporterId: '3',
              verificationUpvotes: 0,
              spamDownvotes: 0,
              comments: [],
              severityScore: 8,
              assignedDepartment: 'Water Supply & Sewage Board'
            },
            {
              id: '3',
              type: 'streetlight',
              lat: 34.0800,
              lng: -118.2300,
              description: 'Streetlight out at the intersection of 5th and Grand. Very dark and unsafe for pedestrians.',
              timestamp: new Date(Date.now() - 86400000),
              status: 'active',
              reporterId: '1',
              verificationUpvotes: 0,
              spamDownvotes: 0,
              comments: [],
              severityScore: 4,
              assignedDepartment: 'Electrical Grid & Maintenance'
            }
          ]);
          console.log('Seeded initial data');
        }
      } catch (err) {
        console.error('Failed to connect to MongoDB', err);
      }
    })();
  } else {
    console.warn('MONGODB_URI not set. Skipping DB connection.');
  }

  // Initialize Gemini
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  // --- Gemini rate-limit guard ---
  // Track when the API last returned a 429. If we're still within the retry
  // window, skip the API call entirely and return a graceful fallback.
  let geminiBlockedUntil: number = 0; // epoch ms

  function isGeminiBlocked(): boolean {
    return Date.now() < geminiBlockedUntil;
  }

  function handleGeminiError(err: any): number {
    // Extract the retry delay from the error message if present
    const match = typeof err?.message === 'string'
      ? err.message.match(/(\d+\.?\d*)s?"?\s*}/i)
      : null;
    const delaySec = match ? parseFloat(match[1]) : 60;
    geminiBlockedUntil = Date.now() + delaySec * 1000 + 2000; // add 2s buffer
    console.warn(`[Gemini] Rate-limited. Blocking calls for ${delaySec}s.`);
    return delaySec;
  }

  app.use(express.json({ limit: '100mb' })); // Support base64 image/video uploads

  app.get("/api/location/ip", async (req, res) => {
    try {
      // 1. Try ip-api
      let fetchRes = await fetch("http://ip-api.com/json/");
      let data = await fetchRes.json();
      if (data && data.lat && data.lon) {
        return res.json({ lat: data.lat, lon: data.lon });
      }
      // 2. Fallback to geojs
      fetchRes = await fetch("https://get.geojs.io/v1/ip/geo.json");
      data = await fetchRes.json();
      if (data && data.latitude && data.longitude) {
        return res.json({ lat: parseFloat(data.latitude), lon: parseFloat(data.longitude) });
      }
      res.status(500).json({ error: "All IP Geolocation providers failed." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // MongoDB API Routes
  app.get("/api/users", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database connection failed. If using MongoDB Atlas, please ensure 0.0.0.0/0 is whitelisted in your Network Access settings." });
      }
      const users = await User.find({});
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/users/:id/trust", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not connected" });
      }
      const { delta } = req.body;
      const user = await User.findOne({ id: req.params.id });
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const newScore = Math.max(0, Math.min(100, (user.civic_trust_score || 0) + delta));
      user.civic_trust_score = newScore;
      user.requiresDoubleUpvotes = newScore < 40;
      await user.save();
      
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/users/sync", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not connected" });
      }
      const { id, name, avatar, email } = req.body;
      let user = await User.findOne({ id });
      
      if (!user) {
        const newUser = new User({
          id: req.body.id,
          name: req.body.name || req.body.email.split('@')[0],
          handle: '@' + req.body.email.split('@')[0],
          badge: 'Scout',
          bp: 100,
          avatar: req.body.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.body.name || req.body.email)}`,
          civic_trust_score: 100,
          requiresDoubleUpvotes: false,
          district: 'District 4',
          achievedBadges: []
        });
        await newUser.save();
        user = newUser;
      }
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/users/:id/location", async (req, res) => {
    try {
      const { lat, lng } = req.body;
      const update = (lat === null || lng === null)
        ? { $unset: { manualLocation: "" } }
        : { $set: { "manualLocation.lat": lat, "manualLocation.lng": lng } };
      
      const user = await User.findOneAndUpdate(
        { id: req.params.id },
        update,
        { returnDocument: 'after' }
      );
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/users/:id/lastKnownLocation", async (req, res) => {
    try {
      const { id } = req.params;
      const { lat, lng } = req.body;
      const user = await User.findOneAndUpdate(
        { id },
        { lastKnownLocation: { lat, lng } },
        { new: true }
      );
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/users/:id/purchase", async (req, res) => {
    try {
      const { id } = req.params;
      const { itemId, price } = req.body;
      
      const user = await User.findOne({ id });
      if (!user) return res.status(404).json({ error: "User not found" });
      
      if (user.capturedBP < price) {
        return res.status(400).json({ error: "Insufficient BP" });
      }

      user.capturedBP -= price;
      if (!user.unlockedAssets) {
        user.unlockedAssets = [];
      }
      if (!user.unlockedAssets.includes(itemId)) {
        user.unlockedAssets.push(itemId);
      }
      
      if (!user.unlockedTitles) {
        user.unlockedTitles = [];
      }
      if (!user.activeCosmetics) {
        user.activeCosmetics = { glowColor: null, avatarBorder: null, currentTitle: null };
      }

      if (itemId === 'glow') {
        user.activeCosmetics.glowColor = '#10b981'; // green preset
      } else if (itemId === 'badge') {
        const title = '[ elite_sentinel ]';
        if (!user.unlockedTitles.includes(title)) {
          user.unlockedTitles.push(title);
        }
        user.activeCosmetics.currentTitle = title;
      } else if (itemId === 'border') {
        user.activeCosmetics.avatarBorder = 'ring-2 ring-amber-500 ring-offset-2 ring-offset-civic-bg dark:ring-offset-[#1e1e1e]';
      }

      await user.save();
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/issues", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database connection failed. If using MongoDB Atlas, please ensure 0.0.0.0/0 is whitelisted in your Network Access settings." });
      }
      const issues = await Issue.find({}).sort({ timestamp: -1 });
      res.json(issues);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Analytics Route ---
  app.post('/api/issues/analytics', async (req, res) => {
    res.json({ message: 'Analytics recorded' });
  });

  // --- IP Geolocation Proxy Route ---
  app.get('/api/location/ip', async (req, res) => {
    try {
      // The backend fetches its own public IP location, avoiding client-side CORS/adblockers
      const response = await fetch('http://ip-api.com/json/');
      if (!response.ok) throw new Error('IP API failed');
      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("Backend IP Geolocation failed:", err);
      res.status(500).json({ error: 'Failed to fetch IP location' });
    }
  });

  app.post("/api/issues", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not connected" });
      }
      const { confidenceScore = 1, ...rest } = req.body;
      const communityVerified = confidenceScore >= 0.7;
      const issue = new Issue({
        id: Math.random().toString(36).substr(2, 9),
        ...rest,
        confidenceScore,
        communityVerified,
        timestamp: new Date(),
        status: 'active',
        verificationUpvotes: 0,
        spamDownvotes: 0,
        upvotedBy: [],
        downvotedBy: [],
        comments: []
      });
      await issue.save();
      
      // Escrow baseline bounty points
      if (issue.reporterId) {
        const reporter = await User.findOne({ id: issue.reporterId });
        if (reporter) {
          reporter.pendingBP = (reporter.pendingBP || 0) + (issue.bountyPoints || 100);
          await reporter.save();
        }
      }

      // Automatically alert authorities for critical issues (Severity >= 7)
      if (issue.severityScore >= 7) {
        console.log(`[URGENT] 🚨 CRITICAL SEVERITY ISSUE REPORTED!`);
        console.log(`Automatically dispatching mock email to: admin22337@gmail.com`);
        console.log(`Subject: CRITICAL INFRASTRUCTURE ALERT - ${issue.type.toUpperCase()}`);
        console.log(`Body: A critical issue (Severity: ${issue.severityScore}/10) has been reported at ${issue.lat}, ${issue.lng}. Description: ${issue.description}`);
      }

      res.json(issue);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/issues/:id/upvote", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not connected" });
      }
      const issue = await Issue.findOne({ id: req.params.id });
      if (!issue) return res.status(404).json({ error: "Issue not found" });
      
      const userId = req.body.userId;
      if (!userId) return res.status(400).json({ error: "userId is required" });
      
      if (!issue.upvotedBy) issue.upvotedBy = [];
      if (!issue.downvotedBy) issue.downvotedBy = [];
      
      if (issue.upvotedBy.includes(userId)) return res.status(400).json({ error: "User already upvoted" });
      if (issue.downvotedBy.includes(userId)) return res.status(400).json({ error: "User already downvoted this issue" });
      
      issue.upvotedBy.push(userId);
      issue.markModified('upvotedBy');
      issue.verificationUpvotes = (issue.verificationUpvotes || 0) + 1;
      const currentUpvotes = issue.verificationUpvotes;
      
      if (currentUpvotes >= 5) issue.communityVerified = true;
      await issue.save();

      // Trust-Scaled Rewards
      if (issue.reporterId) {
        const reporter = await User.findOne({ id: issue.reporterId });
        if (reporter) {
          if (currentUpvotes < 5) {
            reporter.capturedBP = (reporter.capturedBP || 0) + 2;
          } else if (currentUpvotes === 5) {
            // Milestone release
            reporter.pendingBP = Math.max(0, (reporter.pendingBP || 0) - 15);
            reporter.capturedBP = (reporter.capturedBP || 0) + 15;
          } else {
            // High-Trust Validation
            reporter.capturedBP = (reporter.capturedBP || 0) + 5;
          }
          
          // Check badge
          if (reporter.capturedBP >= 2000) reporter.badge = 'Champion';
          else if (reporter.capturedBP >= 1000) reporter.badge = 'Advocate';
          else if (reporter.capturedBP >= 500) reporter.badge = 'Defender';
          else reporter.badge = 'Scout';

          await reporter.save();
        }
      }
      
      res.json(issue);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/issues/:id/downvote", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not connected" });
      }
      const issue = await Issue.findOne({ id: req.params.id });
      if (!issue) return res.status(404).json({ error: "Issue not found" });
      
      const userId = req.body.userId;
      if (!userId) return res.status(400).json({ error: "userId is required" });
      
      if (!issue.upvotedBy) issue.upvotedBy = [];
      if (!issue.downvotedBy) issue.downvotedBy = [];
      
      if (issue.downvotedBy.includes(userId)) return res.status(400).json({ error: "User already downvoted" });
      if (issue.upvotedBy.includes(userId)) return res.status(400).json({ error: "User already upvoted this issue" });
      
      issue.downvotedBy.push(userId);
      issue.markModified('downvotedBy');
      issue.spamDownvotes = (issue.spamDownvotes || 0) + 1;
      if (issue.spamDownvotes >= 5) {
        issue.status = 'moderated_fake';
        
        // Deduct 30 points from reporter
        const user = await User.findOne({ id: issue.reporterId });
        if (user) {
          const newScore = Math.max(0, Math.min(100, (user.civic_trust_score || 0) - 30));
          user.civic_trust_score = newScore;
          user.requiresDoubleUpvotes = newScore < 40;
          await user.save();
        }
      }
      await issue.save();
      
      res.json(issue);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/issues/:id", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not connected" });
      }
      const issue = await Issue.findOne({ id: req.params.id });
      if (!issue) return res.status(404).json({ error: "Issue not found" });
      
      if (req.body.description) {
        issue.description = req.body.description;
      }
      await issue.save();
      res.json(issue);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/issues/:id", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not connected" });
      }
      const issue = await Issue.findOneAndDelete({ id: req.params.id });
      if (!issue) return res.status(404).json({ error: "Issue not found" });
      
      res.json({ message: "Issue deleted" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- DM ROUTES ---

  app.get("/api/inbox", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "Database not connected" });
      const currentUserId = req.headers['user-id'] as string;
      if (!currentUserId) return res.status(401).json({ error: "Unauthorized" });

      // Find all messages involving this user
      const messages = await Message.find({
        $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
      }).sort({ timestamp: -1 });

      // Group by the *other* user in the conversation
      const convos = new Map();
      for (const msg of messages) {
        const otherId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
        if (!convos.has(otherId)) {
          convos.set(otherId, {
            otherUserId: otherId,
            lastMessage: msg,
            unreadCount: msg.receiverId === currentUserId && !msg.read ? 1 : 0
          });
        } else {
          const entry = convos.get(otherId);
          if (msg.receiverId === currentUserId && !msg.read) entry.unreadCount++;
        }
      }

      res.json(Array.from(convos.values()));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/messages/:otherUserId", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "Database not connected" });
      const currentUserId = req.headers['user-id'] as string;
      if (!currentUserId) return res.status(401).json({ error: "Unauthorized" });
      
      const { otherUserId } = req.params;
      
      const messages = await Message.find({
        $or: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId }
        ]
      }).sort({ timestamp: 1 });

      // Mark unread messages as read
      await Message.updateMany(
        { senderId: otherUserId, receiverId: currentUserId, read: false },
        { $set: { read: true } }
      );

      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "Database not connected" });
      const currentUserId = req.headers['user-id'] as string;
      if (!currentUserId) return res.status(401).json({ error: "Unauthorized" });
      
      const { receiverId, text } = req.body;
      if (!receiverId || !text) return res.status(400).json({ error: "Missing fields" });

      const newMsg = new Message({
        id: Math.random().toString(36).substr(2, 9),
        senderId: currentUserId,
        receiverId,
        text,
        timestamp: new Date(),
        read: false
      });
      await newMsg.save();
      res.json(newMsg);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -----------------

  app.put("/api/issues/:id/verify-fix", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not connected" });
      }
      const issue = await Issue.findOne({ id: req.params.id });
      if (!issue) return res.status(404).json({ error: "Issue not found" });
      if (issue.status === 'resolved') return res.status(400).json({ error: "Issue already resolved" });

      const userId = req.body.userId;
      if (!userId) return res.status(400).json({ error: "userId is required" });
      if (userId === issue.reporterId) return res.status(403).json({ error: "Reporters cannot verify their own fixes" });
      if (issue.fixWitnesses?.includes(userId)) {
        return res.status(400).json({ error: "User already verified this fix" });
      }

      // Add vote
      if (!issue.fixWitnesses) issue.fixWitnesses = [];
      issue.fixWitnesses.push(userId);
      issue.markModified('fixWitnesses');

      // Check consensus threshold
      const CONSENSUS_THRESHOLD = 5;
      
      if (issue.fixWitnesses.length >= CONSENSUS_THRESHOLD) {
        issue.status = 'resolved';

        // Reward original reporter
        if (issue.reporterId) {
          const reporter = await User.findOne({ id: issue.reporterId });
          if (reporter) {
            const totalAllocation = issue.bountyPoints || 100;
            const releasedSoFar = (issue.verificationUpvotes || 0) >= 5 ? 15 : 0;
            const remainingEscrow = Math.max(0, totalAllocation - releasedSoFar);

            reporter.pendingBP = Math.max(0, (reporter.pendingBP || 0) - remainingEscrow);
            reporter.capturedBP = (reporter.capturedBP || 0) + remainingEscrow;
            
            if (reporter.capturedBP >= 2000) reporter.badge = 'Champion';
            else if (reporter.capturedBP >= 1000) reporter.badge = 'Advocate';
            else if (reporter.capturedBP >= 500) reporter.badge = 'Defender';
            
            await reporter.save();
          }
        }

        // Reward all verifiers
        for (const witnessId of issue.fixWitnesses) {
          const verifier = await User.findOne({ id: witnessId });
          if (verifier) {
            verifier.capturedBP = (verifier.capturedBP || 0) + 20; // Consensus verification bounty
            if (verifier.capturedBP >= 2000) verifier.badge = 'Champion';
            else if (verifier.capturedBP >= 1000) verifier.badge = 'Advocate';
            else if (verifier.capturedBP >= 500) verifier.badge = 'Defender';
            await verifier.save();
          }
        }
      }

      await issue.save();
      return res.json(issue);
    } catch (err: any) {
      console.error("AI Verify Fix Error:", err);
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  app.post("/api/issues/:id/comments", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not connected" });
      }
      const issue = await Issue.findOne({ id: req.params.id });
      if (!issue) return res.status(404).json({ error: "Issue not found" });
      
      const comment = {
        id: Math.random().toString(36).substr(2, 9),
        ...req.body,
        timestamp: new Date()
      };
      issue.comments.push(comment as any);
      await issue.save();
      
      res.json(issue);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/verify-report", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is missing. Add GEMINI_API_KEY in settings." });
      }

      // Rate-limit guard: return a permissive fallback if quota is exhausted
      if (isGeminiBlocked()) {
        console.warn('[Gemini] /api/verify-report skipped – still rate-limited. Returning auto-approved fallback.');
        return res.json({
          is_valid_infrastructure_issue: true,
          confidence_score_0_to_1: 0.75,
          rejection_reason: null,
          trust_score_deduction: 0,
          inferred_category: 'Other',
          visual_severity_assessment: 'Medium',
          severity_score_1_to_10: 5,
          assigned_department: 'Public Works',
          bountyTier: 'Rare Bounty',
          bountyPoints: 100,
          _fallback: true,
        });
      }

      const { mediaBase64, description } = req.body;
      // Support legacy 'imageBase64' key as well
      const rawData: string = mediaBase64 || req.body.imageBase64;
      if (!rawData) {
        return res.status(400).json({ error: "Media data is required" });
      }

      // Detect mime type from data URI prefix (e.g. data:video/mp4;base64,...)
      const mimeMatch = rawData.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const isVideo = mimeType.startsWith("video/");
      const base64Data = rawData.replace(/^data:[^;]+;base64,/, "");

      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          is_valid_infrastructure_issue: { type: Type.BOOLEAN },
          confidence_score_0_to_1: { type: Type.NUMBER },
          rejection_reason: { type: Type.STRING, nullable: true },
          trust_score_deduction: { type: Type.NUMBER },
          inferred_category: { type: Type.STRING },
          visual_severity_assessment: { type: Type.STRING },
          severity_score_1_to_10: { type: Type.NUMBER },
          assigned_department: { type: Type.STRING },
          bountyTier: { type: Type.STRING },
          bountyPoints: { type: Type.NUMBER }
        },
        required: ["is_valid_infrastructure_issue", "confidence_score_0_to_1", "trust_score_deduction", "inferred_category", "visual_severity_assessment", "severity_score_1_to_10", "assigned_department", "bountyTier", "bountyPoints"]
      };

      const mediaTypeLabel = isVideo ? "video" : "image";
      const prompt = `You are a strict municipal infrastructure validator AI (Spam Shield).
      Review the provided ${mediaTypeLabel} and description.
      Valid issues: potholes, structural cracks, broken streetlights, exposed wiring, water main bursts, illegal garbage dumping, or blocked drainage.
      INVALID reports: internet memes, stock photos, human faces/selfies, animated GIFs with no infrastructure context, or ${mediaTypeLabel}s completely unrelated to public safety/infrastructure.
      ${isVideo ? 'For videos, analyze the key frames and overall scene to determine if a real infrastructure issue is visible.' : ''}
      
      User description: "${description}"
      
      Determine if this is a valid civic infrastructure issue.
      If invalid, set is_valid_infrastructure_issue=false, explain why in rejection_reason, and set trust_score_deduction=20.
      If valid, assess severity (1-10) and assign to a city department.
      
      BOUNTY SYSTEM:
      Calculate a bountyTier and bountyPoints based on severity:
      - Low Severity (1-3) (Minor potholes, single dead bulb) -> "Common Bounty" : 50 BP
      - Medium Severity (4-6) (Blocked drainage, broken public facility) -> "Rare Bounty" : 100 BP
      - Critical Severity (7-10) (Flooding, exposed wires, structural cave-ins) -> "Epic/Mythic Bounty" : 200 to 350 BP based on compounding risk.
      
      If valid, set is_valid_infrastructure_issue=true, trust_score_deduction=0, rejection_reason=null.
      Classify the category into one of: [Pothole, Streetlight, Leak, Garbage, Other].
      Assess severity: [Low, Medium, Critical].
      Calculate severity_score_1_to_10 (1-10) dynamically by evaluating the compounding risk (e.g. a simple pothole is a 3, but a water leak spilling onto exposed electrical wires is a 9 or 10).
      Assign assigned_department to an authoritative infrastructure division (e.g. 'Water Supply & Sewage Board', 'Electrical Grid & Maintenance', 'Public Works Roads Div', 'Environmental & Waste Management').`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: 'user', parts: [
              { text: prompt },
              { inlineData: { mimeType: mimeType as any, data: base64Data } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.1,
        }
      });

      if (!response.text) {
        throw new Error("No response from Gemini");
      }

      const result = JSON.parse(response.text);
      res.json(result);

    } catch (err: any) {
      if (err?.status === 429 || (typeof err?.message === 'string' && err.message.includes('429'))) {
        const delaySec = handleGeminiError(err);
        // Return a graceful auto-approved fallback instead of crashing the UX
        return res.json({
          is_valid_infrastructure_issue: true,
          confidence_score_0_to_1: 0.75,
          rejection_reason: null,
          trust_score_deduction: 0,
          inferred_category: 'Other',
          visual_severity_assessment: 'Medium',
          severity_score_1_to_10: 5,
          assigned_department: 'Public Works',
          bountyTier: 'Rare Bounty',
          bountyPoints: 100,
          _fallback: true,
          _retryAfterSeconds: delaySec,
        });
      }
      console.error("Gemini Error:", err);
      res.status(500).json({ error: err.message || "Failed to verify report" });
    }
  });

  app.post("/api/city-planner-analysis", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is missing. Add GEMINI_API_KEY in settings." });
      }

      if (isGeminiBlocked()) {
        console.warn('[Gemini] /api/city-planner-analysis skipped – rate-limited. Returning fallback.');
        return res.json({ analysis: '> **AI Analysis temporarily unavailable** due to API quota limits.\n\nPlease try again in a few minutes. All reported issues are still visible on the map.', _fallback: true });
      }

      const { issues } = req.body;
      if (!issues || !Array.isArray(issues)) {
        return res.status(400).json({ error: "Issues array is required" });
      }

      const strippedIssues = issues.map((i: any) => ({
        type: i.type,
        severityScore: i.severityScore,
        lat: i.lat,
        lng: i.lng,
        status: i.status
      }));

      const prompt = `You are an expert Hyperlocal Predictive Infrastructure AI (City Planner).
      Analyze the following historical and active municipal issues to perform spatial and trend reasoning over coordinate clusters and issue types.
      Predict the top 3 structural failure points or public safety vulnerabilities likely to occur next in the city grid.
      Return your analytical data as a clean structured markdown string. Do not return JSON.

      Issues Data:
      ${JSON.stringify(strippedIssues, null, 2)}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (!response.text) {
        throw new Error("No response from Gemini");
      }

      res.json({ analysis: response.text });
    } catch (err: any) {
      if (err?.status === 429 || (typeof err?.message === 'string' && err.message.includes('429'))) {
        handleGeminiError(err);
        return res.json({ analysis: '> **AI Analysis temporarily unavailable** due to API quota limits.\n\nPlease try again in a few minutes. All reported issues are still visible on the map.', _fallback: true });
      }
      console.error("Gemini Error:", err);
      res.status(500).json({ error: err.message || "Failed to run analysis" });
    }
  });

  app.post("/api/daily-brief", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is missing. Add GEMINI_API_KEY in settings." });
      }

      if (isGeminiBlocked()) {
        console.warn('[Gemini] /api/daily-brief skipped – rate-limited. Returning fallback.');
        return res.json({ brief: '📢 **Daily Brief temporarily unavailable** — the AI is taking a short break due to quota limits. Check back in a few minutes!', _fallback: true });
      }

      const { issues } = req.body;
      if (!issues || !Array.isArray(issues)) {
        return res.status(400).json({ error: "Issues array is required" });
      }

      const prompt = `You are a friendly, community-oriented digital town crier.
      Compile the following individual reports into a singular, highly scannable, conversational neighborhood briefing note.
      Highlight recent major wins (e.g., issues marked as 'resolved'), warn citizens about active high-priority hazards (e.g., critical 'potholes' or 'flooding'), and close out with an encouraging note about civic participation.

      Issues Data:
      ${JSON.stringify(issues.map((i: any) => ({ type: i.type, description: i.description, status: i.status, timestamp: i.timestamp })), null, 2)}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (!response.text) {
        throw new Error("No response from Gemini");
      }

      res.json({ brief: response.text });
    } catch (err: any) {
      if (err?.status === 429 || (typeof err?.message === 'string' && err.message.includes('429'))) {
        handleGeminiError(err);
        return res.json({ brief: '📢 **Daily Brief temporarily unavailable** — the AI is taking a short break due to quota limits. Check back in a few minutes!', _fallback: true });
      }
      console.error("Gemini Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate daily brief" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Force instant shutdown for tsx watch to prevent 5-second hanging
  const instantShutdown = () => {
    console.log('Restarting server...');
    process.exit(0);
  };

  process.once('SIGINT', instantShutdown);
  process.once('SIGTERM', instantShutdown);
  process.once('SIGUSR2', instantShutdown);
}

startServer();
