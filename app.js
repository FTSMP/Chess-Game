const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const { title } = require("process");
const { log } = require("console");

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let player = {};
let currPlayer = "W";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

server.listen(8080, (req, res) => {
  console.log("Listening on 8080");
});

io.on("connection", (uniquesocket) => {
  console.log("Connected");

  if (!player.white) {
    player.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  } else if (!player.black) {
    player.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
  } else {
    uniquesocket.emit("SpectatorRole");
  }

  uniquesocket.on("disconnect", (req, res) => {
    if (uniquesocket.id === player.white) {
      delete player.white;
    } else if (uniquesocket.id === player.black) {
      delete player.blac;
    }
  });

  uniquesocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniquesocket.id !== player.white) return;
      if (chess.turn() === "b" && uniquesocket.id !== player.black) return;

      const result = chess.move(move);
      if (result) {
        currPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid Move");
        uniquesocket.emit("invalidMove", move);
      }
    } catch (err) {
      console.log(err);
      uniquesocket.emit("Invalid Move : ", move);
    }
  });
});

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});
