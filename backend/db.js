//* --> aca va la conexion a la db neon 
import { neon } from '@neondatabase/serverless' 
import dotenv from 'dotenv'; //para guardar las claves de forma segura 

dotenv.config();



//EXPORTO LA FUNCION SQL PARA USASRLA EN OTROS ARCHIVOS.
export const sql = neon(process.env.DATABASE_URL); 
