//es como un guardia, que antes de que una empresa pueda crear una subasta, revisa el token. 
//basicamente verifico si el usuario tiene permiso de entrar
import jwt from 'jsonwebtoken';
//req--> trae los datos del cliente .res--> lo que enviamos de vuelta. next --> salta al sig paso si todo esta bien.

export const verifyToken = (req, res, next) => {
    //obtengo el token del encabezado(header), generalmetne el cliente lo manda en una llave llamada authoriz..
    const token = req.header('Authorization');
    if (!token) { // si no hay token lo rechazo directamente 
        return res.status(401).json({ error: "Not allow connect, u dont have token" });
    }

    try {
        //* 2) limpieza y verificacion. A veces el token viene como 'Bearer xxxx..' , aca le quito el Bearer para quedarme solo con el codigo.
        const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET); //token limpio

        //* 3) guardo los datos dentro del req.(la peticion)
        req.user = verified;

        //* 4) next. seguir al siguiente paso
        next();
    } catch (error) {
        console.log(error.message, ' este es el error')
        res.status(400).json({ error: "Token invalido" });
        
    }


}