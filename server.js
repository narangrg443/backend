const express = require('express');
const http = require("http");
const app = express();
const server = http.createServer(app);
const path = require('path');
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log("A new user ");


  socket.emit("user", "a new user is connected: ");
  
  //receive chat
  socket.on("send-data", (e,f)=> {
    socket.broadcast.emit("receive", e,f);
  })

  //receive typeing information
  socket.on('typing',e=>{
    socket.broadcast.emit("typing-get",e);
  })
  


});
 const port=process.ev.PORT || 3000;


server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
13.