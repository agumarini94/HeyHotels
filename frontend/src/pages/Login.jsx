import { useState } from "react"; // para manejar los datos del formulario 
import axios from 'axios'; // libreria para hacer peticiones a HTTP al backend. (enviar y recibir datos un server)
import { useNavigate, Link } from "react-router-dom"; //hook para cambiar de pagina (redireccionar)

const Login = () => {
    //* 1) CREO UN ESTADO LOCAL para guardar lo que el usuario escribe en los inputs.
    //Desestructuracion de array. email guarda el valor actual del estado, y useEmail lo actualiza. useState devuelve un array con el valor actual, y la funcion para actualizarlo. setEmail se usa para cambiar el valor de email cada vez que el usuario escribe. 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    //* 2) NAVEGACION. Para moverme entre las rutas. 
    const navigate = useNavigate();
     
    //* 3)FUNCION PRINCIPAL. Se ejecuta al hacer click en "submit"
    const handleSubmit = async (e) => { //e --> contiene los datos del formulario que estoy enviando
        e.preventDefault(); //--> para evitar que el formulario se actualice. 

        try {
            //envio los datos al endpoint que cree en el backend. (donde se hace el punto de entrada al server)
            const res = await axios.post('http://localhost:5005/api/auth/login', { email, password });

            //* 4) GUARDO EL TOKEN Y EL ROLE (para futuras peticiones, y para saber que ventana mostrar)
            //el localStorage no se borra aunque actualice la pagina.
            const token = res.data.token;
            const role = res.data.user.role;
            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('userName', res.data.user.name); 
            //para ver en consola que role encontro: 
            // console.log("Rol detectado:", role);

            //* 5) REDIRECCION SEGUN EL TIPO DE ROLE: 
            if (role === 'company') {
                navigate('/company-dashboard'); //si es company va a este panel
            } else {
                navigate('/hotel-dashboard');
            }
        } catch (error) {
            //esto pregunta, si existe error, presentamelo 
            console.log(error);
            alert('Error in the login' + error.response?.data?.error);
        }
    };

    return (
        <div className="login-page">
            {/* el evento handleSubmit se activa cuando apreto el boton submit en el form */}
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Hey Hotels !</h2>
                <h3>We are here, book us</h3>
                <input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Login</button>
                {/* BOTON DE REGISTRO: */}
                <div className="auth-footer">
                    <p>Are u not register ? </p>
                    <Link to='/register' className="register-link">
                        Register Now ! 
                    </Link>
                </div>
            </form>
        </div>
    );
};


export default Login; 
