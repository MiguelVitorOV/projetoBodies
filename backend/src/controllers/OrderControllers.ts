import { Order } from "../entity/Order";
import { User } from "../entity/User";
import { AppDataSource } from "../data-source";
import { Request, Response } from "express";
import { OrderItem } from "../entity/OrderItem";
import { ProductVariant } from "../entity/ProductVariant";
import { item, orderItems, productVariant } from "../types/entityTypes";
import crypto from 'crypto';
import { MercadoPagoConfig, Order as MPOrder, Payment} from 'mercadopago'; 
import { enviarMensagemPedido } from '../services/whatsappService';
const client = new MercadoPagoConfig({ accessToken: process.env.MP_BLA! });
const ordersApi = new MPOrder(client);

export const criarPedido = async (req: Request, res: Response) => {
   
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

       
        let order = orderRepository.create({ user, total, items: orderItems, status: "PENDING" });
        order = await orderRepository.save(order);

        const idempotencyKey = crypto.randomUUID(); 

        const mpBody = {
  type: "online",
  processing_mode: "automatic", 
  external_reference: `order_${order.id}`,
  total_amount: Number(total).toFixed(2), 
  payer: paymentData.payer,  
  transactions: {
    payments: [{

        amount: Number(total).toFixed(2),
        payment_method: paymentData.payment_method_id === 'pix'
            ? {
                id: "pix",
                type: "bank_transfer"
                
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

const mpResponse = await ordersApi.create({ 
  body: mpBody,
  requestOptions: { idempotencyKey }
});
console.log("MP RESPONSE:", JSON.stringify(mpResponse, null, 2));


console.log("STATUS RECEBIDO:", mpResponse.status);
console.log("É processed?", mpResponse.status === 'processed');
   
        if (mpResponse.status === 'approved' || mpResponse.status === 'processed') {
            
            
            
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
 
    order.status = "PENDING";
    await orderRepository.save(order);


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
           
            return res.status(400).json({ error: mpResponse.status_detail });
        }

        res.status(201).json({ 
            message: "Pedido e Pagamento realizados com sucesso!", 
            order: order 
        });

    } catch (error) {
        console.log("ERRO COMPLETO:", JSON.stringify(error, null, 2));
 
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

    if (type === 'payment') {
        try {
            const paymentApi = new Payment(client);
            const pagamento = await paymentApi.get({ id: data.id });
            console.log("2️⃣ PAGAMENTO STATUS:", pagamento.status);
            console.log("3️⃣ EXTERNAL REF:", pagamento.external_reference);

            const localOrderId = pagamento.external_reference?.replace('order_', '');
            console.log("4️⃣ LOCAL ORDER ID:", localOrderId);

            const orderRepository = AppDataSource.getRepository(Order);
            const variantRepository = AppDataSource.getRepository(ProductVariant);

            const order = await orderRepository.findOne({
                where: { id: localOrderId },
                relations: ["items", "items.variant"]
            });
            console.log("5️⃣ ORDER ENCONTRADA:", order?.id, "STATUS:", order?.status);

            if (order && order.status !== 'PAGO'
                && pagamento.status === 'approved'
            ) {
                order.status = 'PAGO';
                await orderRepository.save(order);
                await enviarMensagemPedido(order);
                console.log("6️⃣ PEDIDO ATUALIZADO PARA PAGO ✅");
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