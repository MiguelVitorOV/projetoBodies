import { Order } from "../entity/Order";
import { User } from "../entity/User";
import { AppDataSource } from "../data-source";
import { Request, Response } from "express";
import { OrderItem } from "../entity/OrderItem";
import { ProductVariant } from "../entity/ProductVariant";
import { item, orderItems, productVariant } from "../types/entityTypes";
import { MercadoPagoConfig, Payment } from 'mercadopago';

// 2. Inicializamos o cliente com o seu Token do Mercado Pago (que fica no .env)
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACESS_TOKEN as string });

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
        const payment = new Payment(client);
        const mpResponse = await payment.create({
            body: {
                transaction_amount: total, // O valor exato que calculamos
                token: paymentData.token, // O Token seguro do cartão
                description: `Compra Bereshit - Pedido ${order.id}`,
                installments: paymentData.installments, // Quantidade de parcelas
                payment_method_id: paymentData.payment_method_id, // Ex: 'visa', 'master', 'pix'
                issuer_id: paymentData.issuer_id,
                payer: {
                    email: paymentData.payer.email,
                    identification: paymentData.payer.identification // CPF do comprador
                }
            }
        });


        // 7. Avalia a resposta do Mercado Pago
        if (mpResponse.status === 'approved') {
            // Se aprovou, atualizamos o status para PAGO e abatemos o estoque!
            order.status = "PAGO";
            
            // Abatendo o estoque igual você fez na sua rota de atualizarStatus
            for (const item of orderItems) {
                item.variant.stockQuantity -= item.quantity;
                await variantRepository.save(item.variant);
            }
            
            await orderRepository.save(order);
        } else if (mpResponse.status === 'rejected') {
            order.status = "REJEITADO";
            await orderRepository.save(order);
            // Retorna erro 400 avisando que o cartão não passou
            return res.status(400).json({ error: "Pagamento recusado pela operadora do cartão." });
        }

        // 8. Devolve sucesso!
        res.status(201).json({ 
            message: "Pedido e Pagamento realizados com sucesso!", 
            order: order 
        });

    } catch (error) {
        console.error("Erro no checkout:", error);
        res.status(500).json({ error: "Erro ao processar o pagamento." });
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