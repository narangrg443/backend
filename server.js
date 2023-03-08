const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// serve static files from public directory
//app.use(express.static('public'));

// listen for incoming socket connections

app.get("/", (req, res)=> {
  res.sendFile(__dirname+'/index.html');
})

io.on('connection', function(socket) {
  console.log('a user connected');
 

  // listen for incoming messages from client
  socket.on('message', function(data) {
    console.log('message received: ' + data);
    // broadcast message to all connected clients
    socket.broadcast.emit('message', data);
  });

  // handle socket disconnection
  socket.on('disconnect', function() {
    console.log('user disconnected');
  });
});

// start server
const port = process.env.PORT || 3000;
server.listen(port, function() {
  console.log(`listening on *:${port}`);
});