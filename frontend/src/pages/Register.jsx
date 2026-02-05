import { useState } from "react";
import axios from 'axios'; 
import { useNavigate, Link } from "react-router-dom"; //para navegar entre las paginas 

//* 1) REGISTRO: funcion para registrar todos los campos 
const Register = () => {
    //junto todos los datos en un estado inicial: 
    const [formData, setFormData] = useState({
        role: 'company', //valor por defecto
        name: '',
        email: '',
        password: '',
        phone: ''
    });
    //* 2) Estado para feedback --> Envio un mensaje al usuario con el mensaje de exito o no. 
    const [message, setMessage] = useState('');
    //* 3) funcion para redireccionar 
    const navigate = useNavigate();

    //* 4) Funcion que se activa cada vez que escribo algo en el inputs 
    const handleChange = (e) => {
        // [e.target.name]: e.target.value busca el atributo "name" del input y le asigna su valor actual
        // ...formData asegura que no borremos los otros campos mientras escribimos en uno
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    //* 5) ENVIO DE DATOS A LA BD. se dispara cuando apreto el boton REGISTER 
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            //envio el objeto completo al endpoint de registro del servidor. 
            await axios.post('https://heyhotels.onrender.com/api/auth/register', formData);
            setMessage("Welcome to HeyHotels! Redirecting to login...")
            //si sale bien , le muestro el mensaje al usuario para que lo lea, y lo envio al login. 
            setTimeout(() => navigate('/login'), 2000);
            //* 5) Manejo de errores. 
        } catch (error) {
            setMessage('Error ' + (error.response?.data.error || "Not possible to register"));
        }
    };

    return (
        <div className="login-page">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Join to HeyHotels!</h2>
                <input name="name" type="text" placeholder="Company name / Hotel name" onChange={handleChange} required />
                <input
                    name="phone"
                    type="text"
                    placeholder="WhatsApp number: (with country code) "
                    value={formData.phone}
                    onChange={handleChange}
                    required
                />
                <input name="email" type="email" placeholder="Email address" onChange={handleChange} required />
                <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
                {/* Select para elegir el role */}
                <label className="role-label">I am a: </label>
                <select name="role" value={formData.role} onChange={handleChange} className="role-select">
                    <option value='company'>Company (We're booking rooms)</option>
                    <option value='hotel'>Hotel (I offer rooms)</option>
                </select>
                <button type="submit" className="btn-primary">Create Account</button>
                <p className="switch-auth">
                    I'm already register <Link to='/login'>Login here!</Link>
                </p>
                {message && <p className="status-msg">{message}</p>}
            </form>
        </div>
    );
};

export default Register; 
