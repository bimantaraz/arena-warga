import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ onGuess }) {
    const [position, setPosition] = useState(null);
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onGuess(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

function GuessMap({ onGuessConfirm }) {
    const [tempGuess, setTempGuess] = useState(null);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={`absolute bottom-4 left-4 z-10 transition-all duration-300 ease-in-out border-4 border-white rounded-lg shadow-xl overflow-hidden bg-white ${isHovered ? 'w-1/3 h-1/2' : 'w-64 h-48'} opacity-90 hover:opacity-100 mb-8 ml-4`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <MapContainer center={[-2.5, 118]} zoom={4} className="w-full h-full">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <LocationMarker onGuess={setTempGuess} />
            </MapContainer>
            {tempGuess && (
                <button
                    onClick={() => onGuessConfirm(tempGuess)}
                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-lg z-[1000] text-sm"
                >
                    TEBAK!
                </button>
            )}
        </div>
    );
}

export default GuessMap;
