const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema(
  {
    userID: { type: Number, required: true },
    type: { type: String, required: true },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    joincode: { type: Number, required: true },
    senderID: { type: Number, required: true },
    senderName: { type: String },
    content: { type: String, required: true },
    media: { type: String },
    isAnonymous: { type: Boolean, default: false },

    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },

    reactions: [reactionSchema],

    likes: { type: [Number], default: [] },
    dislikes: { type: [Number], default: [] },
    upvotes: { type: [Number], default: [] },
    downvotes:{ type: [Number], default: [] },    
    flags: { type: [Number], default: [] },
    pinned: { type: Boolean, default: false },
    editedAt: { type: Date },

    sentiment: { type: String },
    side: { type: String, enum: ['proponent', 'opponent', 'neutral'], required: true },
    attachments: [{
    _id: false,
    url: String,
    type: {
      type: String,
      enum: ['image', 'audio', 'video', 'file', 'voice'],
      default: 'file'
    },
    mime: String,
    name: String,
    size: Number,
    duration: Number
  }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);