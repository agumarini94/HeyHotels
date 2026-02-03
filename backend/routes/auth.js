//aca va la logica d usuarios. Registro de los hoteles y empresas. 

import express from "express";  //Library to make the conection with the server 
import bcrypt from 'bcryptjs'; //Library to ecncrypt passwords. Security for the user. 
import jwt from "jsonwebtoken"; //Library for autentication, and verification of the user. (la pulsera en una fiesta)
import { sql } from '../db.js'; //importo la conexion a neon de la bd. 
import { verifyToken } from "../middleware/authMiddleware.js"; 


const router = express.Router(); //instancia del Router. divido 'el centro comercial' en pasillos. 


//RUTA POST /api/auth/register 
router.post('/register', async(req,res) => { //uso async xq las respuestas de la bd tardan tiempo, y no bloquear el flujo
    //extraigo los datos que el usuario envio en el cuerpo de la peticion JSON 
    const { name, email, password, role, phone } = req.body; 
    //VALIDACION DE QUE INGRESO TODOS LOS DATOS: 
    if (!name || !email || !password || !role || !phone) {
        return res.status(400).json({ error: "All fields are required" });
    }

try {
    //encriptar la contrasena (hashing), y genero un salt (relleno aleatorio) para que el hash sea mas seguro.
    const salt = await bcrypt.genSalt(10); //genera una contrasena mas larga de seguridad(letras aleaotias + mi password)
    const hashedPassword = await bcrypt.hash(password, salt);

    //insertar en la tabla de NEON. insertar dentro de users (values...)

    const result = await sql`
    INSERT INTO users (name, email, password, role, phone)
    VALUES (${name}, ${email}, ${hashedPassword}, ${role}, ${phone})
    RETURNING id, name , email, role, phone;
    `;//el returnin me trae los datos del usuario recien creados, menos la clave

    //respuesta exitosa en caso q salio bien: 
    res.status(201).json({
        message: "User created",
        user: result[0]
    });
} catch (error) {
    console.log(error);
    //controlo si el email ya existe: 
    if (error.code === '23505') {
        return res.status(400).json({ error: "This mail already exist" });
    }
    res.status(500).json({ error: "error creating the new user(maybe the user already exist" });
    }
});



//* RUTA PARA ACTUALIZAR LA CIUDAD DEL USUARIO: 
router.put('/update-profile', verifyToken, async (req, res) => {
    const { city } = req.body;
    try {
        //mando la solicitud a la bd 
        await sql`
        UPDATE users 
        SET city = ${city}
        WHERE id = ${req.user.id}
        `;
        res.json({ message: "Profile updated Successfully" });
    } catch (error) {
        res.status(500).json({ error: 'Not possible to update the profile' });
    }
})

//* RUTA PARA OBTENER LOS DATOS DEL PERFIL ACTUAL: 
router.get('/profile', verifyToken, async (req, res) => {
    try {
        //hago la solicitud a la bd
        const user = await sql`
        SELECT name, email, role, phone, city
        FROM users
        WHERE id = ${req.user.id}
        `;
        if (user.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        //si lo encontro devuelvo el resultado
        res.json(user[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Not possible charge your profile' })
    }
});

//* -------> Ruta para hacer el LOGIN <------ 
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        //* 1) -->busco en Neon el usuario por su email.
        const users = await sql`
        SELECT * FROM users WHERE email = ${email}
        `;

        if (users.length === 0) { //si no encontro el user
            return res.status(400).json({ error: 'Datos no validos(usuario)' });
        }
        //si lo encontro, lo devuelvo en user
        const user = users[0];

        //* 2) Comparo la contrasena con la encriptada en DB.
        const isMatchPassword = await bcrypt.compare(password, user.password);

        if (!isMatchPassword) { // si la clave no coincide 
            return res.status(400).json({ error: " Password not valid " })
        }
        //Si el password coincide --> 
        //? 3) Creo el TOKEN de seguridad aca <-- (como el pase vip)
        //guardo el id y el rol dentro del token
        const token = jwt.sign( //* ----> ACA NO GUARDAR DATOS SENCIBLES XQ SON FACIL DE LEER 
            { id: user.id, role: user.role }, //esto es el payload, la info que lleva el token
            //xq guardo el id ? para saber quien es el dueno del token. Y rol , para saber si mostrar el panel de admin o usuario (empresa o hotel)
            process.env.JWT_SECRET, //Sella el token. Si alguien intenta cambiar el role por ej, el sello se rompe  xq un hacker no tiene mi JWT_secreta para volver a sellarlo, y el server detecta q fue manipulado y lo rechaza 
            { expiresIn: '24h' } //el token expira en un dia. 
        );

        //* 4) --> Respondo con el token y los datos basicos del usuario: 
        res.json({
            message: 'Login succesfull',
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error trying to conect with the servidor(auth.js)" });
        
    }
});

export default router;  //esto lo exporte y lo recibi en server.js como authRoutes. Al ser default puede ponerle cualqueir nombre. 


