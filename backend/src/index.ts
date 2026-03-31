import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source";
import routes from "./routes"; 
import cors from "cors";

AppDataSource.initialize().then(() => {
    const app = express();

    // ✅ Configuração de CORS (Habilite o que for necessário para seu front-end)
    // app.use(cors());
        app.use(cors({
  origin: 'https://projeto-bodies.vercel.app/',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

    // ❌ REMOVIDO: express.static e caminhoDasImagens
    // Pois agora suas imagens são URLs diretas do Supabase (https://xyz.supabase.co/...)

    // ✅ Webhook do Stripe ou similar (deve vir ANTES do express.json)
    app.use('/orders/webhook', express.raw({ type: 'application/json' }));

    // ✅ Middlewares padrão
    app.use(express.json()); 
    app.use(routes);

    const PORT = process.env.PORT || 3000;
    
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
        console.log(`☁️ Imagens sendo gerenciadas via Supabase Storage`);
    });

}).catch((error) => {
    console.error("❌ Erro ao inicializar o banco de dados:", error);
}); 