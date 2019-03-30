var mongoose = require('mongoose')
var membersSchema = mongoose.Schema({
  firstname: {
    type: String,
    required: true
  },
  lastname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  position: {
    type: String,
  },
  image: {
    type: String,
  },
  role: {
    type: Number,
    required: true
  },
  created: {
    type: Date
  },
  updated: {
    type: Date,
    require: true
  }
}, {
  versionKey: false
})

var users = mongoose.model('members', membersSchema);

module.exports = users;