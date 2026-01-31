const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Improve security later
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.send('Arena Warga Backend is Running!');
});

const roomManager = new (require('./game/RoomManager'))(io);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('createRoom', ({ playerName, settings }, callback) => {
        const roomId = roomManager.createRoom(socket.id, playerName, settings);
        socket.join(roomId);
        callback({ roomId });
        console.log(`Room ${roomId} created by ${playerName}`);
    });

    socket.on('joinRoom', ({ roomId, playerName }, callback) => {
        const result = roomManager.joinRoom(roomId, socket.id, playerName);
        if (result.error) {
            callback({ error: result.error });
        } else {
            socket.join(roomId);
            io.to(roomId).emit('playerJoined', result.room.players);
            callback({ success: true, room: result.room });
            console.log(`${playerName} joined room ${roomId}`);
        }
    });

    socket.on('startGame', ({ roomId }) => {
        const room = roomManager.startGame(roomId);
        if (room) {
            io.to(roomId).emit('gameStart', {
                location: room.locations[0],
                totalRounds: room.totalRounds,
                currentRound: 1,
                gameMode: room.gameMode,
                timeLimit: room.timeLimit
            });
        }
    });

    socket.on('submitGuess', ({ roomId, lat, lng }) => {
        const result = roomManager.submitGuess(roomId, socket.id, lat, lng);
        if (result && result.waiting) {
            // Notify player we are waiting for opponent
            socket.emit('guessAccepted');
        }
    });

    socket.on('nextRound', ({ roomId }) => {
        // Only host can maybe start next round, or auto?
        // For simplicity, let any player trigger specific next round event if we want manual progression
        // Or RoomManager handles it.
        roomManager.startNextRound(roomId);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Handle disconnection logic (remove from rooms)
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

