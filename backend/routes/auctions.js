//* Aca va la logica para las subastas. 
//ya tengo al guardia creado, ahora voy a crear las rutas para que las empresas publiquen sus solicitues : 
//I use the middleware, to asegurate that only companies can post. 
import express from 'express' //para crear las rutas 
import { sql } from '../db.js' // para la conexion con la bd de neon 
import { verifyToken } from '../middleware/authMiddleware.js' 

const router = express.Router();

//creo la ruta post. /api/auctions/create.
//The verifiToken in the middle check --> if the user doesnt have it, won't run the code. 
router.post('/create', verifyToken, async (req, res) => {
    if (req.user.role !== 'company') { //si el usuario no es una empresa..
        //* 1) CONTROL DE ROL 
        return res.status(403).json({ error: "Only companies can post subastas" });
    }
    //* 2) Si es una empresa, guardo los datos que vienen del JSON 
    const { destination, rooms, check_in, check_out, description, required_amenities, category} = req.body;

    try {
        //* 3) INSERTO LA SUBASTA EN LA BD 
        // en el values, req.user.id es el id que vino con el token, y refiere a la empresa que creo la subasta
        const result = await sql`
            INSERT INTO requests (company_id, destination, rooms, check_in, check_out, description, required_amenities, category)
            VALUES (${req.user.id}, ${destination}, ${rooms}, ${check_in}, ${check_out}, ${description}, ${JSON.stringify(required_amenities || [])}, ${category || 'company'})
            RETURNING *;
        `;
        //* 4) Devuelvo la respuesta exitosa: 
        res.status(201).json(result[0]);
    } catch (error) {
        console.log("DETALLE DEL ERROR -->", error.message);
        res.status(500).json({ error: "Error creating the auction" });
    }
});

//* --> ACA HAGO LOS REQUEST PARA QUE LOS HOTELES PUEDAN VER LAS SUBASTAS. CON GET 
//? AHORA LOS HOTELES VAN A VER LAS OFERTAS SEGUN SU CIUDAD, O GENERAL. Divididas .
//ruta: api/auctions/list. //uso verifyToken para comprobar que solo un hotel es quien puede ver las solicitudes
router.get('/list', verifyToken, async (req, res) => {
    try {
        let auctions; 
        let userCity = null;
        //* 1) OBTENER LA CIUDAD DEL HOTEL. La busco en la tabla users, la ciudad que corresponde a este ID 
        const userQuery = await sql` SELECT city FROM users WHERE id = ${req.user.id}`;
        if (userQuery.length > 0) { //guardo la ciudad en user city. 
            userCity = userQuery[0].city;
        }
        // --> si es empresa, la empresa ve sus subastas abiertas 
        if (req.user.role === 'company') {
            //la empresa solo ve sus subastas, abiertas o cerradas)
            //* 1) CONSULTA A LA BD
            //traigo todas las subastas ordenadas por destino y fecha:
            //y que esten en status open. y las guardo en auctions
            //esto trae todas las subastas activas, ordenadas por ciudad y fecha 
            //y ademas filtro por las que esten abiertas
            auctions = await sql`
            SELECT r.*, u.name as company_name,
            (SELECT COUNT(*)::int FROM bids WHERE auction_id = r.id) as bids_count
            FROM requests r
            JOIN users u ON r.company_id = u.id
            WHERE r.company_id = ${req.user.id}
            AND r.status = 'open'
            ORDER BY created_at DESC;
            `
        } else {
            //el hotel ve TODAS las subastas que estan open 
            auctions = await sql`
            SELECT r.*, u.name as company_name 
            FROM requests r
            JOIN users u ON r.company_id = u.id
            WHERE r.status = 'open'
            ORDER BY r.destination ASC, r.check_in ASC;
            `;
        }
     
        //* 2) AGRUPACION POR CIUDAD 
        //con reduce, convierto el resultado de la bd (que me dio un array plano[{id:1, city:'Paris'}, {id:2, city:'Paris'}, {id:....]) en un objeto. 
        const groupedByCity = auctions.reduce((acc, auction) => {
            const city = auction.destination; //saco el nombre de la ciudad
            if (!acc[city]) { //si es la primera vez que aparece, creo un array vacio para ella
                acc[city] = [];
            }
            acc[city].push(auction); //y meto la subasta actual dentro del cajon de su ciudad
            return acc; //devuelve el acumulador para la sig vuelta del bucle. 
        }, {}); // --> el {} indica que acc empieza como un obj vacio. 
        //* 3) Respuesta del front end. 
        //envio un objeto que tiene los dos datos claves: todas las ciudades , y la del hotel
        res.json({
            auctions: groupedByCity,
            userCity: userCity //Para que el hotel sepa cual es su propia ciudad
        });

    } catch (error) {
        //* 4) MANEJO DE ERRORES .
        console.log(error);
        res.status(500).json({ error: "Not possible to show auctions" })
    }
});

