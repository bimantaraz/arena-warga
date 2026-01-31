const locationService = require('./LocationService');

class RoomManager {
    constructor(io) {
        this.io = io;
        this.rooms = new Map(); // roomId -> { players: [], state: 'waiting', locations: [], currentRound: 0 }
    }

    createRoom(hostId, playerName) {
        const roomId = this.generateRoomId();
        const room = {
            id: roomId,
            players: [{ id: hostId, name: playerName, score: 0 }],
            state: 'waiting',
            locations: [], // Will be filled when game starts
            currentRound: 0,
            totalRounds: 5
        };
        this.rooms.set(roomId, room);
        return roomId;
    }

    joinRoom(roomId, playerId, playerName) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Room not found' };
        if (room.state !== 'waiting') return { error: 'Game already active' };
        if (room.players.length >= 2) return { error: 'Room full' }; // Limit to 2 for Duel

        room.players.push({ id: playerId, name: playerName, score: 0 });
        return { success: true, room };
    }

    leaveRoom(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.players = room.players.filter(p => p.id !== playerId);
        if (room.players.length === 0) {
            this.rooms.delete(roomId);
        } else {
            // Notify other player?
            this.io.to(roomId).emit('playerLeft', playerId);
        }
    }

    startGame(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        // Generate dynamic locations
        const locations = [];
        for (let i = 0; i < room.totalRounds; i++) {
            locations.push(locationService.getRandomLocation());
        }
        room.locations = locations;
        room.state = 'playing';
        room.currentRound = 0;

        return room;
    }

    submitGuess(roomId, playerId, lat, lng) {
        const room = this.rooms.get(roomId);
        if (!room || room.state !== 'playing') return null;

        const player = room.players.find(p => p.id === playerId);
        if (!player) return null;

        // Prevent double guess
        if (player.hasGuessed) return null;

        player.lastGuess = { lat, lng };
        player.hasGuessed = true;

        // Check if all players guessed
        const allGuessed = room.players.every(p => p.hasGuessed);
        if (allGuessed) {
            return this.finishRound(roomId);
        }
        return { waiting: true };
    }

    finishRound(roomId) {
        const room = this.rooms.get(roomId);
        const target = room.locations[room.currentRound];

        const roundResults = room.players.map(p => {
            const distance = locationService.calculateDistance(
                p.lastGuess.lat, p.lastGuess.lng,
                target.lat, target.lng
            );
            const score = locationService.calculateScore(distance);
            p.score += score;
            return {
                id: p.id,
                name: p.name,
                guess: p.lastGuess,
                distance,
                scoreAdded: score,
                totalScore: p.score
            };
        });

        room.currentRound++;
        const isGameOver = room.currentRound >= room.totalRounds;

        if (isGameOver) {
            room.state = 'finished';
        } else {
            // Reset for next round
            room.players.forEach(p => {
                p.hasGuessed = false;
                p.lastGuess = null;
            });
        }

        this.io.to(roomId).emit('roundResult', {
            results: roundResults,
            targetLocation: target,
            isGameOver,
            nextRound: room.currentRound + 1
        });

        return { completed: true };
    }

    startNextRound(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.state === 'finished') return;

        // Helper to emit next round start
        this.io.to(roomId).emit('gameStart', {
            location: room.locations[room.currentRound],
            totalRounds: room.totalRounds,
            currentRound: room.currentRound + 1
        });
    }

    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
}

module.exports = RoomManager;
