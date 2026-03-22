import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Product } from "./Product";
@Entity()
export class ProductVariant {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    color: string; 

    @Column()
    size: string;

    @Column()
    stockQuantity: number; 

    @ManyToOne(() => Product, (product) => product.variants, {onDelete:"CASCADE"})
    product: Product;
}