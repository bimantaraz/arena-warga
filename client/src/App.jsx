import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Lobby />} />
                <Route path="/game/:roomId" element={<GameRoom />} />
            </Routes>
        </Router>
    );
}

export default App;
