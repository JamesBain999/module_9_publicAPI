const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);

// Store nicknames
const nicknames = {};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  // Set nickname for the user
  socket.on("set nickname", (name) => {
    nicknames[socket.id] = name;
    socket.broadcast.emit("new user", {
      msg: "A user has connected",
      sender: name,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const disconnectedNickname = nicknames[socket.id];
    if (disconnectedNickname) {
      io.emit("chat message", {
        msg: `${disconnectedNickname} disconnected`,
        sender: "Server",
      });
      delete nicknames[socket.id];
      io.emit("user online", Object.values(nicknames));
    }
  });


  // Listen for chat messages
  socket.on("chat message", (data) => {
    // Broadcast the message to all connected clients except the sender
    socket.broadcast.emit("chat message", {
      msg: data.msg,
      sender: nicknames[socket.id],
    });
  });

  // Listen for typing event
  socket.on("typing", () => {
    // Broadcast that the user is typing to other users
    socket.broadcast.emit("user typing", nicknames[socket.id]);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
