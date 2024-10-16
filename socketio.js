const express = require("express") //servir rota
const http = require("http")
const sktIo = require("socket.io")

const app = express()

const server = http.createServer(app)

const io = sktIo(server)

io.on("connection", (socket)=>{
    console.log("Usuario conectado " + socket.id)
    socket.on("message", (msg)=> {
        console.log(msg)
        io.emit("message", msg)
    })
})

app.get("/", (req, res)=>{
    res.sendFile(__dirname + "/chat.html" )
})

server.listen(3000)