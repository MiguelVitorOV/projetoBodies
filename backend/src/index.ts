import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source";
import routes from "./routes"; 
import cors from "cors";
import path from "path";

AppDataSource.initialize().then(() => {
    const app = express();

    app.use(cors({
  origin: 'https://projeto-bodies.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
    // O MESMO CAMINHO DO MULTER (Saindo do backend e indo pra uploads)
    const caminhoDasImagens = path.resolve(process.cwd(), "..", "uploads");
    app.use("/uploads", express.static(caminhoDasImagens));
    
app.use('/orders/webhook', express.raw({ type: 'application/json' }));

    app.use(express.json()); 
    app.use(routes);

    const PORT = process.env.PORT;
    
    return app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
        console.log(`📸 Servindo imagens da pasta exata: ${caminhoDasImagens}`);
    });

}).catch((error) => {
    console.error("Erro ao inicializar o banco de dados:", error);
});