//ESTA PAGINA ES PARA VER LAS OFERTAS QUE RECIBIO CADA SUBASTA, Y ACEPTAR O NO. 
import { useState, useEffect } from "react";
import axios from 'axios'; 

//ESTADOS: 
const ManageAuctions = () => {
    const [myRequests, setMyRequests] = useState([]); //traigo la info de cada request dentro de un array. 
    const [selectedBids, setSelectedBids] = useState([]); //guardo todas las ofertas de los hoteles para una subasta especifica. 
    const [activeAuctionId, setActiveAuctionId] = useState(null); //guardo el id de la subasta que estoy viendo en ese momento 
    const token = localStorage.getItem('token'); //necesario para identificarme con el servidor. 

    //* 1) FUNCION PARA OBTENER LAS SUBASTAS CREADA POR ESTA EMPRESA: 

    const fetchRequests = async () => {
        try {
            const res = await axios.get('http://localhost:5005/api/auctions/list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            //FILTRO PARA QUEDARNOS CON LOS VALORES QUE SOLO SEAN ARRAY: 
            const groupedData = res.data.auctions || {};
            const allRequests = Object.values(groupedData).flat();
            //?EL BACKEND DEVUELVE {'Madrid' : [...], [...], Paris: [...], [...],}
            //? OBJECT VALUES Solo saca los arrays, y .flat () los une en una sola linea plata. 
            setMyRequests(allRequests); //Guardo la lista para hacer el .map().. 
        } catch (error) {
            console.log(error, ' not poissible to charge the auctions. Error en ManageAuctions/fetchRequest')
        }
    };
    //* Cuando cargue la pagina por primera vez, se ejecuta la funcion anterior automaticamente .

    useEffect(() => {
        fetchRequests();
    }, []);

    //* 2) Cargar las ofertas de una subasta especifica.    
    const handleViewBids = async (id) => {
        try {
            //pido al backedn las subastas que pertenecen a este id.
            const res = await axios.get(`http://localhost:5005/api/auctions/${id}/bids`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedBids(res.data); //guardo las subastas encontradas. 
            setActiveAuctionId(id); //al setear el id, el modal se muestra automaticamente. 
        } catch (error) {
            alert('Error getting the bids/ MenageAuctions/handleViewBids');
        }
    };

    //* 3) Aceptar una oferta de un hotel (cerrar la subasta):
    const handleAccept = async (auctionId, bidId) => {
        try {
            //PATCH SE USA PARA ACTUALIZAR UNA PARTE DEL ESTADO. (De open a close)
            await axios.patch('http://localhost:5005/api/auctions/accept-bid',
                { auction_id: auctionId, bid_id: bidId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Bid closed successfully');
            setActiveAuctionId(null); //cierro el modal 
            fetchRequests(); //actualizamos la lista para quitar la subasta cerrada o actualizarla. 
        } catch (error) {
            alert('Error accepting the bid / ManageAuc/handleAccept')
        }
    };


    //* FUNCION PARA BORRAR SUBASTAS CREADAS POR LA EMPRESA: 
    const deleteAuction = async (id) => {
        if (window.confirm("Are u sure that u want delete ? Also will be deleted all the Bid recibed")) {
            await axios.delete(`http://localhost:5005/api/auctions/auction/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRequests(); //recarga la lista 
        }
    };

    return (
        <div className="manage-container dashboard-container">
            <div className="hotel-content">
                <h2>Check My Auctions</h2>
            {/* GRID DE LAS SUBASTAS CREADAS POR LA EMPRESA */}

            <div className="requests-grid">
                    {myRequests && myRequests.map(req => (
                    req && (
                            <div key={req.id} className="mini-card">
                                <div className={`category-tag ${req.category}`}><strong>
                                    {req.category === 'event' ? '🎉 EVENT' :
                                        req.category === 'group' ? '👥 GROUP' : '🏢 CORP'}
                                </strong>  </div>
                        <p><strong>Destination: </strong> {req.destination}</p>
                                <p><strong>Rooms: </strong> {req.rooms}</p>
                                <p className="auction-description">
                                    <strong>My Message:</strong>
                                    <span className="desc-text"> {req.description || "No description provided"}</span>
                                </p>
                                
                        {/* Al hacer click, veo todas las subastas  */}
                        <button className="btn-view" onClick={() => handleViewBids(req.id)}>
                            View Bids:
                                </button>
                                <div className={`bids-badge ${req.bids_count > 0 ? 'has-bids' : 'empty-bids'}`}>
                                    {req.bids_count > 0
                                        ? `📩 ${req.bids_count} Bid receive`
                                        : "⏳ Not bids yet"}
                                </div>
                        <button className="logout-btn" onClick={() => deleteAuction(req.id)}>🗑️ Delete Auction</button>
                            </div>
                    )
                    ))}
                </div>
            </div>
            {/* MODAL DE OFERTAS. Solo se activa si activeAuctionId no es null */}
            {activeAuctionId && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Bids for Auction #{activeAuctionId}</h3>
                        {/* BOTON PARA CERRAR EL MODAL SETEANDO EL ID A NULL */}
                        <button className="close-btn" onClick={() => setActiveAuctionId(null)}>
                            Close
                        </button>

                        {/* Si aun no hay ofertas muestro un mensaje. Si hay, hago .map */}
                        {selectedBids.length === 0 ? <p>No bids yet.</p> : (
                            selectedBids.map(bid => (
                                <div key={bid.id} className="bid-item">
                                    <p><strong>Hotel: </strong> {bid.hotel?.name || bid.hotel_name || "not available name"} </p>
                                    <p><strong>Price: </strong>
                                        <span style={{ color: 'yellowgreen', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            ${bid.price}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '5px' }}>USD</span>
                                    </p>
                                    <p className="italic">"{bid.message}"</p>
                                    {/* GALERIA DE FOTOS:  */}
                                    <div className="carousel-container">
                                        {bid.img1 && <img src={bid.img1} alt="Picture 1" className="carousel-item" onClick={() => window.open(bid.img1)} />}
                                        {bid.img2 && <img src={bid.img2} alt="Picture 2" className="carousel-item" onClick={() => window.open(bid.img2)} />}
                                        {bid.img3 && <img src={bid.img3} alt="Picture 3" className="carousel-item" onClick={() => window.open(bid.img3)} />}
                                    </div>
                                    <button className="btn-accept" onClick={() => handleAccept(activeAuctionId, bid.id)}>
                                        Accept This Bid
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAuctions;
