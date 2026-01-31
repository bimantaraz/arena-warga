import React from 'react';

function StreetView({ location }) {
    if (!location) return <div className="bg-gray-900 text-white flex items-center justify-center h-full">Waiting for location...</div>;

    return (
        <div className="absolute inset-0 z-0 bg-gray-900">
            <iframe
                width="100%"
                height="100%"
                className="w-full h-full border-0 filter brightness-110 contrast-110"
                loading="lazy"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                src={`https://maps.google.com/maps?layer=c&cbll=${location.lat},${location.lng}&cbp=12,0,0,0,0&output=svembed`}
                title="Street View"
            ></iframe>
            {/* Overlay gradient to make UI pop */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-black/20"></div>
        </div>
    );
}

export default StreetView;
