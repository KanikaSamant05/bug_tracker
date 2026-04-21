const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: String,
}, { timestamps: true });

const activitySchema = new mongoose.Schema({
  text: String,       // e.g. "Status changed from To Do → In Progress"
  authorName: String,
}, { timestamps: true });

const ticketSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: {
    type: String,
    enum: ['todo', 'inprogress', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical']
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  comments: [commentSchema],      
  activity: [activitySchema],     
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);