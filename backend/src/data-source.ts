import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
import { ProductVariant } from "./entity/ProductVariant"
import { Product } from "./entity/Product"
import { OrderItem } from "./entity/OrderItem"
import { Order } from "./entity/Order"
import dotenv from "dotenv"

dotenv.config()

export const AppDataSource = new DataSource({
    type: "postgres",
    // No Supabase, o host costuma ser algo como: db.xxxx.supabase.co
    host: process.env.DB_HOST, 
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD,
    // No Supabase, o nome do banco padrão é "postgres"
    database: process.env.DB_NAME || "postgres",
    synchronize: false,
    logging: false,
    entities: [User, Order, OrderItem, Product, ProductVariant],
    migrations: ["src/migrations/*.ts"],
    
    // --- ADICIONE ISSO PARA O SUPABASE NO RENDER ---
    ssl: {
        rejectUnauthorized: false // Permite a conexão segura sem exigir certificado local
    },
    // Opcional: mantém a conexão viva por mais tempo
    extra: {
        ssl: {
            rejectUnauthorized: false,
        },
    }
})