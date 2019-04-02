var mongoose = require('mongoose');
var movieSchema = mongoose.Schema({
  nameMovie: {
    type: String,
    required: true
  },
  linkPreview: {
    type: String,
    required: true
  },
  soundTrack: {
    type: String,
    required: true
  },
  resolution: {
    type: String,
    required: true
  },
  group: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  idImageUpload: {
    type: String,
    required: true
  },
  idVideoUpload: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  created: Date,
  updated: {
    type: Date,
    required: true
  }

}, {
  versionKey: false
})

var movies = mongoose.model('movies', movieSchema)
module.exports = movies;