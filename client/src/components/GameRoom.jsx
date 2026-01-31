import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { socket } from './Lobby';
import StreetView from './StreetView';
import GuessMap from './GuessMap';

function GameRoom() {
    const { roomId } = useParams();
    const { state } = useLocation();
    const [players, setPlayers] = useState([]);
    const [gameStatus, setGameStatus] = useState('waiting'); // waiting, playing, finished
    const [currentLocation, setCurrentLocation] = useState(null);
    const [hasGuessed, setHasGuessed] = useState(false);

    // Derived state
    const isHost = state?.isHost;

    const [roundResult, setRoundResult] = useState(null);
    const [isGameOver, setIsGameOver] = useState(false);

    useEffect(() => {
        // Listen for events
        socket.on('playerJoined', (updatedPlayers) => {
            setPlayers(updatedPlayers);
        });

        socket.on('gameStart', (data) => {
            setGameStatus('playing');
            setCurrentLocation(data.location);
            setHasGuessed(false);
            setRoundResult(null); // Clear previous results
        });

        socket.on('guessAccepted', () => {
            // Wait for opponent
        });

        socket.on('roundResult', (data) => {
            setRoundResult(data);
            setPlayers(prev => prev.map(p => {
                const res = data.results.find(r => r.id === p.id);
                return res ? { ...p, score: res.totalScore } : p;
            }));

            if (data.isGameOver) {
                setIsGameOver(true);
            }
        });

        return () => {
            socket.off('playerJoined');
            socket.off('gameStart');
            socket.off('guessAccepted');
            socket.off('roundResult');
        };
    }, []);

    const startGame = () => {
        socket.emit('startGame', { roomId });
    };

    const nextRound = () => {
        socket.emit('nextRound', { roomId });
    };

    const handleGuess = (latlng) => {
        socket.emit('submitGuess', { roomId, lat: latlng.lat, lng: latlng.lng });
        setHasGuessed(true);
    };

    return (
        <div className="relative h-screen w-full overflow-hidden bg-gray-900 font-sans select-none">
            {/* Top Bar - HUD */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent pt-4 pb-8 px-6 flex justify-between items-start pointer-events-none">
                <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-auto">
                    <span className="text-blue-400 font-bold tracking-wider text-xs uppercase">Room</span>
                    <span className="text-white font-mono font-bold text-lg">{roomId}</span>
                </div>

                <div className="flex gap-4">
                    {players.map((p, idx) => (
                        <div key={p.id} className={`flex flex-col items-end ${idx === 0 ? 'items-end' : 'items-start'} bg-black/40 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/10 pointer-events-auto min-w-[120px]`}>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{p.name}</span>
                            <span className="text-2xl font-black text-white leading-none">{p.score}</span>
                        </div>
                    ))}
                </div>

                {gameStatus === 'waiting' && isHost && (
                    <button
                        onClick={startGame}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-8 py-3 rounded-full font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all pointer-events-auto hover:scale-105 active:scale-95"
                    >
                        Mulai Game
                    </button>
                )}
            </div>

            {gameStatus === 'waiting' && (
                <div className="flex flex-col items-center justify-center h-full text-white space-y-6 bg-gradient-to-br from-indigo-900 to-purple-800">
                    <h1 className="text-5xl font-extrabold tracking-tight">Menunggu Host...</h1>
                    <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-md border border-white/20 text-center">
                        <p className="text-gray-300 mb-2">Kode Room</p>
                        <p className="text-4xl font-mono font-bold tracking-widest text-emerald-400">{roomId}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center">
                        {players.map(p => (
                            <div key={p.id} className="bg-gray-800 px-6 py-3 rounded-xl flex items-center gap-3 border border-gray-700">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-400"></div>
                                <span className="font-semibold text-lg">{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {gameStatus === 'playing' && currentLocation && (
                <>
                    {/* Main Game Area */}
                    <div className="absolute inset-0 z-0">
                        <StreetView location={currentLocation} />
                    </div>

                    {/* Controls & Map Overlay */}
                    {/* The GuessMap is already absolute bottom-left, but we can wrap it if needed or just let it float. */}
                    {/* We only conditionally render it if not waiting for Opponent? Or just show "Waiting" overlay? */}

                    {!hasGuessed && (
                        <GuessMap onGuessConfirm={handleGuess} />
                    )}

                    {hasGuessed && !roundResult && (
                        <div className="absolute bottom-10 left-10 z-20 bg-black/80 text-white px-8 py-4 rounded-xl backdrop-blur-md border border-white/10 animate-pulse">
                            <h3 className="text-xl font-bold">Tebakan Terkirim!</h3>
                            <p className="text-gray-400 text-sm">Menunggu lawan...</p>
                        </div>
                    )}

                    {/* Round Result Overlay */}
                    {roundResult && (
                        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col justify-center items-center text-white backdrop-blur-sm p-8">
                            {isGameOver ? (
                                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-8">GAME OVER!</h1>
                            ) : (
                                <h2 className="text-4xl font-extrabold mb-8 text-emerald-400">ROUND SELESAI!</h2>
                            )}

                            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-2xl w-full shadow-2xl">
                                <div className="text-center mb-8 pb-8 border-b border-gray-700">
                                    <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">LOKASI ASLI</p>
                                    <p className="text-3xl font-bold">{roundResult.targetLocation.name}</p>
                                </div>

                                <div className="space-y-4">
                                    {roundResult.results.map((r, idx) => (
                                        <div key={r.id} className="flex justify-between items-center bg-gray-700/50 p-4 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="font-bold text-lg">{idx + 1}. {r.name}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-emerald-400 font-bold text-xl">+{r.scoreAdded} pts</div>
                                                <div className="text-gray-400 text-sm">{(r.distance).toFixed(2)} km</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8 flex gap-4">
                                {!isGameOver && isHost && (
                                    <button
                                        onClick={nextRound}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-lg flex items-center gap-2"
                                    >
                                        Lanjut Round Berikutnya <span>&rarr;</span>
                                    </button>
                                )}
                                {isGameOver && (
                                    <button
                                        onClick={() => window.location.href = '/'}
                                        className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-full font-bold text-lg transition-colors border border-gray-600"
                                    >
                                        Kembali ke Lobby
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default GameRoom;
