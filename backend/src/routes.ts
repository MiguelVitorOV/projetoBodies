import { Router } from "express";
import { authMiddleware, adminMiddleware } from "./middlewares/authMiddleware";
import { 
    createProduct, 
    deletarProduto, 
    listarProdutos, 
    atualizarProduto, 
    buscarProdutoPorId, 
    atualizarEstoqueLote 
} from "./controllers/ProductControllers";
import { criarUsuario, loginUsuario } from "./controllers/UserControllers";
import multer from "multer";
import { multerConfig } from "./multer";

import { paymentMethodApi } from "./mpConfig";
import { criarPedido, webhookPedido, buscarPedido } from "./controllers/OrderControllers";

const router = Router();
const upload = multer(multerConfig);

// --- Rotas de Produtos ---
router.get("/products", listarProdutos);
router.get("/products/:id", buscarProdutoPorId);
router.post("/products", authMiddleware, adminMiddleware, upload.single("image"), createProduct);
router.put("/products/:id", authMiddleware, adminMiddleware, upload.single("image"), atualizarProduto);
router.delete("/products/:id", authMiddleware, adminMiddleware, deletarProduto);

// --- Rotas de Variantes/Estoque ---
router.patch("/variants/update-bulk", authMiddleware, adminMiddleware, atualizarEstoqueLote);

// --- Rotas de Usuário ---
router.post("/users", criarUsuario);
router.post("/login", loginUsuario);

// --- Rotas de Pedidos ---
router.post("/orders", authMiddleware, criarPedido);
router.get('/orders/:id', buscarPedido);
router.post('/orders/webhook', webhookPedido);

// --- Rotas de Teste/Health ---
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.get('/payment-methods', async (req, res) => {
  try {
    const response = await paymentMethodApi.get();
    res.json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});

// ✅ O EXPORT DEVE SER SEMPRE A ÚLTIMA COISA DO ARQUIVO
export default router;