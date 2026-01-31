import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

// Initialize socket outside component to prevent multiple connections
export const socket = io('http://localhost:3000');

function Lobby() {
    const [playerName, setPlayerName] = useState('');
    const [roomId, setRoomId] = useState('');
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('create');

    const [settings, setSettings] = useState({
        totalRounds: 5,
        category: 'all',
        timeLimit: 0,
        gameMode: 'normal'
    });



    const createRoom = () => {
        if (!playerName) return alert('Nama pemain wajib diisi!');
        socket.emit('createRoom', { playerName, settings }, (response) => {
            navigate(`/game/${response.roomId}`, {
                state: {
                    playerName,
                    isHost: true,
                    players: response.players
                }
            });
        });
    };

    const joinRoom = () => {
        if (!playerName) return alert('Nama pemain wajib diisi!');
        if (!roomId) return alert('Room ID wajib diisi!');

        socket.emit('joinRoom', { roomId, playerName }, (response) => {
            if (response.error) {
                alert(response.error);
            } else {
                navigate(`/game/${roomId}`, {
                    state: {
                        playerName,
                        isHost: false,
                        players: response.players
                    }
                });
            }
        });
    };



    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 font-sans">
            <div className="max-w-2xl w-full bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-700">
                <h1 className="text-5xl font-extrabold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 tracking-tight">
                    ARENA WARGA <span className="text-white ml-2 text-3xl align-top">🇮🇩</span>
                </h1>

                <div className="mb-8 bg-gray-700/50 p-6 rounded-2xl border border-gray-600">
                    <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wide">Nama Pemain</label>
                    <input
                        type="text"
                        placeholder="Masukkan nama anda..."
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none transition-all placeholder-gray-500 text-white text-lg font-bold"
                    />
                </div>

                <div className="flex gap-4 border-b border-gray-700 mb-6">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`flex-1 pb-3 text-lg font-bold border-b-2 transition-colors ${activeTab === 'create' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Buat Room
                    </button>
                    <button
                        onClick={() => setActiveTab('join')}
                        className={`flex-1 pb-3 text-lg font-bold border-b-2 transition-colors ${activeTab === 'join' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Gabung Room
                    </button>
                </div>

                <div className="min-h-[400px]">
                    {activeTab === 'create' ? (
                        <div className="space-y-4 animate-fadeIn">
                            {/* Settings Form */}
                            <div className="space-y-3 bg-gray-700/30 p-4 rounded-xl border border-gray-700">
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase">Total Rounds</label>
                                    <select
                                        value={settings.totalRounds}
                                        onChange={(e) => setSettings({ ...settings, totalRounds: parseInt(e.target.value) })}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                                    >
                                        <option value="3">3 Ronde</option>
                                        <option value="5">5 Ronde</option>
                                        <option value="10">10 Ronde</option>
                                        <option value="20">20 Ronde</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase">Kategori Lokasi</label>
                                    <select
                                        value={settings.category}
                                        onChange={(e) => setSettings({ ...settings, category: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                                    >
                                        <option value="all">Semua Indonesia 🇮🇩</option>
                                        <option value="java-bali">Jawa & Bali 🌋</option>
                                        <option value="sumatera">Sumatera 🐅</option>
                                        <option value="city">Kota Besar 🏙️</option>
                                        <option value="extreme">Extreme / Pedesaan 🌲</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase">Timer (per round)</label>
                                    <select
                                        value={settings.timeLimit}
                                        onChange={(e) => setSettings({ ...settings, timeLimit: parseInt(e.target.value) })}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                                    >
                                        <option value="0">Unlimited (Santai)</option>
                                        <option value="30">30 Detik (Rush)</option>
                                        <option value="60">60 Detik (Normal)</option>
                                        <option value="180">3 Menit</option>
                                        <option value="300">5 Menit</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase">Game Mode</label>
                                    <div className="flex gap-2 mt-1">
                                        <button
                                            onClick={() => setSettings({ ...settings, gameMode: 'normal' })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold border ${settings.gameMode === 'normal' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                                        >
                                            CLASSIC
                                        </button>
                                        <button
                                            onClick={() => setSettings({ ...settings, gameMode: 'battle-royale' })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold border ${settings.gameMode === 'battle-royale' ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                                        >
                                            BATTLE ROYALE
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={createRoom}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] active:scale-95 text-lg"
                            >
                                Buat Room
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fadeIn h-full flex flex-col justify-center">
                            <div className="bg-gray-700/30 p-6 rounded-xl border border-gray-700">
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Masukkan Room ID</label>
                                <input
                                    type="text"
                                    placeholder="X Y Z 1 2 3"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg focus:border-blue-500 outline-none text-white font-mono text-center text-2xl uppercase tracking-[0.2em] mb-4"
                                />
                                <button
                                    onClick={joinRoom}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.02] active:scale-95 text-lg uppercase"
                                >
                                    Gabung Game
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Lobby;
