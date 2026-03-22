import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { Order } from "./Order"
@Entity()
export class User {

    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    name: string
    @Column()
    phone:string
    @Column()
    cpf:string

    @Column()
    email: string

    @Column()
    password: string

    @Column({ default: "cliente" })
    role: string

    @OneToMany(()=>Order, (order)  => order.user)
    orders: Order[];
}
