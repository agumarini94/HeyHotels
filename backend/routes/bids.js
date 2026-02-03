//En este archivo creo la logica para que los hoteles hagan sus ofertas: 
import express from 'express' //para crear las rutas. 
import { sql } from '../db.js' //la conexion a la bd de neon 
import { verifyToken } from '../middleware/authMiddleware.js' //controla que un usuario logueado vea. 

const router = express.Router();

//* Creo la ruta para que un hotel haga la puja: ruta--> /api/bids/place
//permite que un hotel haga una oferta en una subasta especifica: 
router.post('/place', verifyToken, async (req, res) => {
    //* 1) Validacion del rol: el middleware me dio el req.user, y aca chequeo que si el usuario es company, no puede pujar por la oferta y lo rechazo  
    if (req.user.role !== 'hotel') {
        return res.status(403).json({ error: 'Only hotels can send requests' });
    }
    //* 2) EXTRACCION DE LOS DATOS: id de la subasta, precio del hotel por el servicio, y el texto con sus beneficios
    const { auction_id, price, message, img1, img2, img3} = req.body; //traigo tambien las imagenes 

    try { 
        //* 3) INSERTO LA OFERTA EN LA BD 
        //uso el req.user.id para el campo del hotel_id. Es seguro xq el ID viene del token, y no del body.
        const result = await sql`
        INSERT INTO bids (auction_id, hotel_id, price, message, img1, img2, img3)
        VALUES (${auction_id}, ${req.user.id}, ${price}, ${message}, ${img1}, ${img2}, ${img3})
        RETURNING *;
        `;
        //* 4) RESPUESTA EXITOSA SI PUDE INSERTAR LA PUJA
        //devuelvo un mensaje de exito y los datos de la puja creada. 
        res.status(201).json({
            message: 'bid sent successful',
            bid: result[0]
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error sending the bids' });
    }
});

//* ACA HAGO UN GET , PARA QUE EL HOTEL VEA SI SU PUJA VA PERDIENDO O GANANDO 
//ruta /api/bids/my-bids
//Esta ruta es privada, solo 1 hotel puede ver SUS propias ofertas
router.get('/my-bids', verifyToken, async (req, res) => {
        try {
            //* 1) CONSULTA SQL COMPLEJA. 
            // b --> tabla bids (donde estan los precios)
            // r: --> tabla donde requests (donde estan los destinos y estados de la subasta)
            const myBids = await sql`
                SELECT 
                    b.id AS bid_id,
                    b.price AS my_price,
                    r.destination, 
                    r.status AS auction_status,
                    (SELECT MIN(price) FROM bids WHERE auction_id = r.id) AS lowest_market_price
                FROM bids b
                JOIN requests r ON b.auction_id = r.id
                WHERE b.hotel_id = ${req.user.id}
                ORDER BY b.created_at DESC;
            `;
    //(SELECT MIN...) --> es una subconsulta que busca el precio mas bajo de TODOS los hoteles para esa misma subasta 
        // WHERE b.hote.. --> filtra por el id del hotel logueado

            //* 2) LOGICA DE NEGOCIO: (FRONT END HELPER)
            //El sql me trae los datos , y aca comparo cual es el mayor y menor.
            //.map recorre cada oferta y le agrega una etiqueta ganadora o no. 
            const bidsWithStatus = myBids.map(bid => ({
                ...bid, // --> copio todos los datos originales (id, price, destination...);
                //si mi precio es igual al minimo del mercado, entonces voy ganando. 
                //use parseFloat por que a veces los decimales de la db llegan como text. 
                is_winning: parseFloat(bid.my_price) <= parseFloat(bid.lowest_market_price)
            }));
            //* 3) RESPUESTA. el hotel recibe las respuestas y sabra si debe bajar mas el precio 
            res.json(bidsWithStatus);

        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Not possible to see your bids' });
            
        }
    })

export default router; //lo importo en server, con el nombre de bidRoutes. 

