const locationService = require('./LocationService');

class RoomManager {
    constructor(io) {
        this.io = io;
        this.rooms = new Map(); // roomId -> { players: [], state: 'waiting', locations: [], currentRound: 0 }
    }

    createRoom(hostId, playerName, settings = {}) {
        const roomId = this.generateRoomId();
        const room = {
            id: roomId,
            players: [{
                id: hostId,
                name: playerName,
                score: 0,
                hp: 5000 // Battle Royale HP
            }],
            state: 'waiting',
            locations: [],
            currentRound: 0,

            // Default Settings
            totalRounds: settings.totalRounds || 5,
            category: settings.category || 'all',
            timeLimit: settings.timeLimit || 0, // 0 = unlimited
            gameMode: settings.gameMode || 'normal', // normal or battle-royale

            timerInterval: null,
            timeLeft: 0
        };
        this.rooms.set(roomId, room);
        return roomId;
    }

    joinRoom(roomId, playerId, playerName) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Room not found' };
        if (room.state !== 'waiting') return { error: 'Game already active' };
        if (room.players.length >= 2) return { error: 'Room full' };

        room.players.push({
            id: playerId,
            name: playerName,
            score: 0,
            hp: 5000
        });
        return { success: true, room };
    }

    // ... leaveRoom uses existing logic ...

    startGame(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        // Generate filtered locations
        const locations = [];
        for (let i = 0; i < room.totalRounds; i++) {
            locations.push(locationService.getRandomLocation(room.category));
        }
        room.locations = locations;
        room.state = 'playing';
        room.currentRound = 0;

        // Start Timer logic if needed (future implementation)

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

        // 1. Calculate Distances
        const roundResults = room.players.map(p => {
            const distance = locationService.calculateDistance(
                p.lastGuess ? p.lastGuess.lat : 0,
                p.lastGuess ? p.lastGuess.lng : 0,
                target.lat, target.lng
            );
            // In case of no guess (timer), penalty distance? For now assume guess exists.

            const score = locationService.calculateScore(distance);

            // Only add score if Normal Mode
            if (room.gameMode === 'normal') {
                p.score += score;
            }

            return {
                id: p.id,
                name: p.name,
                guess: p.lastGuess,
                distance,
                scoreAdded: score,
                totalScore: p.score,
                hp: p.hp // snapshot current HP
            };
        });

        // 2. Battle Royale Logic (HP Reduction)
        if (room.gameMode === 'battle-royale' && roundResults.length === 2) {
            const p1 = roundResults[0];
            const p2 = roundResults[1];

            // Determine winner of round (closest distance)
            if (p1.distance < p2.distance) {
                const damage = locationService.calculateDamage(p1.distance, p2.distance);
                room.players[1].hp -= damage; // P2 takes damage
                if (room.players[1].hp < 0) room.players[1].hp = 0;
            } else {
                const damage = locationService.calculateDamage(p2.distance, p1.distance);
                room.players[0].hp -= damage; // P1 takes damage
                if (room.players[0].hp < 0) room.players[0].hp = 0;
            }
        }

        // Update results with new HP
        roundResults.forEach(r => {
            const p = room.players.find(rp => rp.id === r.id);
            r.hp = p.hp;
        });

        room.currentRound++;

        // Check for Game Over conditions
        let isGameOver = false;

        // Condition A: Max Rounds reached
        if (room.currentRound >= room.totalRounds) {
            isGameOver = true;
        }

        // Condition B: Battle Royale Death
        if (room.gameMode === 'battle-royale') {
            if (room.players.some(p => p.hp <= 0)) {
                isGameOver = true;
            }
        }

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
            currentRound: room.currentRound + 1,
            gameMode: room.gameMode,
            timeLimit: room.timeLimit
        });
    }

    resetGame(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        room.state = 'waiting';
        room.currentRound = 0;
        room.locations = [];
        room.players.forEach(p => {
            p.score = 0;
            p.hp = 5000;
            p.hasGuessed = false;
            p.lastGuess = null;
        });

        return room;
    }

    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
}

module.exports = RoomManager;
