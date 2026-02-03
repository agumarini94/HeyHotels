//primer conexion con el servidor 
import express from 'express'; // --> para crear las rutas (/api/users...)
import cors from 'cors';
import dotenv from 'dotenv'; // para leer las rutas
import authRoutes from './routes/auth.js'; //importo las rutas, pero con el nombre authRoutes. 
import auctionRoutes from './routes/auctions.js' //esto viene con las subastas creadas. 
import bidRoutes from './routes/bids.js'; //traigo la puja de subastas con el nombre bidRoutes
dotenv.config(); //sin esto, no puedo leer las rutas y no traigo la clave del .env

const app = express();
const PORT = 5005;

//middleware para que el servidor entienda JSON 
app.use(cors({
    origin: 'http://localhost:5174',
    credentials: true
}));
app.use(express.json());

//indico que use las rutas de auth, con el prefijo /api/auth
app.use('/api/auth', authRoutes); //VERIFICA LOS REGISTROS Y LOGIN 
app.use('/api/auctions', auctionRoutes); //CREA LAS SUBASTAS y LAS MUESTRA, /api/auctions/create || /list 
app.use('/api/bids', bidRoutes); //PARA QUE LOS HOTELES PUEDAN GENERAR SUS PUJAS. 
app.get('/', (req, res) => {
    res.send('welcome');
})


//inicio el servidor: 
app.listen(PORT, () => {
    console.log(`server conect on ${PORT}`);
})

