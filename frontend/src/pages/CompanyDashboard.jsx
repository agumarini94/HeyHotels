//PANEL QUE DEBERIA VER CUANDO HAGO LOGIN Y EL ROLE ES COMPANY 
import { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom"; //para cuando envie el request, lo redirija a sus subastas. 
import CityPredictor from "../../components/CityPredictor";

//Defino las opciones fijas para los checkbox 
const AMENITY_OPTIONS = ['Wifi', 'Parking', 'Place for meetings', 'Breakfast', 'Dinner', 'Gym', 'Transfer from/to airport', 'Security 24hs', 'Cooler'];
//creo la funcion para guardar los estados 
const CompanyDashboard = () => {
    //uso useState para guardar lo que escribe el usuario. 
    const navigate = useNavigate();
    const [destination, setDestination] = useState('');
    const [rooms, setRooms] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [description, setDescription] = useState('');
    const [selectAmenities, setSelectAmenitis] = useState([]);
    const [category, setCategory] = useState('company');
    //uso un infoMessage, para avisarle al usuario que la solicitud se cargo con exito o no. 
    const [infoMessage, setInfoMessage] = useState('');
    //efecto de carga para el boton submit .
    const [isSubmitting, setIsSubmitting] = useState(false);
    //* 2)CREO LA FUNCION PARA DAR EL ENVIO DE LA SOLICITUD . 

    //Funcion para manejas las amenitys.
    const handleAmenityChange = (amenity) => {
        //si no esta seleccionada, la agrego.
        setSelectAmenitis(prev =>
            prev.includes(amenity)
                ? prev.filter(a => a !== amenity)
                : [...prev, amenity]
        );
    };
    const handleCreateRequest = async (e) => {
        //Hago un prevent default para que el formulario no se actualice. 
        e.preventDefault();
        setIsSubmitting(true);
        //Guardo el token, del localStorage (que vino en el Login), ya que sin esto el backend devolveria error. 
        const token = localStorage.getItem('token'); // --> Trae 'token' del almacenamiento local 

        try {
            //* 3) LLAMADO AL BACKEND.
            //envio mediante post , con el cuerpo del mensaje (body) y el header
            //await (pausa la accion antes de continuar con el codigo hasta recibir los datos ) y el axios hace la conexion con el endPoint, que es http... 
            await axios.post('http://localhost:5005/api/auctions/create',
                {
                    destination,
                    rooms: parseInt(rooms), //convierto el texto a numero para SQL
                    check_in: checkIn,
                    check_out: checkOut,
                    description,
                    required_amenities: selectAmenities,
                    category
                },
                //envio el token para la autenticacion 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            //* 4) SI FUE EXITO, CARGO EN EL MENSAJE. el backend responde con status(201)
            setInfoMessage('Request created successfully')
            //cuando apreta el boton de envio, da un deelay de un segundo y lo redirije
            setTimeout(() => {
                navigate('/manage-auctions'); // Asegúrate de que esta ruta sea la correcta en tu App.jsx
            }, 1500);

            // y reseteo los inputs para una nueva entrada
            setDestination('');
            setRooms('');
            setCheckIn('');
            setCheckOut('');
            setDescription('');

        } catch (error) {
            console.log(error)
            setInfoMessage('Error: Not possible to create the request');
            setIsSubmitting(false);
        }
    };
 


    //para elegir la feche entre (hoy y una fecha futura de hoy)
    const today = new Date().toISOString().split('T')[0];
    return (
        <div className="dashboard-container">
            <div className="content">
                <div className="card">
                    <h3>NEW REQUEST FOR HOTEL:</h3>
                    <p className="card-subtitle">Complete all this inputs to get offers from the hotels:</p>
                    {/* FORMULARIO PARA CREAR LA SOLICITUD: */}
                    <form onSubmit={handleCreateRequest}>
{/* SELECTOR DE CATEGORIA DEL 'EVENTO' */}
                        <div className="input-group category-highlight-section">
                            <label className="highlight-label">🌟 What type of request is this?</label>
                            <select
                                className="category-select"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                            >
                                <option value="company">🏢 Corporate / Business Travel</option>
                                <option value="group">👥 Group Travel (Students, Sports, etc.)</option>
                                <option value="event">🎉 Special Event (Wedding, Congress, VIP)</option>
                            </select>
                            <small className="category-help-text">Selecting the right category helps hotels give you better deals.</small>
                        </div>

                        <div className="input-group">   
                            <label>Destination: </label>
                            {/*ACA VA LA FUNCION DE AUTOCOMPLETE PARA LAS CIUDADES */}
                            <CityPredictor
                                value={destination}
                                onSelect={(ciudadSeleccionada) => {
                        setDestination(ciudadSeleccionada);
                                }}
                            />
                        </div>

                        <div className="input-group">
                            <label>How many rooms</label>
                            <input
                                type="number"
                                min="1"
                                placeholder="0"
                                value={rooms}
                                onChange={(e) => {
                                    if (e.target.value > 0)
                                        setRooms(e.target.value)
                                }}
                                required
                            />
                        </div>


                        {/* CAMPO PARA LOS CHECK BOX  */}
                        <div className="amenities-section">
                            <label className="section-title">
                                Mandatory Amenities (What the hotel MUST have):
                            </label>
                            <div className="amenities-grid">
                                {AMENITY_OPTIONS.map((option) => (
                                    <label
                                        key={option}
                                        className={`amenity-item ${selectAmenities.includes(option) ? 'active' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectAmenities.includes(option)}
                                            onChange={() => handleAmenityChange(option)}
                                        />
                                        {option}
                                    </label>
                                ))}
                            </div>
                        </div>
                        

                        {/* 4. Nuevo campo de descripción/mensaje */}
                        <div className="input-group">
                            <label>Message / Requirements:</label>
                            <textarea
                                placeholder="Example: We are Apple, we need 15 business rooms with breakfast, near the beach..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows="3"
                                className="description-textarea"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                            />
                        </div>

                        {/* div para los check in check out  */}
                        <div className="row">
                            <div className="input-group">
                                <label>Check In:</label>
                                <input
                                    type="date"
                                    min={today}
                                    value={checkIn}
                                    onChange={(e) => {
                                        setCheckIn(e.target.value)
                                        if (checkOut && e.target.value > checkOut) {
                                            setCheckOut('');
                                        };
                                    }}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Check Out:</label>
                                <input
                                    type="date"
                                    min={checkIn || today}
                                    value={checkOut}
                                    onChange={(e) => setCheckOut(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isSubmitting}
                            style={{
                                opacity: isSubmitting ? 0.7 : 1,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            {isSubmitting ? (
                            <>
                                <span className="loader-mini"></span> Envíando...
                                </>
                            ) : (
                                "Send now"
                            )}
                        </button>
                    </form>

                    {infoMessage && <p className="status-msg">{infoMessage}</p>}
                </div>
            </div>
        </div>
    );
};

export default CompanyDashboard;
