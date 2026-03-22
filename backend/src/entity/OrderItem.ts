import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Order } from "./Order";
import { ProductVariant } from "./ProductVariant";

@Entity()
export class OrderItem {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    quantity: number; 

    @Column('decimal')
    price: number; 

    @ManyToOne(() => Order, (order) => order.items)
    order: Order;

    @ManyToOne(() => ProductVariant) 
    variant: ProductVariant;
}