//HAGO LA UNION ENTRE BIDS Y REQUESTS, PARA QUE LA COMPANIA VEA LAS OFERTAS DEL HOTEL.
//RUTA GET 
//el id es un parametro dinamico, es la subasta que queremos revisar
router.get('/:id/bids', verifyToken, async (req, res) => {
    //* 1) obtener el ID de la url. Si la url es /api/auctions/5/bids --> id = 5. 
    const { id } = req.params; //el ID de la subasta. 

    try {
        //* 2) CONSULTA SQL CON JOIN (UNO LAS TABLAS)
        //Ademas del id del hotel, quiero el nombre..
        // b es el alias para la tabla bids (ofertas)
        // u es el alias para la tabla users (donde estan los nombres de los hoteles)
        const bids = await sql`
            SELECT 
                b.id, 
                b.price,
                b.message,
                b.img1,
                b.img2,
                b.img3,
                u.name AS hotel_name 
            FROM bids b
            JOIN users u ON b.hotel_id = u.id
            WHERE b.auction_id = ${id}
            ORDER BY b.price ASC; 
        `; //JOIN --> une las tablas donde los id coincidan 
        //WHERE --> Filtro solo las ofertas de esta subasta. //Vienen ordenados por el precio mas barato.
        //* 3) RESPUESTA AL CLIENTE: //si no encuentro nada, de vuelvo un array vacio
        res.json(bids); 

    } catch (error) {
        //* 4) manejo de errores .
        console.log(error.message);
        res.status(500).json({ error: 'Error getting the bids'})
        
    }
    
})

//ACA VA LA LOGICA PARA CUANDO LA EMPRESA ACEPTA UNA OFERTA Y CERRAR LA SUBASTA 
//* RUTA: PATCH /api/auctions/accept-bid
//uso patch xq voy a actualizar una parte del recurso (solo el estado )
router.patch('/accept-bid', verifyToken, async (req, res) => {
    //extraigo el id de la subasta, y el id de la subasta ganadora del cuerpo 
    const { auction_id, bid_id } = req.body;
    try {
        //* 1) CONTROL DE SEGURIDAD: 
        //no basta con estar logueado, ademas verificar que la subasta pertenezca a la empresa que envia el token 
        const auction = await sql`
            SELECT id FROM requests
            WHERE id = ${auction_id} AND company_id = ${req.user.id}
        `;
        //si el if no trae nada, es xq la subasta no existe, o existe pero pertenece a otra empresa 
        if (auction.length === 0) {
            return res.status(403).json({ error: 'U are not allowed over this bid' });
        }
        //* 2) TRANSACCION ATOMICA (sql.begin) (?) para asegurar que si algo falla a mitad de camino, NADA se guarde. Asi se evita que la subasta se cierre pero el hotel no se entere
        //cierro la subasta para que ya no aparezca en la lista publica de open
        //? Necesito guardar que hotel hizo la oferta, para guardarlo como ganador
        const bidData = await sql`
            SELECT hotel_id FROM bids WHERE id = ${bid_id}
        `;
        //si no encontro ganadores..
        if (bidData.length === 0) {
            return res.status(404).json({ error: 'Bid not found' });
        }
        //si lo encontro, entonces lo guardo en winnerhotel
        const winner_hotel_id = bidData[0].hotel_id;
        //*Sigue actualizar la subasta y cerrarla (marcar quien gano)
            await sql`
            UPDATE requests
            SET status = 'closed',
                winner_id = ${winner_hotel_id}
            WHERE id = ${auction_id}
            `;
            //? esto es opcional. Marcar la puja ganadora en la tabla bids si agrego la seccion 'winners
            //? await sql `UPDATE bids SET status = 'winner' WHERE id = ${bid_is}`;
        //respuesta con exito.
        res.json({
            message: 'Bid closed and accepted',
            auction_id: auction_id,
            winner_id: winner_hotel_id
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'error accepting the bid' });
    }
});


