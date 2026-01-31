import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { socket } from './Lobby';
import StreetView from './StreetView';
import GuessMap from './GuessMap';
import ResultMap from './ResultMap';

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
        socket.on('playerJoined', (updatedPlayers) => {
            setPlayers(updatedPlayers);
        });

        socket.on('guessAccepted', () => {
            // Wait for opponent
        });

        return () => {
            socket.off('playerJoined');
            socket.off('guessAccepted');
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

    const [copied, setCopied] = useState(false);

    const handleCopyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const [gameConfig, setGameConfig] = useState({
        totalRounds: 5,
        currentRound: 1,
        gameMode: 'normal',
        timeLimit: 0
    });
    const [timeLeft, setTimeLeft] = useState(0);

    // Timer Logic
    useEffect(() => {
        if (gameStatus === 'playing' && gameConfig.timeLimit > 0 && timeLeft > 0 && !hasGuessed) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleGuess({ lat: 0, lng: 0 }); // Auto guess (penalty)
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameStatus, gameConfig.timeLimit, timeLeft, hasGuessed]);

    useEffect(() => {
        socket.on('gameStart', (data) => {
            setGameStatus('playing');
            setCurrentLocation(data.location);
            setHasGuessed(false);
            setRoundResult(null);

            // Set Config
            setGameConfig({
                totalRounds: data.totalRounds,
                currentRound: data.currentRound,
                gameMode: data.gameMode,
                timeLimit: data.timeLimit
            });
            // Reset Timer
            if (data.timeLimit > 0) setTimeLeft(data.timeLimit);
        });

        socket.on('roundResult', (data) => {
            setRoundResult(data);
            setPlayers(prev => prev.map(p => {
                const res = data.results.find(r => r.id === p.id);
                return res ? { ...p, score: res.totalScore, hp: res.hp } : p;
            }));

            if (data.isGameOver) {
                setIsGameOver(true);
            }
        });

        return () => {
            socket.off('gameStart');
            socket.off('roundResult');
        }
    }, []);

    return (
        <div className="relative h-screen w-full overflow-hidden bg-gray-900 font-sans select-none">
            {/* Top Bar - HUD */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent pt-4 pb-8 px-6 flex justify-between items-start pointer-events-none">
                <div className="flex flex-col gap-2 pointer-events-auto">
                    <button
                        onClick={handleCopyRoomId}
                        className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all active:scale-95 group"
                        title="Copy Room ID"
                    >
                        <span className="text-blue-400 font-bold tracking-wider text-xs uppercase">Room</span>
                        <span className="text-white font-mono font-bold text-lg tracking-widest">{roomId}</span>
                        {copied ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>

                    {/* Round Info */}
                    {gameStatus === 'playing' && (
                        <div className="bg-black/40 backdrop-blur-md px-4 py-1 rounded-full border border-white/5 self-start">
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Round {gameConfig.currentRound} / {gameConfig.totalRounds}</span>
                        </div>
                    )}
                </div>

                {/* Timer Display */}
                {gameStatus === 'playing' && gameConfig.timeLimit > 0 && (
                    <div className={`absolute left-1/2 top-4 transform -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-2 rounded-xl border ${timeLeft <= 10 ? 'border-red-500 animate-pulse' : 'border-white/10'}`}>
                        <span className={`text-3xl font-mono font-black ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </span>
                    </div>
                )}

                <div className="flex gap-4">
                    {players.map((p, idx) => (
                        <div key={p.id} className={`flex flex-col items-end ${idx === 0 ? 'items-end' : 'items-start'} bg-black/40 backdrop-blur-md px-6 py-2 rounded-2xl border ${gameConfig.gameMode === 'battle-royale' ? 'border-red-500/30' : 'border-white/10'} pointer-events-auto min-w-[140px]`}>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{p.name}</span>
                            {gameConfig.gameMode === 'battle-royale' ? (
                                <div className="w-full">
                                    <div className="text-2xl font-black text-red-500 leading-none mb-1 flex items-center gap-1">
                                        <span>♥</span> {p.hp !== undefined ? p.hp : 5000}
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500 transition-all duration-500"
                                            style={{ width: `${Math.min(((p.hp !== undefined ? p.hp : 5000) / 5000) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-2xl font-black text-white leading-none">{p.score}</span>
                            )}
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
                    <div
                        onClick={handleCopyRoomId}
                        className="bg-white/10 p-8 rounded-2xl backdrop-blur-md border border-white/20 text-center cursor-pointer hover:bg-white/20 transition-all group relative"
                        title="Click to Copy"
                    >
                        <p className="text-gray-300 mb-2 uppercase tracking-widest text-sm">Kode Room</p>
                        <div className="flex items-center justify-center gap-3">
                            <p className="text-5xl font-mono font-bold tracking-widest text-emerald-400">{roomId}</p>
                            {copied ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400 absolute -right-12 top-1/2 transform -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 opacity-0 group-hover:opacity-100 transition-all absolute -right-12 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Klik untuk Copy</p>
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

                            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 w-full max-w-5xl shadow-2xl flex gap-6">
                                {/* Left Side: Leaderboard */}
                                <div className="flex-1">
                                    <div className="text-center mb-8 pb-8 border-b border-gray-700">
                                        <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">LOKASI ASLI</p>
                                        <p className="text-3xl font-bold">{roundResult.targetLocation.name}</p>
                                    </div>

                                    <div className="space-y-4">
                                        {roundResult.results.map((r, idx) => {
                                            const colors = ['#3d84ff', '#28a745', '#9c27b0', '#ff9800'];
                                            const color = colors[idx % colors.length];
                                            return (
                                                <div key={r.id} className="flex justify-between items-center bg-gray-700/50 p-4 rounded-lg border-l-4" style={{ borderLeftColor: color }}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="font-bold text-lg">{idx + 1}. {r.name}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-emerald-400 font-bold text-xl">+{r.scoreAdded} pts</div>
                                                        <div className="text-gray-400 text-sm">{(r.distance).toFixed(2)} km</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right Side: Result Map */}
                                <div className="flex-1 h-[400px] bg-gray-900 rounded-lg overflow-hidden border border-gray-600">
                                    <ResultMap targetLocation={roundResult.targetLocation} results={roundResult.results} />
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
                                {!isGameOver && !isHost && (
                                    <div className="flex items-center gap-3 bg-gray-800 px-6 py-3 rounded-full border border-gray-600">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span className="text-gray-300 font-medium">Menunggu Host lanjut round berikutnya...</span>
                                    </div>
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
