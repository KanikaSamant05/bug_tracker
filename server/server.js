const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");

const Ticket = require('./models/Ticket');
const User = require("./models/User");
const Project = require('./models/Project');
const auth = require("./middleware/auth");

require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());
app.set("io", io);

if (!process.env.MONGO_URL) {
  console.error("MONGO_URL not found in .env ❌");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB Connected ✅");
    server.listen(5000, () => {
      console.log("Server running on port 5000 🚀");
    });
  })
  .catch(err => {
    console.error("MongoDB connection error ❌", err.message);
  });

io.on("connection", (socket) => {
  socket.on("join-project", (projectId) => {
    socket.join(projectId);
  });

  socket.on("leave-project", (projectId) => {
    socket.leave(projectId);
  });

  socket.on("disconnect", () => {
  });
});

// AUTH ROUTES
app.get('/', (req, res) => {
  res.send("Server is running 🚀");
});

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PROJECT ROUTES

app.get('/projects', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user.id }, { members: req.user.id }]
    }).populate('owner', 'name email').populate('members', 'name email');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/projects', auth, async (req, res) => {
  try {
    const project = await Project.create({
      name: req.body.name,
      description: req.body.description,
      owner: req.user.id,
      members: [req.user.id]
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/projects/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/projects/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can delete' });
    }
    await Project.findByIdAndDelete(req.params.id);
    await Ticket.deleteMany({ project: req.params.id });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/projects/:id/invite', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can invite' });
    }
    const userToInvite = await User.findOne({ email: req.body.email });
    if (!userToInvite) return res.status(404).json({ message: 'User not found' });
    if (project.members.includes(userToInvite._id)) {
      return res.status(400).json({ message: 'Already a member' });
    }
    project.members.push(userToInvite._id);
    await project.save();
    res.json({ message: 'Member added', project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TICKET ROUTES

app.get('/tickets', auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = projectId ? { project: projectId } : {};
    const tickets = await Ticket.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ BEFORE /:id
app.get('/tickets/assigned', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ assignedTo: req.user.id })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST — with socket emit
app.post('/tickets', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const ticket = new Ticket({
      ...req.body,
      project: req.body.projectId || req.body.project,
      activity: [{
        text: `Ticket created by ${user.name}`,
        authorName: user.name,
      }]
    });
    await ticket.save();

   
    await ticket.populate('assignedTo', 'name email');

    const projectId = req.body.projectId || req.body.project;
    req.app.get("io").to(projectId).emit("ticket-created", ticket);

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUT — with socket emit
app.put('/tickets/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const statusLabels = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };

    if (req.body.status && req.body.status !== ticket.status) {
      ticket.activity.push({
        text: `${user.name} changed status from "${statusLabels[ticket.status]}" → "${statusLabels[req.body.status]}"`,
        authorName: user.name,
      });
      ticket.status = req.body.status;
    }

    if (req.body.priority && req.body.priority !== ticket.priority) {
      ticket.activity.push({
        text: `${user.name} changed priority from "${ticket.priority}" → "${req.body.priority}"`,
        authorName: user.name,
      });
      ticket.priority = req.body.priority;
    }

    if (req.body.title && req.body.title !== ticket.title) {
      ticket.activity.push({
        text: `${user.name} updated the title`,
        authorName: user.name,
      });
      ticket.title = req.body.title;
    }

    if (req.body.description !== undefined && req.body.description !== ticket.description) {
      ticket.activity.push({
        text: `${user.name} updated the description`,
        authorName: user.name,
      });
      ticket.description = req.body.description;
    }

    if (req.body.assignedTo !== undefined) {
      ticket.assignedTo = req.body.assignedTo || null;
    }

    if (req.body.dueDate !== undefined) {
      ticket.dueDate = req.body.dueDate || null;
    }

    await ticket.save();
    await ticket.populate('assignedTo', 'name email');
    req.app.get("io").to(ticket.project.toString()).emit("ticket-updated", ticket);
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE — with socket emit
app.delete('/tickets/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    const projectId = ticket.project.toString();
    await Ticket.findByIdAndDelete(req.params.id);
    req.app.get("io").to(projectId).emit("ticket-deleted", req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ BEFORE /:id
app.post('/tickets/:id/comments', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });
    ticket.comments.push({
      text: text.trim(),
      author: user._id,
      authorName: user.name,
    });
    ticket.activity.push({
      text: `${user.name} added a comment`,
      authorName: user.name,
    });
    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ BEFORE /:id
app.delete('/tickets/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    ticket.comments = ticket.comments.filter(
      c => c._id.toString() !== req.params.commentId
    );
    ticket.activity.push({
      text: `${user.name} deleted a comment`,
      authorName: user.name,
    });
    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ALWAYS LAST
app.get('/tickets/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('assignedTo', 'name email');
    if (!ticket) return res.status(404).json({ message: "Ticket not found ❌" });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});