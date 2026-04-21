const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET all tickets (optionally filter by projectId)
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.projectId) filter.project = req.query.projectId;
    const tickets = await Ticket.find(filter).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'something went wrong' });
  }
});

// GET single ticket by id
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'something went wrong' });
  }
});

// POST create ticket
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { title, description, priority, status, projectId } = req.body;

    const ticket = new Ticket({
      title,
      description,
      priority,
      status: status || 'todo',
      project: projectId,
      activity: [{
        text: `Ticket created by ${user.name}`,
        authorName: user.name,
      }]
    });

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'something went wrong' });
  }
});

// PUT update ticket — logs activity when status or priority changes
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'ticket not found' });

    const statusLabels = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };

    // ✅ log status change
    if (req.body.status && req.body.status !== ticket.status) {
      ticket.activity.push({
        text: `${user.name} changed status from "${statusLabels[ticket.status]}" → "${statusLabels[req.body.status]}"`,
        authorName: user.name,
      });
      ticket.status = req.body.status;
    }

    // ✅ log priority change
    if (req.body.priority && req.body.priority !== ticket.priority) {
      ticket.activity.push({
        text: `${user.name} changed priority from "${ticket.priority}" → "${req.body.priority}"`,
        authorName: user.name,
      });
      ticket.priority = req.body.priority;
    }

    // ✅ log title change
    if (req.body.title && req.body.title !== ticket.title) {
      ticket.activity.push({
        text: `${user.name} updated the title`,
        authorName: user.name,
      });
      ticket.title = req.body.title;
    }

    // ✅ log description change
    if (req.body.description !== undefined && req.body.description !== ticket.description) {
      ticket.activity.push({
        text: `${user.name} updated the description`,
        authorName: user.name,
      });
      ticket.description = req.body.description;
    }

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'something went wrong' });
  }
});

// DELETE ticket
router.delete('/:id', auth, async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: 'deleted' });
  } catch (err) {
    res.status(500).json({ message: 'something went wrong' });
  }
});

// POST add comment to ticket
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'ticket not found' });

    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'comment cannot be empty' });

    // ✅ add comment
    ticket.comments.push({
      text: text.trim(),
      author: user._id,
      authorName: user.name,
    });

    // ✅ log activity for comment
    ticket.activity.push({
      text: `${user.name} added a comment`,
      authorName: user.name,
    });

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'something went wrong' });
  }
});

// DELETE comment
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'ticket not found' });

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
    res.status(500).json({ message: 'something went wrong' });
  }
});

module.exports = router;