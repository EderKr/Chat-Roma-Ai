const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();

const servidor = http.createServer(app);

const io = socketIo(servidor);

io.on("connection", (socket) => {
  console.log("Novo cliente conectador" + socket.io);
  });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/chat.html");
})

//socketio

server.listen(3000)