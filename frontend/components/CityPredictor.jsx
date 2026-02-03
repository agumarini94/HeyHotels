//Este archivo es para hacer que en el buscador, cuando la compania escribe la ciudad, vea el autocompletado y no haya errores de ortografia (como madridi , o milana...)
import { useState, useEffect } from "react";

const CityPredictor = ({ onSelect, value }) => {
    //query --> Es lo que el usuario escribe en el input.
    const [query, setQuery] = useState(value || '');
    //sugestion : el array de ciudades que devuelve la api. 
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false) //para mostrar un estado de carga al cargar las ciudades. 
    const [showSuggestions, setShowSuggestions] = useState(false); //es un estado para saber si la lista se debe mostrar o no 
    // Este efecto detecta si el Dashboard borró el destino (por ejemplo, al enviar con éxito)
    useEffect(() => {
        setQuery(value || '');
    }, [value]);
    //useEffect se dispara cada vez que 'query' cambia 
    useEffect(() => {
        // si el usuario escribio menos de 3 letras, no busco nada todavia. 
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }
        //* Si showSuggestions es falso, significa que elegi una ciudad y no quiero q se dispare el useEffect otra vez
        if (!showSuggestions) return; 
        //Creo un temporizador para no saturar la API, en cada tecla. Ahora espera medio segundo antes de buscar en la api. 
        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                //Llamo a la API de OpenStreetMap filtrando por ciudades.
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5&featuretype=settlement&accept-language=en`
                );
                const data = await response.json();
                //guardo los resultados en el estado. 
                //mapeo los datos para limpiar el nombre antes de guardarlo
                const simplifiedData = data.map(item => {
                    const city = item.address.city || item.address.town || item.address.village || item.address.suburb || "";
                    const country = item.address.country || "";
                    //creo un nuevo formato de Madrid, Spain;
                    const cleanName = city ? `${city}, ${country}` : item.display_name;
                    return {
                        ...item,
                        display_name: cleanName //Sobreecsribo el nombre, con el nombre corto
                    };
                });

                setSuggestions(simplifiedData); 
            } catch (error) {
                console.log(error);
            } finally { // pase lo que pase (exito o error), quito el estado de loading..
                setLoading(false);
            }
        }, 500); //espera 500ms despues de que el usuario deja de escribir 
        //limpio el temporizador si el usuario sigue escribiendo.
        return () => clearTimeout(delayDebounceFn);
    }, [query, showSuggestions]); //Actualiza lo que el usuario escribio en el input
    
    return (
        <div className="city-predictor-container" style={{ position: 'relative' }}>
            <input
                type="text"
                value={query}
                className="city-input"
                placeholder="Search some city"
                // actualizo el query mientras el user escribe
                onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                }}
                autoComplete="off"
            />
            {/* Si encunetra sugerencias, muestro la lista desplegable */}
            {suggestions.length > 0 && (
                <ul className="suggestion-list">
                    {suggestions.map((item, index) => (
                        <li
                            key={index}
                            onClick={() => {
                                // cuando hago click, actualizo el input setQuery(item.display_name)
                                setQuery(item.display_name);
                                //y limpio la lista
                                setSuggestions([]);
                                setShowSuggestions(false);
                                //aviso al formulario que ciudad eligio
                                onSelect(item.display_name);
                            }}
                        >
                            {/* muestro el nombre copleto(ciudad, region, pais...) */}
                            {item.display_name}
                        </li>
                    ))}
                </ul>
            )}
            {loading && <small>Searching...</small>}
        </div>
    );
};

export default CityPredictor;