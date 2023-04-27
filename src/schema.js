const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  msgSend: [{
    text: String,
    date: {
      type: Date, default: Date.now
      }
    }],
    msgReceived: [{
      text: String,
      date: {
        type: Date, default: Date.now
      }
    }]
  });

  const ChatUser = mongoose.model("ChatUser", userSchema);

  module.exports = ChatUser;