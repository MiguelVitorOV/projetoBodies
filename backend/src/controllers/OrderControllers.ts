import { Order } from "../entity/Order";
import { User } from "../entity/User";
import { AppDataSource } from "../data-source";
import { Request, Response } from "express";
import { OrderItem } from "../entity/OrderItem";
import { ProductVariant } from "../entity/ProductVariant";
import { item, orderItems, productVariant } from "../types/entityTypes";
import crypto from 'crypto';
import { MercadoPagoConfig, Order as MPOrder, Payment} from 'mercadopago';  // Comente Order
import { enviarMensagemPedido } from '../services/whatsappService';
// Use só ordersApi.create()
const client = new MercadoPagoConfig({ accessToken: process.env.MP_BLA! });
const ordersApi = new MPOrder(client);

export const criarPedido = async (req: Request, res: Response) => {
    // 3. Recebemos os items E os dados de pagamento (formData) que o React vai mandar
    const { userId, items, paymentData } = req.body;
    
    const orderRepository = AppDataSource.getRepository(Order);
    const userRepository = AppDataSource.getRepository(User);
    const variantRepository = AppDataSource.getRepository(ProductVariant);
    
    try {

        const user = await userRepository.findOneBy({ id: userId });
        if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

        const orderItems: OrderItem[] = [];
        const buscasNoBanco = items.map((item: item) => variantRepository.findOne({ where: { id: item.variantId }, relations: ["product"] }));
        const variantesEncontradas = await Promise.all(buscasNoBanco);
        
        let total = 0;

        // 4. Calculamos o Total real no servidor (Nunca confie no total que vem do Frontend, o usuário pode alterar no navegador!)
        for (let i = 0; i < items.length; i++) {
            const itemPedido = items[i];
            const variant = variantesEncontradas[i];

            if (!variant) return res.status(404).json({ error: `Variante não encontrada!` });
            if (variant.stockQuantity < itemPedido.quantity) return res.status(400).json({ error: `Estoque insuficiente` });

            const precoReal = Number(variant.product.price);
            const desconto = Number(variant.product.discount || 0);
            const precoFinal = precoReal - (precoReal * (desconto / 100));

            const orderItem = new OrderItem();
            orderItem.variant = variant;
            orderItem.quantity = itemPedido.quantity;
            orderItem.price = precoFinal;

            orderItems.push(orderItem);
            total += orderItem.price * itemPedido.quantity;
        }

        // 5. Salva o pedido como PENDENTE no banco primeiro (caso dê erro no cartão, o pedido fica salvo)
        let order = orderRepository.create({ user, total, items: orderItems, status: "PENDING" });
        order = await orderRepository.save(order);

        // 6. A HORA DA VERDADE: Efetuar a cobrança no Mercado Pago
        
        const idempotencyKey = crypto.randomUUID(); 

        const mpBody = {
  type: "online",
  processing_mode: "automatic",  // ← CHAVE: modo Transparente oficial
  external_reference: `order_${order.id}`,
  total_amount: Number(total).toFixed(2),  // MP quer decimal
  payer: paymentData.payer,  // Já vem perfeito do React
  transactions: {
    payments: [{
        amount: Number(total).toFixed(2),
        payment_method: paymentData.payment_method_id === 'pix'
            ? {
                id: "pix",
                type: "bank_transfer"
                // sem token, sem installments!
            }
            : {
                id: paymentData.payment_method_id,
                type: "credit_card",
                token: paymentData.token,
                installments: Number(paymentData.installments || 1)
            }
    }]
}
};

const mpResponse = await ordersApi.create({  // ← ordersApi = seu MPOrder(client)
  body: mpBody,
  requestOptions: { idempotencyKey }
});
console.log("MP RESPONSE:", JSON.stringify(mpResponse, null, 2));


console.log("STATUS RECEBIDO:", mpResponse.status); // O que aparece aqui?
console.log("É processed?", mpResponse.status === 'processed');
        // 7. Avalia a resposta do Mercado Pago
        if (mpResponse.status === 'approved' || mpResponse.status === 'processed') {
            // Se aprovou, atualizamos o status para PAGO e abatemos o estoque!
            order.status = "PAGO";
            
            // Abatendo o estoque igual você fez na sua rota de atualizarStatus
            for (const item of orderItems) {
    const variantAtualizada = await variantRepository.findOne({
        where: { id: item.variant.id }
    });
    if (variantAtualizada) {
        variantAtualizada.stockQuantity -= item.quantity;
        await variantRepository.save(variantAtualizada);
    }
}
            
            await orderRepository.save(order);
            await enviarMensagemPedido(order);
        } else if (mpResponse.status === 'action_required') {
    // ← PIX entra aqui! Aguardando pagamento
    order.status = "PENDING";
    await orderRepository.save(order);

    // Retorna QR pro React mostrar
    const pixData = mpResponse.transactions?.payments?.[0]?.payment_method;
    return res.status(200).json({
        message: "Pix gerado! Aguardando pagamento.",
        qr_code: pixData?.qr_code,
        qr_code_base64: pixData?.qr_code_base64,
        ticket_url: pixData?.ticket_url,
        order
    }); 
  }  else if (mpResponse.status === 'rejected') {
            order.status = "REJEITADO";
            await orderRepository.save(order);
            // Retorna erro 400 avisando que o cartão não passou
            return res.status(400).json({ error: mpResponse.status_detail });
        }

        // 8. Devolve sucesso!
        res.status(201).json({ 
            message: "Pedido e Pagamento realizados com sucesso!", 
            order: order 
        });

    } catch (error) {
        console.log("ERRO COMPLETO:", JSON.stringify(error, null, 2));
  // Expande o details que fica em error.cause ou error.details
  console.log("DETAILS:", JSON.stringify(error?.cause, null, 2));
  res.status(500).json({ 
    error: "Erro ao processar o pagamento.",
    detalhes: error?.cause || error?.message 
  });
    }
}

