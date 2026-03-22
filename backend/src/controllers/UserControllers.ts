import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import * as yup from "yup";


const schema = yup.object().shape({
    name: yup.string().required("O nome é obrigatório"),
    email: yup.string().email("E-mail inválido").required("O e-mail é obrigatório"),
    password: yup.string().min(6, "A senha deve ter no mínimo 6 caracteres").required("A senha é obrigatória"),
    
    cpf: yup.string().length(11, "O CPF deve ter 11 dígitos (apenas números)").required("O CPF é obrigatório"),
    phone: yup.string().min(10, "Telefone inválido").required("O telefone é obrigatório")
});


export const criarUsuario = async (req: Request, res: Response) => {
    const { name, email, password, phone, cpf} = req.body;
    try {
        await schema.validate(req.body, { abortEarly: false });
        const userRepository = AppDataSource.getRepository(User);
        const existingCpf = await userRepository.findOneBy({cpf})
        const existingPhone = await userRepository.findOneBy({phone})
        const existingUser = await userRepository.findOneBy({ email});
        if (existingUser) {
            return res.status(400).json({ error: "Email já está em uso" });
        }
        if(existingCpf){
            return res.status(400).json({error: "Cpf ja está em uso"})
        }
        if(existingPhone){
            return res.status(400).json({error:"Telefone ja está em uso!"})
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = userRepository.create({ name, email, password: hashedPassword, phone, cpf });
        await userRepository.save(user);
        res.status(201).json({ message: "Usuário criado com sucesso" });
    } catch (error) {
        console.error("ERRO REAL:", error);
        if (error instanceof yup.ValidationError) {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ error: "Erro ao criar usuário" });
    }
}


export const loginUsuario = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOneBy({ email });
        if (!user) {
            return res.status(400).json({ error: "Email ou senha inválidos" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Email ou senha inválidos" });
        }
        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "4h" });
        res.json({user:{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token
        }});
    } catch (error) {
        res.status(500).json({ error: "Erro ao fazer login" });
    }
}