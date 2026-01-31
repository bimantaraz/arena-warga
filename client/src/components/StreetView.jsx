import React from 'react';

function StreetView({ location }) {
    if (!location) return <div className="street-view-placeholder">Waiting for location...</div>;

    // Uses Google Maps Embed API in Street View mode.
    // Note: This nominally requires an API Key. If it fails, we can fall back to a static map or image.
    // We use the embed URL.

    // Uses Google Maps "svembed" mode which is a known workaround for simple embedding without a complex flow,
    // though official Embed API is recommended.
    // Format: https://maps.google.com/maps?layer=c&cbll={lat},{lng}&cbp={heading},{pitch},{zoom}&output=svembed

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
