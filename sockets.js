let readyPlayerCount = 0;
const rooms = {}; // Store rooms and players

function listen(io) {
 const pongNamespace = io.of("/pong");

 pongNamespace.on("connection", (socket) => {
  let room;

  console.log("a user connected", socket.id);

  socket.on("ready", () => {
   // Check if there is an available room with 1 player
   const availableRoom = Object.keys(rooms).find(
    (room) => rooms[room].length === 1
   );
   if (availableRoom) {
    room = availableRoom;
    rooms[room].push(socket.id);
   } else {
    // Create a new room
    room = "room" + Math.floor(readyPlayerCount / 2);
    rooms[room] = [socket.id];
   }

   socket.join(room);
   console.log("Player ready", socket.id, room);

   readyPlayerCount++;

   if (readyPlayerCount % 2 === 0) {
    pongNamespace.in(room).emit("startGame", socket.id);
   }
  });

  socket.on("paddleMove", (paddleData) => {
   socket.to(room).emit("paddleMove", paddleData);
  });

  socket.on("ballMove", (ballData) => {
   socket.to(room).emit("ballMove", ballData);
  });

  socket.on("disconnect", (reason) => {
   console.log(`Client ${socket.id} disconnected: ${reason}`);
   // Check if the room exists before trying to modify it
   if (room && rooms[room]) {
    // Remove the player from the room
    rooms[room] = rooms[room].filter((player) => player !== socket.id);

    // Emit a refreshPage event to all clients in the room
    pongNamespace.in(room).emit("refreshPage");

    // If no players are left in the room, delete the room
    if (rooms[room].length === 0) {
     delete rooms[room];
    }
   }

   readyPlayerCount--;
  });
 });
}

module.exports = {
 listen,
};
