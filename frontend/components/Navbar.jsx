//ESTE NAVBAR QUEDA FIJO EN TODAS LAS PANTALLAS, PARA DIVIDIR SEGUN EL ROLE, Y VER MI BARRA DE NAVEGACION EN SUBASTAS, MIS SUBASTAS, GANADORAS, SALIR ..
import { Link, useNavigate } from 'react-router-dom'; 

const Navbar = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    //Si no hay token , no debo mostrar el navbar. 
    if (!token) return null;

    return (
        <nav className='main-navbar'>
            <div className='nav-logo'>
                <Link to={role === 'company' ? '/company-dashboard' : '/hotel-dashboard'}>
                    HeyHotels!
                </Link>
                <span className='nav-greeting'>
                    Hi, <strong>{userName || 'User'} </strong>!
                </span>
            </div>

            <ul className='nav-links'>
                {role === 'company' ? (
                    <>
                        <li><Link to="/company-dashboard"> New auction </Link></li>
                        <li><Link to="/manage-auctions">My Auctions</Link></li>
                    </>
                ) : (
                    <>
                            <li><Link to="/hotel-dashboard">Available Auctions</Link></li>
                            <li><Link to="/sent-bids">📤 My Offers</Link></li>
                            <li><Link to='/profile'>My Profile</Link></li>
                    </>
                )}
                <li><Link to="/history">My offers accepted</Link></li>
            </ul>

            <div className='nav-auth'>
                <span className='user-role'>{role?.toUpperCase()}</span>
                <button onClick={handleLogout} className='btn-logout'>Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;