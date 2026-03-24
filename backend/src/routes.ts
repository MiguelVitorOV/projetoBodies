import { Router } from "express";
import { authMiddleware, adminMiddleware } from "./middlewares/authMiddleware";
import { createProduct, deletarProduto, listarProdutos, atualizarProduto, buscarProdutoPorId } from "./controllers/ProductControllers";
import { criarUsuario, loginUsuario } from "./controllers/UserControllers";
import multer from "multer";
import { multerConfig } from "./multer";

import { paymentMethodApi } from "./mpConfig"; //só pra teste por enquanto
import { criarPedido } from "./controllers/OrderControllers";
import { webhookPedido, buscarPedido } from "./controllers/OrderControllers";



const router = Router();
const upload = multer(multerConfig);
router.post("/products", adminMiddleware, authMiddleware, upload.single("image"), createProduct);
router.delete("/products/:id", adminMiddleware, authMiddleware, deletarProduto);
router.get("/products", listarProdutos);
router.put("/products/:id", adminMiddleware, authMiddleware, upload.single("image"), atualizarProduto);
router.post("/users", criarUsuario);
router.post("/login", loginUsuario);
router.get("/products/:id", buscarProdutoPorId);
router.post("/orders", authMiddleware, criarPedido)
// routes.ts
router.post('/orders/webhook', webhookPedido);
router.get('/orders/:id', buscarPedido);        // ← NOVA
export default router;



