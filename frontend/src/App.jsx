import { BrowserRouter as Router, Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import Login from './pages/Login';
import './App.css'; // Usaremos este para el CSS general
import CompanyDashboard from './pages/CompanyDashboard'; //agregar la ruta a la pag company
import HotelDashboard from './pages/HotelDashboard'; //hotel 
import ManageAuctions from './pages/ManageAuctions';
import Register from './pages/Register';
import History from './pages/History';
import Navbar from '../components/Navbar';
import SentBids from './pages/SentBids';
import Profile from '../components/Profile';
function App() {
  return (
    <Router>
      <Navbar />

      <div className="main-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path='register' element={<Register />} />

          {/* Aquí agregaremos las rutas de Hotel y Empresa después */}
          <Route path='/company-dashboard' element={<CompanyDashboard />} />
          <Route path='hotel-dashboard' element={<HotelDashboard />} />
          <Route path='/manage-auctions' element={<ManageAuctions />} />
          <Route path='/sent-bids' element={<SentBids />} />
          <Route path='/history' element={<History />} />
          <Route path='profile' element={<Profile />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
        <footer className="signature-footer">
          <p>Designed by <strong>Agustin Marini</strong></p>
        </footer>
      </div>
    </Router>
    
  );
  
}

export default App;