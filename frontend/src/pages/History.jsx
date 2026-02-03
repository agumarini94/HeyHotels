//ESTA RUTA ES PARA MOSTRAR EL HISTORIAL DE LAS SUBASTAS GANADORES EN EL PERFIL DE HOTEL Y COMPANIA
import { useCallback, useEffect, useState } from "react";
import axios from 'axios'; 

const History = () => {
    //* 1) DEFINO EL ESTADO 'LIST' PARA GUARDAR LOS DATOS QUE VIENEN DEL SERVIDOR:
    const [list, setList] = useState([]); //como los datos van a venir en forma de (userid: 1, destino: madrid,... ), entonces guardo un array vacio y cuando cargo la pagina, react dice ok, tengo una lista pero por ahora esta vacia. 
    
    //* 2) OBTENGO EL ROLE Y TOKEN GUARDADOS EN EL NAVEGADOR: 
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    //? ESTO ES PARA PODER USAR LA FUNCION DELETE 
    const loadHistory = useCallback(async () => {
        const endpoint = role === 'company' ? 'history-company' : 'history-hotel';
        try {
            const res = await axios.get(`http://localhost:5005/api/auctions/${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setList(res.data);
        } catch (error) {
            console.error("Error loading history", error);
        }
    }, [role, token]);
    //* 3) useEffect Se Ejecuta apenas el usuario entra en la pagina. Se fija que tipo de usuario es para saber en que "puerta" llamar. Si role es company, va a la ruta empresas, o al reves .
    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    //* FUNCION PARA BORRAR / CANCELAR SUBASTA
    const deleteFromHistory = async (id) => {
        if (window.confirm("Are u sure that u want delete this auction ?")) {
            try {
                await axios.delete(`http://localhost:5005/api/auctions/auction/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                loadHistory(); //refresca la lista
            } catch (error) {
                alert('Error deleting from history');
            }
        }
    };


    //* FUNCION PARA ABRIR WHATSAPP CON UN MENSAJE PRE ARMADO: 
    const handleWhatsApp = (phone, name, destination) => {
        if (!phone) {
            alert("Number not available");
            return;
        }
        const cleanPhone = phone.toString().replace(/\D/g, '');//borra los guiones o espacios 
        const msg = `Hi ${name}, contact from HeyHotels! about the auction en ${destination}.`;
        // 'encodeURIComponent' se asegura de que el texto sea válido para una URL (quita espacios y caracteres raros)
        const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };


    return (
        <div className="dashboard-container">
            {/* TITULO DINAMICO SEGUN EL ROLE */}
            <h2>{role === 'company' ? 'My Reservation accepted: ' : 'Dibs winners'} </h2>
            {/* AVISO DE SI NO HAY AUN OFERTAS ACEPTADAS */}
            {list.length === 0 ? (
                <div className="no-data-msg" style={{ textAlign: 'center', marginTop: '50px', padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '10px' }}>
                    <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>
                        {role === 'company'
                            ? "Still any bid accepted "
                            : "You haven't won any auctions yet. "}
                    </p>
                </div>
            ) : (
                <div className="history-grid">
                    {/* MAPEO (RECORRO) LA LISTA PARA CREAR UNA TARJETA POR CADA REGISTRO: */}
                    {list.map(item => (
                        <div key={item.id} className="history-card">
                            <div className={`category-tag ${item.category || 'company'}`}><strong>
                                {item.category === 'event' ? '🎉 EVENT' :
                                    item.category === 'group' ? '👥 GROUP' : '🏢 CORP'}</strong>
                            </div>

                            <h3>📍 {item.destination}</h3>
                            <span style={{ color: 'yellowgreen', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                ${item.accepted_price} USD
                            </span>
                            {/* ACA USO LOS ALIAS QUE DEFINI EN EL SQL. si soy empresa, busco hotel_name, si soy hotel busco company_name */}
                            <p><strong>{role === 'company' ? 'Hotel: ' : 'Empresa:'}</strong>{role === 'company' ? item.hotel_name : item.company_name}</p>
                            {/* SECCIÓN DE DESCRIPCIÓN */}
                            <div style={{
                                background: '#f3f4f6',
                                padding: '10px',
                                borderRadius: '8px',
                                margin: '10px 0',
                                fontSize: '0.9rem',
                                borderLeft: '4px solid yellowgreen'
                            }}>
                                <strong>Request Description:</strong>
                                <p style={{ margin: '5px 0', color: '#4b5563', fontStyle: 'italic' }}>
                                    {item.description || "No description provided"}
                                </p>
                            </div>
                            <button
                                className="btn-whatsapp"
                                onClick={() => handleWhatsApp(
                                    // paso los datos dinamicos al wp
                                    role === 'company' ? item.hotel_phone : item.company_phone,
                                    role === 'company' ? item.hotel_name : item.company_name, item.destination
                                )}
                            >
                                📲 Send WhatsApp
                            </button>
                            {/* Botón para borrar que llama a la función  */}
                            <button
                                onClick={() => deleteFromHistory(item.id)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default History; 
