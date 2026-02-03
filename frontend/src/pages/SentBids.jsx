//ESTE ARCHIVO ES PARA QUE EL HOTEL VEA EL HISTORIAL DE SUS OFERTAS ENVIADAS:
import { useEffect, useState, useCallback } from "react";
import axios from 'axios';

const SentBids = () => {
    //* 1) ESTADO: 'bids' guarda el array de ofertas que traigo del servidor. Primero empieza como un array vacio
    const [bids, setBids] = useState({});
    const [statusFilter, setStatusFilter] = useState('open');
    //* 2) guardo el token del almacenamiento local 
    const token = localStorage.getItem('token');

    //* 3) FUNCION DE CARGA DE LOS BIDS: 
    //uso un callBack para que la funcion no se cree de nuevo en cada renderizado, mejorando el rendimiento: 
    const loadSendBids = useCallback(async () => {
        try {
            //HAGO LA PETICION GET A LA RUTA
            const res = await axios.get('http://localhost:5005/api/auctions/my-sent-bids', {
                //Envio el token a los headers por seguridad.
                headers: { Authorization: `Bearer ${token}` }
            });
            //guardo los datos recibidos(el historial) en el estado. Y LOS MUESTRO ORDENADOS POR CIUDAD.
            const grouped = res.data.reduce((acc, bid) => {
                const city = bid.destination;
                if (!acc[city]) acc[city] = [];
                acc[city].push(bid);
                return acc;
            }, {});
            setBids(grouped);
        } catch (error) {
            console.log(error, "Error loading history /SentBids.");
        }
    }, [token]); //Si el token cambia, la funcion se actualiza
    
    //* 4) CICLO DE VIDA : (useEffect)
    //Esta funcion se ejecuta automaticamente en cuanto el componente se muestra en pantalla. Llama a 'loadSentBids' para traer los datos de inmediato: 
    useEffect(() => {
        loadSendBids();
    }, [loadSendBids]);


    //* FUNCION PARA ELIMINAR(handleWithdrawBid). Recibe el bid de la oferta especifica que quiero borrar. 
    const handleWithdrawBid = async (bidId) => {
        //pido la confirmacion al usuario 
        if (window.confirm("Are u sure that u want to withdraw this bid?")) {
            try {
                //Envio la peticion DELETE al servidor con el id de la oferta que quiero borrar: 
                await axios.delete(`http://localhost:5005/api/auctions/bid/${bidId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                //si se borro con exito, vuelvo a cargar la lista para que desaparezca 
                loadSendBids();
            } catch (error) {
                alert("Error withdrawing bid");
            }
        }
    };
    
    //* FILTRADO SEGUN ESTADO CLOSE / OPEN 
    const filteredBids = {}; 
    Object.entries(bids).forEach(([city, cityBids]) => {
        const matchingBids = cityBids.filter(bid => bid.auction_status === statusFilter);
        if (matchingBids.length > 0) filteredBids[city] = matchingBids;
    });


    return (
        <div className="dashboard-container">
            <h2>My Sent Bids</h2>

            <hr style={{
                border: 'none',
                height: '3px',
                background: 'linear-gradient(90deg, greenyellow 0%, rgba(172, 255, 47, 0.2) 100%)',
                margin: '10px 0 30px 0',
                borderRadius: '5px'
            }} />



            {/* 🟢 BOTONES DE FILTRO (PENDING VS CLOSED) */}
            <div className="status-selector" style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                <button
                    onClick={() => setStatusFilter('open')}
                    className={`filter-btn ${statusFilter === 'open' ? 'active' : ''}`}
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    🟢 Active Bids (Pending)
                </button>
                <button
                    onClick={() => setStatusFilter('closed')}
                    className={`filter-btn ${statusFilter === 'closed' ? 'active' : ''}`}
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    🔴 Past Bids (Closed)
                </button>
            </div>
            {Object.keys(filteredBids).length === 0 ? (
                <p>No bids sent yet.</p>
            ) : (
                    Object.keys(filteredBids).map(city => (
                        <div key={city} className="city-section" style={{ marginBottom: '30px' }}>
                        {/* muestro el titulo de la ciudad 1 vez */}
                            <h3 className="city-title" style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '5px' }}>
                                📍 {city}
                            </h3>
                            <div className="auction-grid">
                        {/* Recorro las ciudades que pertenecen a esta ciudad especifica */}
                                {filteredBids[city].map(bid => (
                                    <div key={bid.bid_id} className="card history-card" style={{ borderLeft: '5px solid #4338ca' }}>
                                        <div className={`category-tag ${bid.category || 'company'}`}> <strong>
                                            {bid.category === 'event' ? '🎉 EVENT' :
                                                bid.category === 'group' ? '👥 GROUP' : '🏢 CORP'}
                                        </strong> </div>
                                        <p><strong>Company:</strong>{bid.company_name}</p>
                                        <p><strong>My Price:</strong><span style={{ color: 'yellowgreen', fontWeight: 'bold', fontSize: '1.1rem' }}>{bid.price} USD</span></p>

                                        {/* ---SECCION MENSAJE DEL HOTEL --- */}
                                        <div style={{
                                            background: '#f1f5f9', // Un gris azulado muy suave
                                            padding: '10px',
                                            borderRadius: '8px',
                                            margin: '12px 0',
                                            fontSize: '0.9rem',
                                            borderLeft: '4px solid #4338ca' // Borde del color del hotel
                                        }}>
                                            <strong style={{ color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                My Message to Company:
                                            </strong>
                                            <p style={{ margin: 0, color: '#1e293b', fontStyle: 'italic' }}>
                                                "{bid.hotel_message || "No message included"}"
                                            </p>
                                        </div>

                                        <p><strong>Status:</strong>
                                            <span className={bid.auction_status === 'open' ? 'status-open' : 'status-closed'}>
                                                {bid.auction_status === 'open' ? ' 🟢 Pending(still nobody wins)' : ' 🔴 Finished (another win)'}</span>
                                        </p>
                                        {/* 8 RENDERIZADO CONDICIONAL: solo muestro el boton de borrar si la subasta sigue abierta('open'). Si la empresa ya cerro la subasta, el hotel ya no puede retirar su oferta */}
                                        {bid.auction_status === 'open' && (
                                            <button
                                                className="logout-btn"
                                                style={{ marginTop: '10px' }}
                                                onClick={() => handleWithdrawBid(bid.bid_id)}
                                            >
                                                🗑️ Withdraw Bid
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
            )}
        </div>
    );
};

export default SentBids;






            // <div className="history-grid">
            //     {/* RENDERIZADO DINAMICO: Recorro el array bids para crear las tarjetas */}
            //     {bids.map(bid => (
            //         <div key={bid.bid_id} className="history-card" style={{ borderLeft: '5px solid #4338ca' }}>
            //             <h3>📍 {bid.destination}</h3>

            //             {/* 7 LOGICA DE ESTADO: Para mostrar un circulo verde si esta abierta o rojo si es pendiente */}
                        

                        
            //             )}
            //         </div>
            //     ))}