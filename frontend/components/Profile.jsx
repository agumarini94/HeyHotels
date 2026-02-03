//PERFIL PARA QUE EL HOTEL PUEDA EDITAR SU CITY 
import axios from "axios";
import { useState, useEffect } from "react"
import CityPredictor from "./CityPredictor"; //PARA EL BUSCADOR DE CIUDADES 

const Profile = () => {
    const [city, setCity] = useState(''); //aca guardo' Madrid, Spain'
    const [currentCity, setCurrentCity] = useState(''); //Guardo la ubicacion actual del hotel
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('token');

    //* 1) Al cargar, traigo los datos actuales del hotel
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get('http://localhost:5005/api/auth/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.city) {
                    setCurrentCity(res.data.city);
                    setCity(res.data.city); //precarga el buscador 
                }
            } catch (error) {
                console.log(error, 'Error fetchig profile');
            }
        };
        fetchProfile();
    }, [token]);

    const handleCitySelect = (cityName) => {
        setCity(cityName); //guardo el nombre limpio. ('madrid, spain')
    }
    const handleUpdate = async () => {
        if (!city) return alert("Select a city first");
        setLoading(true);
        
        try {
            await axios.put('http://localhost:5005/api/auth/update-profile',
                { city },
                { headers: { Authorization: `Bearer ${token}` } });
            setCurrentCity(city); //Actualiza el texto visual. 
            alert("City updated! ");
        } catch (error) {
            alert('Not possible to update the city');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-container" style={{ padding: '40px', maxWidth: '400px', margin: 'auto' }}>
            <h2>Hotel Profile</h2>
            {/* Veo mi actual city */}
            <div className="current-location-badge">
                <p>Your actual city is: <strong>{currentCity || "Not set yet"}</strong></p>
            </div>
            <div className="form-group">
                <label>Change my city: </label>
                <CityPredictor
                    onSelect= {(name) => setCity(name)}
                    value={city}
                />
            </div>
            <button onClick={handleUpdate} disabled={loading || !city} style={{ backgroundColor: '#4338ca', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                {loading? "Saving.. " : "Save Location"}
            </button>
        </div>
    );
}
export default Profile;
