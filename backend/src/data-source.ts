import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
import dotenv from "dotenv"
import { ProductVariant } from "./entity/ProductVariant"
import { Product } from "./entity/Product"
import { OrderItem } from "./entity/OrderItem"
import { Order } from "./entity/Order"
dotenv.config()
export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "test",
    synchronize: false,
    logging: false,
    entities: [User, Order, OrderItem, Product, ProductVariant],
    migrations: ["src/migrations/*.ts"]
})