//* ESTA SECCION ES PARA ELIMINAR / BORRAR TANTO SUBASTAS COMO OFERTAS QUE ENVIO EL HOTEL. (borrado de la empresa)
//creo un delete, que recibe el id de la subasta por la url, junto con el token de seguridad. 
router.delete('/auction/:id', verifyToken, async (req, res) => {
    try {
        //*1) BORRADO DE SEGURIDAD. como una subasta puede tener varias ofertas asociadas, borramos todas las pujas que apunten a ella para evitar errores de llave foranea. 
        await sql`DELETE FROM bids WHERE auction_id = ${req.params.id}`;
        //* 2) BORRADO CON SEGURIDAD. como no basta con solo borrar por ID, tambien agredo AND company_id = req.user.id.. para asegurar que si el usuario a trata borrar la subasta de usuario b, la consulta no encontrara nada y no borrara nada.
        const result = await sql`
        DELETE FROM requests
        WHERE id = ${req.params.id} AND company_id = ${req.user.id}
        RETURNING id;
        `; //returning me sirve para saber si efectivamente se borro algo. Si el array result esta vacio, significa que el id no existia, o que la subasta no le pertenecia a la empresa
        if (result.length === 0) {
            return res.status(404).json({ error: 'Bid not found it o dont have access' });
        }
        //si salio bien, respondo con exito.
        res.json({ message: "Dib delete successfully" });
    } catch (error) {
        console.log(error, 'Not possible to delete. /auctions/delete');
        res.status(500).json({ error: "Error deleting the dib" });
    }
});

//* RUTA PARA QUE EL HOTEL RETIRE SU OFERTA ESPECIFICA POR SU ID (:ID)
router.delete('/bid/:id', verifyToken, async (req, res) => {
    try {
        //*SEGURIDAD: Solo el hotel que creo la oferta puede borrarla. Uso hotel_id = req.user.id que viene del token verificado. Asi evito que el hotel borre las ofertas de la competencia. 
        const result = await sql`
        DELETE FROM bids
        WHERE id = ${req.params.id} AND hotel_id = ${req.user.id}
        RETURNING id;
        `;
        //si el resultado = 0, la oferta no existe o el hotel no es el dueno. 
        if (result.length === 0) {
            res.status(404).json({ error: 'Dib not found it, or u dont have access' });
        }
        //Si fue exitosa, lo informo al front end y envio el mensaje
        res.json({ message: 'Dib deleted successfully' });
        //manejo de errores: 
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Not possible delete the dib that u send ' })
    }
});




