const mongoose = require('mongoose');

const debateSchema = new mongoose.Schema({
  joincode: { type: Number, unique: true, required: true }, 
  title: { type: String, required: true },
  topic: { type: String, required: true },
  rules: { type: String, required: true },
  description: { type: String, required: true },
  isPublic: { type: Boolean, default: false },
  instructor: { type: Number, required: true },

  sides: [{
    name: { type: String },
    participants: [{ type: Number }]
  }],

  isAnonymous: { type: Boolean, default: false },
  status: { type: String, enum: ['upcoming', 'active', 'closed'], default: 'upcoming' },

  createdAt: { type: Date, default: Date.now },
  startTime: { type: Date },
  endTime: { type: Date },

  breakoutRooms: [{ type: Number }],
  messages: [{ type: Number }],

  assignedStudents: [
    {
      studentId: { type: Number, required: true },
      side: { type: String, enum: ['proponent', 'opponent', 'neutral'] }
    }
  ],
  
 votes: [{
    proponent: { type: Number, default: 0 },
    opponent:  { type: Number, default: 0 },
    votesProponent: { type: [Number], default: [] },
    votesOpponent:  { type: [Number], default: [] },
  }]
}, { timestamps: true });

module.exports = mongoose.model('Debate', debateSchema);
