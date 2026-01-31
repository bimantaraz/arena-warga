import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons by using colored SVGs
const createIcon = (color) => {
    return L.divIcon({
        className: 'custom-icon',
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32px" height="32px" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));">
<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
</svg>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const redIcon = createIcon('#ff3d3d'); // Target
const blueIcon = createIcon('#3d84ff'); // Player 1
const greenIcon = createIcon('#28a745'); // Player 2
const purpleIcon = createIcon('#9c27b0'); // Extra
const orangeIcon = createIcon('#ff9800'); // Extra

const getPlayerIcon = (index) => {
    const icons = [blueIcon, greenIcon, purpleIcon, orangeIcon];
    return icons[index % icons.length];
};

const getPlayerColor = (index) => {
    const colors = ['#3d84ff', '#28a745', '#9c27b0', '#ff9800'];
    return colors[index % colors.length];
};

function ResultMap({ targetLocation, results }) {
    if (!targetLocation || !results) return null;

    const targetPos = [targetLocation.lat, targetLocation.lng];

    // Collect all points to fit bounds
    const allPoints = [targetPos];
    results.forEach(r => {
        if (r.guess && r.guess.lat && r.guess.lng) {
            allPoints.push([r.guess.lat, r.guess.lng]);
        }
    });

    const bounds = L.latLngBounds(allPoints).pad(0.1); // Add padding

    return (
        <MapContainer
            center={targetPos}
            zoom={4}
            bounds={bounds}
            className="w-full h-full rounded-lg shadow-inner"
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />

            {/* Target Marker */}
            <Marker position={targetPos} icon={redIcon} zIndexOffset={1000}>
                <Popup className="font-bold">Lokasi Asli: {targetLocation.name}</Popup>
            </Marker>

            {/* Player Markers and Lines */}
            {results.map((r, idx) => {
                const guessPos = [r.guess.lat, r.guess.lng];
                const color = getPlayerColor(idx);

                return (
                    <React.Fragment key={r.id}>
                        {/* Player Pin */}
                        <Marker position={guessPos} icon={getPlayerIcon(idx)}>
                            <Popup>
                                <strong>{r.name}</strong><br />
                                Jarak: {r.distance.toFixed(2)} km
                            </Popup>
                        </Marker>

                        {/* Line from Target to Guess */}
                        <Polyline
                            positions={[targetPos, guessPos]}
                            pathOptions={{ color: color, dashArray: '10, 10', weight: 4, opacity: 0.8 }}
                        />
                    </React.Fragment>
                );
            })}
        </MapContainer>
    );
}

export default ResultMap;