//* ESTA SECCION ES PARA OBTENER EL REGISTRO DE MIS BIDS ACEPTADAS. (DE LA COMPANIA)
router.get('/history-company', verifyToken, async (req, res) => {
    try {
        //ejecuto la consulta sql para obtener los datos 
        const history = await sql`
        SELECT 
            r.*, 
            u.name as hotel_name, 
            u.phone as hotel_phone,
            (SELECT price FROM bids WHERE auction_id = r.id AND hotel_id = r.winner_id LIMIT 1) as accepted_price
            FROM requests r
            JOIN users u ON r.winner_id = u.id
            WHERE r.company_id = ${req.user.id} AND r.status = 'closed'
            ORDER BY r.id DESC;
        `;
        //?EXPLICACION: 
        //? r.* --> selecciona todas las columnas de la tabla requests
        //? u.name as hotel_name --> trae de la tabla users, columna name, y le pone de alias hotel_name
        //?JOIN users.. --> Une la tabla de requests(r.winner) con la de usuarios donde el ganador coincida con el id del usuario
        //? WHERE ... --> Filtra solo las solicitudes de esta empresa 'user.id' que ya esten cerradas
        //SI TODO SALE BIEN, DEVUELVO EL RESULTADO JSON AL CLIENTE
        res.json(history);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error getting the winner dibs" });
    }
});

//* RUTA PARA OBTENER EL HISTORIAL DE GANADORES(HOTELES): 
router.get('/history-hotel', verifyToken, async (req, res) => {
    try {
        const wins = await sql`
        SELECT r.*, 
            u.name as company_name, 
            u.phone as company_phone,
            (SELECT price FROM bids WHERE auction_id = r.id AND hotel_id = ${req.user.id} LIMIT 1) as accepted_price
        FROM requests r
        JOIN users u ON r.company_id = u.id
        WHERE r.winner_id = ${req.user.id} AND r.status = 'closed'
        ORDER BY r.id DESC;
        `;
        //?EXPLICACION: 
        //? r.* --> Selecciona todas las solicitudes ganadas.
        //? u.name --> trae el nombre dee la empresa que hizo el request. Y tambien el telefono
        //? JOIN --> Une con 'users' para obtener los datos de la empresa . Luego los FILTRA solo donde el usuario actual (user.id) sea el ganador y la subasta este cerrada.
        //devuelvo la lista json 
        res.json(wins);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error getting the winners of hotels" })
    }
});


//* OBTENER EL HISTORIAL DE OFERTAS ENVIADAS POR EL HOTEL: 
router.get('/my-sent-bids', verifyToken, async (req, res) => {
    try {
        //* 1) Inicio la consulta a la bd usando Template Tag de sql
        const bids = await sql`
        SELECT 
            b.id as bid_id, --ID de la oferta( alias bid_id)
            b.price, -- Precio que el hotel puso
            b.message as hotel_message, --Mensaje del hotel
            r.destination, -- De la tabla request, traigo destino
            r.rooms, -- De request, traigo rooms
            r.status as auction_status, --Estado actual de la sub
            u.name as company_name --de Users, traigo name de la empresa
            FROM bids b --La tabla principal es bids (alias b)
            -- UNION 1 --> Conecto la oferta con la subasta correspondiente. "Traeme los datos de 'request'donde el auction_id = con el id de la subasta 
            JOIN requests r ON b.auction_id = r.id
            --UNION 2 --> conecto la subasta con el usuario que la creo(company). "Traeme los datos de 'users' donde el company_id de la subasta = con el ID del usuario
            JOIN users u ON r.company_id = u.id
            --FILTRO DE SEGURIDAD, solo traigo las ofertas donde el hotel_id = del usuario que esta logueado ahora. Para evitar que el hotel vea las ofertas enviadas por otros hoteles
            WHERE b.hotel_id = ${req.user.id}
            ORDER BY r.destination ASC; 
            --ordenadas primero las ofertas mas recientes.
        `;
        //envio el rsultado(un array de objetos) al Front-end en formato JSON.
        res.json(bids);
    } catch (error) {
        console.log(error, 'Not possible to charge historyHotel');
        res.status(500).json({ error: 'Error getting your bids' });
    }
});


export default router; 
//y lo conecto al server.js con app.use(/api/auctions', auctionRouter)