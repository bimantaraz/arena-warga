import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

// Initialize socket outside component to prevent multiple connections
export const socket = io('http://localhost:3000');

function Lobby() {
    const [playerName, setPlayerName] = useState('');
    const [roomId, setRoomId] = useState('');
    const navigate = useNavigate();

    const createRoom = () => {
        if (!playerName) return alert('Masukkan nama dulu!');
        socket.emit('createRoom', { playerName }, (response) => {
            navigate(`/game/${response.roomId}`, { state: { playerName, isHost: true } });
        });
    };

    const joinRoom = () => {
        if (!playerName || !roomId) return alert('Masukkan nama dan Room ID!');
        socket.emit('joinRoom', { roomId, playerName }, (response) => {
            if (response.error) {
                alert(response.error);
            } else {
                navigate(`/game/${roomId}`, { state: { playerName, isHost: false } });
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
                <h1 className="text-4xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                    🌍 Arena Warga<span className="text-white ml-2 text-2xl">🇮🇩</span>
                </h1>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Nama Pemain</label>
                    <input
                        type="text"
                        placeholder="Masukkan nama anda..."
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500 text-white"
                    />
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-700/50">
                        <h3 className="text-lg font-semibold mb-3 text-gray-300">Buat Room Baru</h3>
                        <button
                            onClick={createRoom}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transform transition-transform hover:scale-[1.02] shadow-lg"
                        >
                            Buat Room
                        </button>
                    </div>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-600"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">ATAU</span>
                        <div className="flex-grow border-t border-gray-600"></div>
                    </div>

                    <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-700/50">
                        <h3 className="text-lg font-semibold mb-3 text-gray-300">Gabung Room</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="ID Room"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-white uppercase placeholder-gray-500"
                            />
                            <button
                                onClick={joinRoom}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
                            >
                                Gabung
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Lobby;
