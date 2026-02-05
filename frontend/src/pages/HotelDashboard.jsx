import { useEffect, useState } from "react";
import axios from 'axios';
import AuctionsMap
    from "../../components/AuctionsMap";
//esta funcion guarda el objeto ciudades que vienen en el backend. {madrid... paris... }
const HotelDashboard = () => {
    //ESTAODS:
    const [groupedAuctions, setGroupedAuctions] = useState({});
    const [userCity, setUserCity] = useState(null); //guardo la ciudad del hotel que viene del backend
    const [onlyMyCity, setOnlyMyCity] = useState(true); //switch para filtrar. 'true' => Mi ciudad. 'false' => Todas

    //guardo el precio de lo que el hotel escribe. Dentro de las llaves se guarda (id de la subasta, precio)
    const [bidAmounts, setBidAmounts] = useState({})

    //guardo el mensaje del hotel. Entre llaves va el id de subasta, y el value del mensaje.
    const [bidMessages, setBidMessages] = useState({});

    //* Aca agrego 3 estados nuevos , para guardar las fotos (los enlaces)
    const [bidImg1, setBidImg1] = useState({});
    const [bidImg2, setBidImg2] = useState({});
    const [bidImg3, setBidImg3] = useState({});

    //! Agrego esto para saber si es un evento, grupo o company
    const [filterCategory, setFilterCategory] = useState('all');
    const [viewMode, setViewMode] = useState('cards');

    //cuando ingreso en la pagina del hotel, el useEffect se dispara y carga todos los request de los hoteles.
    useEffect(() => {
        fetchAuctions(); //trae todos las subastas y las guarda en fetchAuctions 
    }, []); //Crea un array vacio significa, hacelo solo una vez.

    //* FUNCION PARA TRAER TODAS LAS SUBASTAS DEL BACKEND: 
    const fetchAuctions = async () => {
        //guardo el token que obtuve en el Login
        const token = localStorage.getItem('token');
        try {
            //* HAGO EL GET, PIDIENDO LA LISTA DE SUBASTAS. Y ENVIO EL TOKEN PARA QUE EL SERVER CONFIE .
            const res = await axios.get('https://heyhotels.onrender.com/api/auctions/list', {
                //axios get --> Devuelve una promesa. Await espera que traiga el resultado antes de seguir. 
                headers: { Authorization: `Bearer ${token}` }
            });
            //? AHORA EL BACKEND TRAE {auctions, userCity }/ Guardo las subastas en su estado .
            //guardo el resultado, en el estado principal 
            setGroupedAuctions(res.data.auctions);
            //Y GUARDO LA CIUDAD DEL USUARIO PARA SABER CUAL ES LA SUYA
            setUserCity(res.data.userCity);
        } catch (error) {
            console.log(error, 'Charging the bids, esto viene de HotelDashboard.jsx, /fetchAuctions');
        }
    };


    //funcion para separar por categoria company, grupo, evento
    const getFilteredAuctions = () => {
        //primero decido si filtro por ciudad o muestro todas
        const baseList = (onlyMyCity && userCity)
            ? { [userCity] : groupedAuctions[userCity] || [] }
            : groupedAuctions;
            
//ahora filtro por la categoria elegida
        const result = {};
        //recorro el objeto (ciudad --> Array de subastas)
Object.entries(baseList).forEach(([city, auctions]) => {
    const filtered = auctions.filter(auction =>
        //si el filtro es 'all', pasan todas. si no comparo por categoria. 
        filterCategory === 'all' ? true : auction.category === filterCategory
    );
    //solo agrego la ciudad si tiene subastas que coincidan con el filtro
    if (filtered.length > 0) result[city] = filtered;
});
return result;
    };
    const displayedAuctions = getFilteredAuctions();
    //creo la lista del mapa a partir de lo que filtre 
    const allAuctionsFlat = Object.values(displayedAuctions).flat();


    //!FUNCION PARA CONECTAR LOS PINES DEL MAPA, CON CADA TARJETA CORRESPONDIENTE. Cuando apreto en 'sendBid', lo reedirijo al link de la tarjeta
    const handleSelectFromMap = (auctionId) => {
        setViewMode('cards'); // Cambiamos a lista
        setOnlyMyCity(false); // Mostramos todas para asegurar que aparezca

        // Esperamos un instante a que React renderice las tarjetas
        setTimeout(() => {
            const element = document.getElementById(`auction-${auctionId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Efecto visual: borde temporal para resaltar la tarjeta
                element.style.outline = "4px solid #4338ca";
                setTimeout(() => element.style.outline = "none", 2000);
            }
        }, 150);
    };


    //* FUNCION QUE SE ACTIVA EN EL BOTON SEND OFERTA: 
    const handleBid = async (auctionId) => { //maneja la logica para hacer una puja
        //recupero el token. Saco el precio de Esta subasta especifica, y el mensaje(si esta vacio tambien)
        const token = localStorage.getItem('token');
        //datos que envio para generar la oferta
        const price = bidAmounts[auctionId]; //toma el valor de lo que el hotel escribe. 
        if (!price || parseFloat(price) <= 0) {
            return alert('Please enter a valid price (greater than 0)');
        }
        const bidMsg = bidMessages[auctionId] || ""; //guarda el mensaje, o si esta vacio tambien. 
        //*Aca capturo los valores para las imagenes: 
        const img1 = bidImg1[auctionId] || '';
        const img2 = bidImg2[auctionId] || '';
        const img3 = bidImg3[auctionId] || '';
        //si no puso el precio, no lo dejo seguir 
        if (!price) return alert('Should add price');

        try {
            //* CREO EL POST PARA LA TABLA DE BIDS EN LA BD 
            await axios.post('https://heyhotels.onrender.com/api/bids/place',
                {
                    auction_id: auctionId, // --> ID del request a la que responde el hotel
                    price: parseFloat(price), // --> paso a numero real 
                    message: bidMsg, //--> el mensaje que el hotel escribio. 
                    img1, img2, img3 // --> Y sumo las imagenes tambien
                },
                //?EL BACKEND SABRA QUE HOTEL MANDA LA SOLICITUD SEGUN EL ID QUE VIENE CON EL TOKEN.
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('BID SEND SUCCESFULLY');

            //limpio los inputs de la subasta especifica, sin borrar las demas.
            setBidAmounts({ ...bidAmounts, [auctionId]: '' });
            setBidMessages({ ...bidMessages, [auctionId]: '' });
            setBidImg1({ ...bidImg1, [auctionId]: '' });
            setBidImg2({ ...bidImg2, [auctionId]: '' });
            setBidImg3({ ...bidImg3, [auctionId]: '' });
            fetchAuctions();
        } catch (error) { //si hubo un error, muestro lo que me devolvio el backend. 
            alert('Error sending the bid: ' + error.response?.data?.error);
        }
    };

    //* FUNCION PARA ELIMINAR OFERTAS QUE EL HOTEL MANDO: 
    const withdrawBid = async (bidId) => {
        const token = localStorage.getItem('token');
        if (window.confirm("Are u sure that u want to cancel the dib ? The company wont be see anymore")) {
            try {
                await axios.delete(`https://heyhotels.onrender.com/api/auctions/bid/${bidId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchAuctions(); // PARA REFRESCAR LA LISTA
                alert("Bid withdraw succesfully!");
            } catch (error) {
                console.log(error);
                alert("Error canceling the bid");
            }
        }
    }

    return (
        <div className="main-container">
                
            <h2 style={{
                color: '#134155',
                fontSize: '1.8rem',
                fontWeight: '700',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                alignPrice: 'center',
                gap: '10px',
                borderBottom: '2px solid yellowgreen',
                paddingBottom: '5px',
                marginBottom: '20px'
            }}>
                AVAILABLE BIDS: ✨
            </h2>


                    {viewMode === 'cards' && (
                <div className="view-selector" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    <button
                        className={onlyMyCity ? "btn-active" : "btn-inactive"}
                        onClick={() => setOnlyMyCity(true)}
                        style={{ padding: '10px', cursor: 'pointer', backgroundColor: onlyMyCity ? '#4338ca' : '#ccc', color: 'white', borderRadius: '5px', border: 'none' }}
                    >


                        📍 Look only on My City:<b> ({userCity || 'Not set'}) </b>
                    </button>
                    <button
                        className={!onlyMyCity ? "btn-active" : "btn-inactive"}
                        onClick={() => setOnlyMyCity(false)}
                        style={{ padding: '10px', cursor: 'pointer', backgroundColor: !onlyMyCity ? '#4338ca' : '#ccc', color: 'white', borderRadius: '5px', border: 'none' }}
                    >
                        🌎 Available Bids in All Locations
                    </button>
                </div>
                    )}
                    
            <div className="category-filter-container">
                {['all', 'company', 'group', 'event'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`filter-btn ${filterCategory === cat ? 'active' : ''}`}
                    >
                        {cat === 'all' && '💎 All'}
                        {cat === 'company' && '🏢 Corp'}
                        {cat === 'group' && '👥 Group'}
                        {cat === 'event' && '🎉 Event'}
                    </button>
                ))}
            </div>
        
            <div className="dashboard-container">
                <div className="hotel-content">

                    {/* Botones para cambiar de vista( MAPA O LISTA)*/}
                    <div className="view-selector" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                        <button
                            className={viewMode === 'cards' ? 'btn-active' : 'btn-inactive'}
                            onClick={() => setViewMode('cards')}
                        >📋 List</button>
                        <button
                            className={viewMode === 'map' ? 'btn-active' : 'btn-inactive'}
                            onClick={() => setViewMode('map')}
                        >🗺️ Map View</button>
                    </div>
    {/* Condición: Si es modo mapa, muestra el mapa. Si no, muestra tus tarjetas */ }
    {viewMode === 'map' ? (
                        <AuctionsMap auctions={allAuctionsFlat}
                            onSelectAuction={handleSelectFromMap}
            />
        ) : (
            <>
                {Object.keys(displayedAuctions).length === 0 ? (
                    <p>No auctions available for this selection.</p>
                 ) : (
                    //* 1) Recorrido por ciudades. Transformo objeto a array [ciudad, lista] */
                    Object.entries(displayedAuctions).map(([city, auctions]) => (
                        // Solo dibujo la seccion si la ciudad tiene subastas disponibles
                        auctions.length > 0 && (
                            <div key={city} className="city-section">
                                <h3 className="city-title">📍 {city}</h3>
                                {/* grid para acomodar las tarjetas una al lado de la otra  */}
                                <ul className="auction-grid-carousel">
                                 {auctions.map(auction => (
                                     <li key={auction.id} id={`auction-${auction.id}`} className="auction-card" style={{ transition: 'all 0.3s' }}>
                                         <div className={`category-badge ${auction.category}`}>
                                             {auction.category === 'event' ? '🎉 EVENT' :
                                                 auction.category === 'group' ? '👥 GROUP' : '🏢 CORP'}
                                         </div>  


                                            <div className="company-badge">
                                            🏢 From: <strong>{auction.company_name}</strong>
                                            </div>

                                         <p><strong>Rooms: </strong> {auction.rooms}</p>
                                         {auction.required_amenities && (
                                             <div className="amenities-display">
                                                 
                                                 <p style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px' }}>Mandatory Requirements:</p>
                                                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                 
                                                     {(() => {
                                                         try {
                                                             // 1. Si ya es un array, lo usamos directamente
                                                             if (Array.isArray(auction.required_amenities)) {
                                                                 return auction.required_amenities;
                                                             }
                                                             // 2. Si es un string que parece JSON, lo parseamos
                                                             if (typeof auction.required_amenities === 'string' && auction.required_amenities.startsWith('[')) {
                                                                 return JSON.parse(auction.required_amenities);
                                                             }
                                                             // 3. Si es un string simple separado por comas (el caso de tu error)
                                                             if (typeof auction.required_amenities === 'string') {
                                                                 return auction.required_amenities.split(',').map(item => item.trim());
                                                             }
                                                             return [];
                                                         } catch (e) {
                                                             return [];
                                                         }
                                                     })().map((item, index) => (
                                                         <span key={index} className="amenity-badge">
                                                             ✓ {item}
                                                         </span>
                                                     ))}
                                                 </div>
                                             </div>
                                         )}


                                            <p><strong>CheckIn: </strong> {new Date(auction.check_in).toLocaleDateString()}</p>
 <p><strong>CheckOut: </strong> {new Date(auction.check_out).toLocaleDateString()}</p>
                                            {/* PARA MOSTRAR LA DESCRIPCION */}
                                            {auction.description && (
                                                <div className="description-box">
                                                    <p><strong>Company Request:</strong></p>
                                                    <p className="description-text">{auction.description}</p>
                                                </div>
                                            )}
                                           {/* FORMULARIO DE PUJA:   */}
                                            <div className="bid-form">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="Only Dollar Price..(example: 500)"
                                                    value={bidAmounts[auction.id] || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value; if (value === '' || parseFloat(value) > 0) {
                                                            setBidAmounts({ ...bidAmounts, [auction.id]: e.target.value });
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        //Bloquea físicamente que el usuario escriba el símbolo "-" o la letra "e"
                                                        if (e.key === '-' || e.key === 'e') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    
                                                /> 
                                                {/* TEXTAREA PARA CREAR EL MENSAJE */}
                                                <textarea
                                                    placeholder="Message to the company (for exaple: Breakfast included/ pool..)"
                                                    value={bidMessages[auction.id] || ''}
                                                    onChange={(e) => setBidMessages({ ...bidMessages, [auction.id]: e.target.value })}
                                                ></textarea>
                                                {/* SECCION PARA AGREGAR LAS FOTOS */}
                                                <p style={{ fontSize: '0.8rem', margin: '5px 0' }}>Picture of hotel: </p>
                                                <input
                                                    placeholder="URL photo 1"
                                                    value={bidImg1[auction.id] || ''}
                                                    onChange={(e) => setBidImg1({ ...bidImg1, [auction.id]: e.target.value })}
                                                />
                                                <input
                                                    placeholder="URL photo 2"
                                                    value={bidImg2[auction.id] || ''}
                                                    onChange={(e) => setBidImg2({ ...bidImg2, [auction.id]: e.target.value })}
                                                />
                                                <input
                                                    placeholder="URL photo 3"
                                                    value={bidImg3[auction.id] || ''}
                                                    onChange={(e) => setBidImg3({ ...bidImg3, [auction.id]: e.target.value })}
                                                />
                                                {/* BOTON ENVIAR. LE PASA A LA FUNCION HandleBid EL ID PARA PROCESAR */}
                                                <button className="btn-id" onClick={() => handleBid(auction.id)}>
                                                    Send Bid
                                                </button>
                                            </div>
                                        </li>
                                        ))}
                                </ul>
                            </div>
                        )
                    ))
                )}
            </>
        )}
               </div>
        </div>
        </div >   
    );
};
                                   
export default HotelDashboard;


//linea 54 estaba 
// const displayedAuctions = (onlyMyCity && userCity)
//     ? { [userCity]: groupedAuctions[userCity] || [] } //true --> muestra solo mi ciudad. 
//     : groupedAuctions; // false -->  mostramos el objeto completo 
// //* ESTO PERMITE QUE EL MAPA LEA TODAS LAS SUBASTAS <---*
// const allAuctionsFlat = Object.values(groupedAuctions).flat();