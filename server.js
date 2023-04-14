const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));


// Serve index.html as the home page
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});




// Listen for incoming socket connections
io.on('connection', function(socket) {
 // console.log('a user connected');

  // Listen for incoming messages from client
  socket.on('message', function(data) {
   // console.log('message received: ' + data);
    // Broadcast message to all connected clients
    socket.broadcast.emit('message', data);
  });

  // Handle socket disconnection
  socket.on('disconnect', function() {
    console.log('user disconnected');
  });
  
  
  
  socket.on("user-connect",username=>{
    console.log("connects")
    
    const message="connected to chat";
    socket.broadcast.emit("message",{username,message})
  })
});

// Start server
const port = process.env.PORT || 3000;
server.listen(port, function() {
  console.log(`listening on *:${port}`);
});
