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
router.post("/products", upload.single("image"), createProduct);
router.delete("/products/:id", authMiddleware, adminMiddleware, deletarProduto);
router.get("/products", listarProdutos);
router.put("/products/:id", authMiddleware, adminMiddleware, upload.single("image"), atualizarProduto);
router.post("/users", criarUsuario);
router.post("/login", loginUsuario);
router.get("/products/:id", buscarProdutoPorId);
router.post("/orders", criarPedido)
// routes.ts
router.post('/orders/webhook', webhookPedido);
export default router;


router.get('/payment-methods', async (req, Res) => {
  try {
    const response = await paymentMethodApi.get();  // ou .get() se for o método
    console.log(response);  // veja no console: visa, master, pix, boleto etc.
    Res.json(response);
  } catch (error) {
    Res.status(500).json(error);
  }
}); //so p teste pae

router.get('/orders/:id', buscarPedido);        // ← NOVA