const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const httpServer = createServer(app);

// Enable CORS for the client
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST"]
}));

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store connected players
const players = new Map();

// Character colors for visual distinction
const characterColors = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
  '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
  '#f1c40f', '#e91e63', '#00bcd4', '#4caf50'
];

let colorIndex = 0;

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Assign a color to the new player
  const playerColor = characterColors[colorIndex % characterColors.length];
  colorIndex++;
  
  // Create new player data
  const newPlayer = {
    id: socket.id,
    position: { x: 0, y: 0.5, z: 0 }, // Starting position
    color: playerColor,
    isMoving: false,
    path: [],
    name: `Player ${players.size + 1}`
  };
  
  // Add player to the players map
  players.set(socket.id, newPlayer);
  
  // Send the current player their own data
  socket.emit('playerData', newPlayer);
  
  // Send all existing players to the new player
  const existingPlayers = Array.from(players.values()).filter(p => p.id !== socket.id);
  socket.emit('existingPlayers', existingPlayers);
  
  // Notify all other players about the new player
  socket.broadcast.emit('playerJoined', newPlayer);
  
  console.log(`Total players: ${players.size}`);

  // Handle player movement
  socket.on('playerMove', (data) => {
    const player = players.get(socket.id);
    if (player) {
      // Update player's movement data
      player.position = data.position;
      player.path = data.path;
      player.isMoving = data.isMoving;
      
      // Broadcast movement to all other players
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        position: data.position,
        path: data.path,
        isMoving: data.isMoving
      });
      
      console.log(`Player ${socket.id} moved to`, data.position);
    }
  });
  
  // Handle player stopping
  socket.on('playerStop', (data) => {
    const player = players.get(socket.id);
    if (player) {
      player.position = data.position;
      player.isMoving = false;
      player.path = [];
      
      socket.broadcast.emit('playerStopped', {
        id: socket.id,
        position: data.position
      });
      
      console.log(`Player ${socket.id} stopped at`, data.position);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Remove player from the map
    players.delete(socket.id);
    
    // Notify all other players about the disconnection
    socket.broadcast.emit('playerLeft', socket.id);
    
    console.log(`Total players: ${players.size}`);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Multiplayer server running on port ${PORT}`);
  console.log(`🎮 Ready for players to connect!`);
});