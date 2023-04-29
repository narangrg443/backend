const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const ejs = require('ejs');
const mongoose = require("mongoose")

const session = require('express-session');
const passport = require('passport')


const LocalStrategy = require('passport-local').Strategy;


const passportLocalMongoose = require('passport-local-mongoose')
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const dotenv = require('dotenv').config()


let users = 0;
// Serve static files from the public directory
app.use(express.static("public", {
  extended: true
}));


app.use(express.urlencoded({
  extended: true
}));


app.set('view engine', 'ejs');


app.use(session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("Connected to MongoDB");
})
.catch((err) => {
  console.log("Failed to connect to MongoDB", err);
});



const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  receiverName: [String],
  msgS: [String],
  msgR: [String]

});

userSchema.plugin(passportLocalMongoose);

const chatUser = mongoose.model('chatUser', userSchema);

// Configure Passport for local authentication
passport.use(new LocalStrategy(chatUser.authenticate()));
passport.serializeUser(chatUser.serializeUser());
passport.deserializeUser(chatUser.deserializeUser());




app.get('/home', isAuthenticated, function(req, res) {

  io.emit('user-login', req.user.username);
  res.render('chat', {
    user: req.user || {}
  })
});




app.get('/register', function(req, res) {
  res.render('register', {
    user: req.user
  })
});

app.get('/', function(req, res) {
  res.render('login', {
    message: null
  });
});


app.get('/logout', function(req, res) {




  io.emit('user-logout', req.user.username || {});


  req.logout(function(err) {
    if (err) {
      console.log(err);
      return next(err);
    }
    req.session.destroy(function(err) {
      if (err) {
        console.log(err);
        return next(err);
      } else {

        //io.emit('user-logout', req.user.username || {});
      }


      res.redirect('/');
    });
  });
});

/*
app.post('/login', passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/'
}), function(req, res) {
  // Send event to client
  io.emit('user-login', req.user.username);
});
*/


app.post('/login', passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/'

}));






app.post('/register', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  chatUser.register(new chatUser({
    username
  }), password, (err,
    user) => {
    if (err) {
      res.render('register', {
        message: err.message
      });
    } else {
      passport.authenticate('local')(req, res, () => {
        res.redirect('/home');
      });
    }
  });
});


app.post('/', (req, res)=> {
  res.render('login',
    {
      message: "login fail"
    })
})


app.post("/home", isAuthenticated, (req, res) => {
  //save messages to mongoose

  // Redirect to home.html with username in the query string
  res.redirect('/home');
});





function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    // If user is authenticated, call next to continue with the request
    return next();
  }

  // If user is not authenticated, redirect to login page
  res.redirect('/login');
}







// Listen for incoming socket connections
io.on('connection', function(socket) {



  // Listen for incoming messages from client

  socket.on('message',
    function(data) {
      // console.log('message received: ' + data);
      // Broadcast message to all connected clients
      socket.broadcast.emit('message', data);
    });

  // Handle socket disconnection


  socket.on('disconnect', function() {

    console.log('user disconnected');
  });






});





// Start server
const port = process.env.PORT || 3000;
server.listen(port, function() {
  console.log(`listening on *:${port}`);
});