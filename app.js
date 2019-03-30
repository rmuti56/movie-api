var createError = require('http-errors');
var mongoose = require('mongoose');
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiMovieRouter = require('./routes/movie')
mongoose.connect('mongodb+srv://admin:admin@mongodb-sw7se.mongodb.net/member_db?retryWrites=true');

var app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/movie', apiMovieRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;