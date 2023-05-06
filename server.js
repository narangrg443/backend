const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const ejs = require('ejs');
const mongoose = require("mongoose")

const session = require('express-session');
const passport = require('passport')





const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const passportLocalMongoose = require('passport-local-mongoose')
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const dotenv = require('dotenv').config()





let users = 0;
let username = null;
// Serve static files from the public directory
app.use(express.static("public", {
  extended: true
}));

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));


app.set('view engine', 'ejs');

/*
 app.use(session({
    secret: process.env.GOOGLE_SECRECT,
    resave: true,
    saveUninitialized: true
  }));
*/

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

const messagesSchema = new mongoose.Schema({
  name: String,
  msg: String,
  timeStamp: {
    type: Date,
    default: Date.now
    }

  });


  const msgSchema = new mongoose.Schema({
    msg: [messagesSchema]
  })



  const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String

  });


  userSchema.plugin(passportLocalMongoose);

  const chatUser = mongoose.model('chatUser', userSchema);
  const Msg = new mongoose.model('Msg', msgSchema);

  // Configure Passport for local authentication
  passport.use(new LocalStrategy(chatUser.authenticate()));
  passport.serializeUser(chatUser.serializeUser());
  passport.deserializeUser(chatUser.deserializeUser());


  // server.JSON








  // Configure passport middl
  app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile']
  }));

  app.get('/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/login'
    }),
    (req, res) => {
      // Successful authentication, redirect home.
      res.redirect('/home');
    });



  app.get('/home', isAuthenticated, async function(req, res) {

    await Msg.findOne({})
    .then((e)=> {
      if (e) {
        io.emit('user-login', req.user.username);
        res.render('chat', {
          user: req.user || {}, msg: e || {}
        })
        //console.log('msg',e)
      } else {
        io.emit('user-login', req.user.username);
        res.render('chat', {
          user: req.user || {}, msg: null
        })
      }
    })
    .catch((err)=> {
      console.log(err);
    })


  });



  passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET_ID,
    callbackURL: "/auth/google/callback"
  },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await chatUser.findOne({
          googleId: profile.id
        });
        if (!user) {
          // User not found, check if there is a local user with the same username
          const localUser = await chatUser.findOne({
            username: profile.displayName
          });
          if (!localUser) {
            // No local user found, create a new user with Google ID
            const newUser = new chatUser({
              googleId: profile.id,
              username: profile.displayName
            });
            await newUser.save();
            done(null, newUser);
          } else {
            // Local user found, update their record with Google ID
            localUser.googleId = profile.id;
            await localUser.save();
            done(null, localUser);
          }
        } else {
          // User found, just log them in
          done(null, user);
        }
      } catch (err) {
        done(err);
      }
    }
  ));


  /*

app.get('/home', isAuthenticated, async function(req, res) {
  try {
    const msgObj = await Msg.findOne({});
    io.emit('user-login', req.user.username);
    console.log("obg",msgObj)
    res.render('chat', {
      user: req.user || {},
      msg: msgObj || {}
    });
  } catch (err) {
    console.log("Error fetching message object: ", err);
    res.status(500).send("Internal Server Error");
  }
});
*/


  app.get('/register', function(req, res) {
    res.render('register',
      {
        user: req.user
      })
  });

  app.get('/', function(req, res) {
    res.render('login',
      {
        message: null
      });
  });

  app.get('/login', (req, res)=> {
    res.redirect('/')
  })


  app.get('/logout', function(req, res) {




    io.emit('user-logout',
      req.user.username || {});

    
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
    //  successRedirect: '/home',
    failureRedirect: '/'

  }), (req, res)=> {
    const {
      username, password
    } = req.body;
    console.log('logged sucessful', username);
    res.redirect('/home');
  });






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
      function({
        username, message
      }) {

        data = {
          username, message
        };
        // assuming you have imported and defined the Msg model and message object somewhere above

        Msg.findOne({}) // find any document in the Msg collection
        .then((foundMsg) => {
          if (foundMsg) {
            // if document exists
            foundMsg.msg.push({
              name: username, msg: message
            }); // add new message object to the existing msg array
            return foundMsg.save(); // update and save the document
          } else {
            // if document doesn't exist
            const newMsg = new Msg({
              msg: [{
                name: username, msg: message
              }]}); // create a new document with the message object
            return newMsg.save(); // save the new document
          }
        })
        .then((savedMsg) => {
          // console.log('Message saved:', savedMsg); // log the saved or updated document
        })
        .catch((error) => {
          console.error('Error saving message:', error); // log any errors
        });


        socket.broadcast.emit('message',
          data);


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