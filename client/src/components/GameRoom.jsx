import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { socket } from './Lobby';
import StreetView from './StreetView';
import GuessMap from './GuessMap';
import ResultMap from './ResultMap';

function GameRoom() {
    const { roomId } = useParams();
    const { state } = useLocation();
    const [players, setPlayers] = useState(state?.players || []);
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

        socket.on('gameReset', (room) => {
            setGameStatus('waiting');
            setRoundResult(null);
            setIsGameOver(false);
            setPlayers(room.players);
            setTimeLeft(0);
        });

        return () => {
            socket.off('gameStart');
            socket.off('roundResult');
            socket.off('gameReset');
        }
    }, []);

    const handleResetGame = () => {
        socket.emit('resetGame', { roomId });
    };

    return (
        <div className="relative h-screen w-full overflow-hidden bg-gray-900 font-sans select-none">
            {/* Top Bar - HUD */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-transparent pt-0 pl-0 pr-0 flex justify-between items-start pointer-events-none">

                {/* Unified Info Card (Spoiler Blocker) */}
                <div className="flex flex-col gap-0 pointer-events-auto bg-gray-900 border border-white/10 rounded-2xl rounded-tl-none shadow-xl overflow-hidden w-80">
                    {/* Room ID Header */}
                    <div
                        onClick={handleCopyRoomId}
                        className="flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group border-b border-white/5"
                        title="Copy Room ID"
                    >
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Room ID</span>
                            <span className="font-mono text-xl font-black text-white tracking-widest">{roomId}</span>
                        </div>
                        {copied ? (
                            <span className="text-emerald-400 text-xs font-bold animate-pulse">COPIED</span>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </div>

                    {/* Round Info Footer */}
                    {gameStatus === 'playing' && (
                        <div className="px-4 py-2 bg-black/40 flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-bold uppercase">Round</span>
                            <span className="text-sm font-bold text-white">
                                <span className="text-emerald-400">{gameConfig.currentRound}</span> / {gameConfig.totalRounds}
                            </span>
                        </div>
                    )}
                </div>

                {/* Timer Display */}
                {gameStatus === 'playing' && gameConfig.timeLimit > 0 && (
                    <div className={`absolute left-1/2 top-4 transform -translate-x-1/2 bg-black/30 backdrop-blur-sm px-6 py-2 rounded-xl border ${timeLeft <= 10 ? 'border-red-500 animate-pulse' : 'border-white/10'}`}>
                        <span className={`text-3xl font-mono font-black ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </span>
                    </div>
                )}

                {/* Leaderboard Grid */}
                <div className="flex flex-col gap-2 bg-black/20 backdrop-blur-sm p-3 rounded-2xl rounded-tr-none border border-white/10 pointer-events-auto min-w-[200px]">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest border-b border-white/10 pb-1 mb-1">
                        <span>Pemain</span>
                        <span>{gameConfig.gameMode === 'battle-royale' ? 'HP' : 'Skor'}</span>
                    </div>
                    {players
                        .sort((a, b) => {
                            if (gameConfig.gameMode === 'battle-royale') return b.hp - a.hp;
                            return b.score - a.score;
                        })
                        .map((p, idx) => (
                            <div key={p.id} className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-mono font-bold w-4 ${idx === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                                        #{idx + 1}
                                    </span>
                                    <span className={`text-sm font-bold ${p.id === socket.id ? 'text-emerald-400' : 'text-white'}`}>
                                        {p.name} {p.id === socket.id && '(You)'}
                                    </span>
                                </div>

                                {gameConfig.gameMode === 'battle-royale' ? (
                                    <span className={`font-mono font-bold text-sm ${p.hp < 1000 ? 'text-red-500 animate-pulse' : 'text-red-400'}`}>
                                        {p.hp} <span className="text-[10px]">♥</span>
                                    </span>
                                ) : (
                                    <span className="font-mono font-bold text-sm text-yellow-400">
                                        {p.score}
                                    </span>
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
                        <div className="absolute inset-0 z-50 bg-black/40 flex flex-col justify-center items-center text-white backdrop-blur-sm p-8 animate-fadeIn">

                            {/* HEADER GAME OVER / ROUND */}
                            <div className="mb-8 text-center">
                                {isGameOver ? (
                                    <>
                                        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-2xl mb-4">
                                            GAME OVER
                                        </h1>

                                        {/* WINNER SPOTLIGHT */}
                                        <div className="flex flex-col items-center animate-bounce-slow">
                                            <p className="text-gray-400 text-lg uppercase tracking-widest font-bold mb-4">PEMENANG</p>
                                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-300 to-yellow-600 p-1 shadow-[0_0_50px_rgba(234,179,8,0.6)]">
                                                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-4xl">
                                                    👑
                                                </div>
                                            </div>
                                            <h2 className="text-4xl font-bold mt-4 text-yellow-400">
                                                {/* Find winner based on Score or HP */}
                                                {roundResult.results.length > 0
                                                    ? (gameConfig.gameMode === 'battle-royale'
                                                        ? roundResult.results.reduce((prev, current) => (prev.hp > current.hp ? prev : current)).name
                                                        : roundResult.results.reduce((prev, current) => (prev.totalScore > current.totalScore ? prev : current)).name
                                                    )
                                                    : "Unknown"
                                                }
                                            </h2>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">ROUND {roundResult.results[0].guess ? gameConfig.currentRound : gameConfig.currentRound - 1}</p>
                                        <h2 className="text-4xl font-extrabold text-emerald-400">ROUND SELESAI!</h2>
                                    </>
                                )}
                            </div>

                            <div className="bg-gray-800/80 p-8 rounded-2xl border border-gray-700 w-full max-w-5xl shadow-2xl flex gap-8">
                                {/* Left Side: Leaderboard */}
                                <div className="flex-1">
                                    <div className="text-center mb-6 pb-6 border-b border-gray-700">
                                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">LOKASI TADI ADALAH</p>
                                        <p className="text-3xl font-bold text-white leading-tight">{roundResult.targetLocation.name}</p>
                                    </div>

                                    <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                        {roundResult.results.sort((a, b) => b.totalScore - a.totalScore).map((r, idx) => {
                                            const colors = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b'];
                                            const color = colors[idx % colors.length];
                                            return (
                                                <div key={r.id} className="flex justify-between items-center bg-gray-700/50 p-4 rounded-xl border-l-4 hover:bg-gray-700 transition-colors" style={{ borderLeftColor: color }}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="font-black text-xl text-gray-500 w-6">#{idx + 1}</div>
                                                        <div>
                                                            <div className="font-bold text-lg">{r.name}</div>
                                                            <div className="text-xs text-gray-400">Jarak: <span className="text-white font-mono">{(r.distance).toFixed(2)} km</span></div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        {gameConfig.gameMode === 'battle-royale' ? (
                                                            <div className="text-red-500 font-bold text-xl flex items-center gap-1 justify-end">
                                                                <span>♥</span> {r.hp}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="text-emerald-400 font-bold text-xl">+{r.scoreAdded}</div>
                                                                <div className="text-gray-400 text-xs font-bold">Total: {r.totalScore}</div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right Side: Result Map */}
                                <div className="flex-1 h-[400px] bg-gray-900 rounded-xl overflow-hidden border border-gray-600 shadow-inner relative group">
                                    <ResultMap targetLocation={roundResult.targetLocation} results={roundResult.results} />
                                    <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] text-gray-400">Map Result</div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-4">
                                {!isGameOver && isHost && (
                                    <button
                                        onClick={nextRound}
                                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-10 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-[0_0_25px_rgba(37,99,235,0.5)] flex items-center gap-2"
                                    >
                                        Lanjut Round {gameConfig.currentRound + 1} <span>&rarr;</span>
                                    </button>
                                )}
                                {!isGameOver && !isHost && (
                                    <div className="flex items-center gap-3 bg-gray-800/80 px-8 py-4 rounded-full border border-gray-600 backdrop-blur-sm">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span className="text-gray-300 font-bold tracking-wide">Menunggu Host...</span>
                                    </div>
                                )}
                                {isGameOver && isHost && (
                                    <button
                                        onClick={handleResetGame}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-lg border border-emerald-500"
                                    >
                                        Main Lagi (Restart) 🔄
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