export const cancelarPedido = async (req: Request, res: Response) => {
    const { id } = req.params;
    const orderRepository = AppDataSource.getRepository(Order);
    try {
        const order = await orderRepository.findOne({
            where: { id: id as string },
            relations: ["items", "items.variant"]
        });
        if (!order) {
            return res.status(404).json({ error: "Pedido não encontrado" });
        }
        if (order.status !== "PENDING") {
            return res.status(400).json({ error: "Somente pedidos pendentes podem ser cancelados" });
        }
        await orderRepository.remove(order);
        res.json({ message: "Pedido cancelado com sucesso" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao cancelar pedido" });
    }
}


export const listarPedidos = async (req: Request, res: Response) => {
    const orderRepository = AppDataSource.getRepository(Order);
    try {
        const orders = await orderRepository.find({
            relations: ["user", "items", "items.variant", "items.variant.product"]
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: "Erro ao listar pedidos" });
    }
}

export const atualizarStatusPedido = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const orderRepository = AppDataSource.getRepository(Order);
    try {
        const order = await orderRepository.findOne({
            where: { id: id as string },
            relations: ["items", "items.variant"]
        });
        if (!order) {
            return res.status(404).json({ error: "Pedido não encontrado" });
        }
        if(order.status !== "PAGO" && status === "PAGO"){
            const variantRepository = AppDataSource.getRepository(ProductVariant);
            const variantesParaAtualizar: ProductVariant[] = [];
            for(const item of order.items) {
                const variant = await variantRepository.findOne(
                    {where: {id: item.variant.id},
                    relations: ["product"]
                });
                if(!variant) {
                    return res.status(404).json({ error: `Variante de produto com ID ${item.variant.id} não encontrada` });
                }
                if (variant.stockQuantity < item.quantity) {
                    return res.status(400).json({ 
                        error: `Opa! O produto ${variant.id} esgotou antes da confirmação do pagamento.` 
                    });
                }
                variant.stockQuantity -= item.quantity;
                variantesParaAtualizar.push(variant);
            }
            await variantRepository.save(variantesParaAtualizar);
        }
        order.status = status;
        await orderRepository.save(order);
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: "Erro ao atualizar status do pedido" });
    }
}


export const webhookPedido = async (req: Request, res: Response) => {
    const body = req.body instanceof Buffer 
        ? JSON.parse(req.body.toString()) 
        : req.body;

    const { type, data } = body;
    console.log("1️⃣ WEBHOOK RECEBIDO:", type, data);

    // ✅ Orders API usa type 'order'
    if (type === 'order') {
        try {
            const response = await fetch(
                `https://api.mercadopago.com/v1/orders/${data.id}`,
                { headers: { Authorization: `Bearer ${process.env.MP_BLA}` } }
            );
            const order_mp = await response.json() as { status: string; external_reference: string };

    

            console.log("2️⃣ ORDER STATUS:", order_mp.status);
            console.log("3️⃣ EXTERNAL REF:", order_mp.external_reference);

            const localOrderId = order_mp.external_reference?.replace('order_', '');
            console.log("4️⃣ LOCAL ORDER ID:", localOrderId);

            const orderRepository = AppDataSource.getRepository(Order);

            const order = await orderRepository.findOne({
                where: { id: localOrderId },
                relations: ["items", "items.variant"]
            });
            console.log("5️⃣ ORDER ENCONTRADA:", order?.id, "STATUS:", order?.status);

            // ✅ Status correto da Orders API é 'paid'
            if (order && order.status !== 'PAGO' && order_mp.status === 'paid') {
    // ⚠️ FALTA ISSO:
    const variantRepository = AppDataSource.getRepository(ProductVariant);
    for (const item of order.items) {
        const variant = await variantRepository.findOne({ where: { id: item.variant.id } });
        if (variant) {
            variant.stockQuantity -= item.quantity;
            await variantRepository.save(variant);
        }
    }
    order.status = 'PAGO';
    await orderRepository.save(order);
    await enviarMensagemPedido(order);
}
        } catch(e: any) {
            console.log("❌ ERRO NO WEBHOOK:", e?.message || e);
        }
    }

    res.status(200).send('OK');
};

export const buscarPedido = async (req: Request, res: Response) => {
    const { id } = req.params;
    const orderRepository = AppDataSource.getRepository(Order);
    try {
        const order = await orderRepository.findOne({ where: { id: id as string } });
        if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar pedido" });
    }
};