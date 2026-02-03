import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// 🟢 FUNCIÓN PARA CREAR ICONOS PERSONALIZADOS POR CATEGORÍA
const createCategoryIcon = (category) => {
    const emoji = category === 'event' ? '🎉' : category === 'group' ? '👥' : '🏢';
    const color = category === 'event' ? '#f59e0b' : category === 'group' ? '#10b981' : '#4338ca';
    
    return L.divIcon({
        html: `<div style="
            background-color: ${color};
            width: 35px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        ">
            <span style="transform: rotate(45deg); font-size: 18px;">${emoji}</span>
        </div>`,
        className: 'custom-category-marker',
        iconSize: [35, 35],
        iconAnchor: [17, 35],
        popupAnchor: [0, -35]
    });
};

const bounds = [[-90, -180], [90, 180]];

const createCustomClusterIcon = (cluster) => {
    const count = cluster.getChildCount();
    return new L.DivIcon({
        html: `<div class="custom-cluster-icon"><span>${count}</span></div>`,
        className: 'custom-marker-cluster',
        iconSize: L.point(50, 50),
    });
};

const AuctionsMap = ({ auctions, onSelectAuction }) => {
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        setMapReady(true);
        const getCoordinates = async () => {
            if (!auctions || auctions.length === 0) {
                setMarkers([]); // Limpiamos marcadores si no hay subastas
                return;
            }
            setLoading(true);
            const uniqueDestinations = [...new Set(auctions.filter(a => a?.destination).map(a => a.destination.trim()))];
            const coordsCache = {};

            for (const place of uniqueDestinations) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 300)); // Delay más corto para mayor fluidez
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.length > 0) {
                            coordsCache[place] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                        }
                    }
                } catch (e) { console.error("Error en " + place, e); }
            }

            const finalMarkers = auctions
                .filter(auc => auc?.destination)
                .map(auc => ({ ...auc, position: coordsCache[auc.destination.trim()] || null }))
                .filter(auc => auc.position !== null);

            setMarkers(finalMarkers);
            setLoading(false);
        };
        getCoordinates();
    }, [auctions]);

    if (!mapReady) return null;

    return (
        <div className="map-wrapper" style={{ position: 'relative', height: '600px', width: '100%', borderRadius: '15px', overflow: 'hidden', backgroundColor: '#cad2d3' }}>
            <style>{`
                .custom-cluster-icon {
                    background: #1e293b;
                    color: white;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    font-weight: bold;
                    border: 3px solid white;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                }
                .custom-marker-cluster { background: transparent; border: none; }
            `}</style>

            {loading && (
                <div style={{ position: 'absolute', top: 15, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(255,255,255,0.9)', padding: '8px 20px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', fontSize: '14px', fontWeight: 'bold', color: '#4338ca' }}>
                    🔍 Loading, wait a second...
                </div>
            )}

            <MapContainer
                center={[20, 0]}
                zoom={2}
                style={{ height: '100%' }}
                minZoom={2}
                maxBounds={bounds}
                maxBoundsViscosity={1.0}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    noWrap={true}
                    attribution='&copy; OpenStreetMap contributors'
                />

                <MarkerClusterGroup spiderfyOnMaxZoom={true} iconCreateFunction={createCustomClusterIcon}>
                    {markers.map((auc, index) => (
                        <Marker 
                            key={`${auc.id}-${index}`} 
                            position={auc.position}
                            icon={createCategoryIcon(auc.category)} // 🟢 ICONO DINÁMICO
                        >
                            <Popup minWidth={250}>
                                <div style={{ padding: '5px' }}>
                                    {/* Badge de categoría */}
                                    <div style={{ 
                                        display: 'inline-block', 
                                        padding: '2px 8px', 
                                        borderRadius: '12px', 
                                        fontSize: '10px', 
                                        fontWeight: 'bold', 
                                        color: 'white',
                                        backgroundColor: auc.category === 'event' ? '#f59e0b' : auc.category === 'group' ? '#10b981' : '#4338ca',
                                        marginBottom: '8px',
                                        textTransform: 'uppercase'
                                    }}>
                                        {auc.category || 'company'}
                                    </div>

                                    <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>
                                        {auc.category === 'event' ? '🎉' : '🏢'} {auc.company_name}
                                    </h4>
                                    
                                    <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>📍 Destino:</strong> {auc.destination}</p>
                                    <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>🛏️ Rooms:</strong> {auc.rooms}</p>
                                    
                                    <button
                                        className="btn-id"
                                        style={{
                                            width: '100%',
                                            marginTop: '12px',
                                            cursor: 'pointer',
                                            backgroundColor: '#4338ca',
                                            color: 'white',
                                            border: 'none',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            fontWeight: 'bold'
                                        }}
                                        onClick={() => onSelectAuction(auc.id)}
                                    >
                                        Send Bid Now! 🚀
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
};

export default AuctionsMap;