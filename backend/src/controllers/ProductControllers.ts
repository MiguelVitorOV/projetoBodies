import { AppDataSource } from "../data-source";
import { Product } from "../entity/Product";
import * as yup from "yup";
import { Request, Response } from "express";
import { ProductVariant } from "../entity/ProductVariant";
import { ProductRequestDTO } from "../types/entityTypes";


const schema = yup.object().shape({
    name: yup.string().required("O nome é obrigatório"),
    description: yup.string().required("A descrição é obrigatória"),
    price: yup.number().typeError("O preço deve ser um número").positive("O preço deve ser positivo").required(),
  
    variants: yup.array().of(
        yup.object().shape({
            size: yup.string().required(),
            color: yup.string().required(),
            stockQuantity: yup.number().required()
        })
    ).min(1, "Adicione pelo menos uma variante")
});

export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, description, price, variants, discount } = req.body as ProductRequestDTO;
        
        let parsedVariants: ProductVariant[];
        try {
            parsedVariants = JSON.parse(variants);
        } catch (e) {
            return res.status(400).json({ error: "Formato de variantes inválido (JSON esperado)" });
        }

        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "Imagem do produto é obrigatória" });
        }

        const productData = {
            name,
            description,
            price: parseFloat(price),
            variants: parsedVariants, 
            discount: discount ? parseFloat(discount) : 0,
            imageUrl: "" 
        };


        await schema.validate(productData, { abortEarly: false });

        const baseUrl = process.env.APP_URL;
        const imageUrl = `${baseUrl}/uploads/${file.filename}`;

        const productRepository = AppDataSource.getRepository(Product);
        const product = productRepository.create({ 
            ...productData, 
            imageUrl 
        });

        await productRepository.save(product);
        res.status(201).json(product);

    } catch (error) {
        if (error instanceof yup.ValidationError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error(error); 
        res.status(500).json({ error: "Erro ao criar produto" });
    }
}


export const deletarProduto = async (req: Request, res: Response) => {
    const { id } = req.params;
    const productRepository = AppDataSource.getRepository(Product);

    try {
     
        const product = await productRepository.findOneBy({ id: id as any });

        if (!product) {
            return res.status(404).json({ error: "Produto não encontrado" });
        }
        await productRepository.delete(id); 

        return res.status(200).json({ message: "Produto deletado com sucesso" });
    } catch (error) {
        console.error("Erro ao deletar:", error); 
        return res.status(500).json({ error: "Erro interno ao deletar produto" });
    } 
};
export const buscarProdutoPorId = async (req: Request, res: Response) => {
    const { id } = req.params;
    const productRepository = AppDataSource.getRepository(Product);

    try {
        const product = await productRepository.findOne({ 
            where: { id: id as string }, 
            relations: ["variants"] 
        });

        if (!product) {
            return res.status(404).json({ error: "Produto não encontrado" });
        }

        
        const precoReal = Number(product.price);
        const descontoReal = Number(product.discount || 0);
        const precoCalculado = precoReal - (precoReal * (descontoReal / 100));

        const produtoFormatado = {
            ...product,
            price: precoReal,
            discount: descontoReal,
            discountedPrice: precoCalculado
        };

        res.json(produtoFormatado);
    } catch (error) {
        console.error("Erro ao buscar produto por ID:", error);
        res.status(500).json({ error: "Erro ao buscar produto" });
    }
};

export const listarProdutos = async (req: Request, res: Response) => {
    const productRepository = AppDataSource.getRepository(Product);
    try {
        const products = await productRepository.find({ relations: ["variants"] });
        
        const produtosComDesconto = products.map(product => {
          
            const precoReal = Number(product.price);
            const descontoReal = Number(product.discount || 0);
            
            const precoCalculado = precoReal - (precoReal * (descontoReal / 100));

            return {
                ...product,
                price: precoReal,
                discount: descontoReal,
                discountedPrice: precoCalculado
            };
        });
        
      
        console.log("ESPIÃO DO BACKEND:", produtosComDesconto[0]);
        
        res.json(produtosComDesconto);
    } catch (error) {
        console.error("Erro no listarProdutos:", error);
        res.status(500).json({ error: "Erro ao listar produtos" });
    }
}


export const atualizarProduto = async (req: Request, res: Response) => {
    const { id } = req.params;

    const { name, description, price, variants, discount } = req.body as ProductRequestDTO;
    
    const productRepository = AppDataSource.getRepository(Product);

    try {

        const product = await productRepository.findOne({
            where: { id: id as string },
            relations: ["variants"]
        });

        if (!product) {
            return res.status(404).json({ error: "Produto não encontrado" });
        }


        let parsedVariants = product.variants; 
        if (variants) { 
            try {
                parsedVariants = JSON.parse(variants);
            } catch (e) {
                return res.status(400).json({ error: "Formato de variantes inválido" });
            }
        }

        let imageUrl = product.imageUrl; 
        const file = req.file;
        if (file) {

            const baseUrl = process.env.APP_URL;
            imageUrl = `${baseUrl}/uploads/${file.filename}`;
          
        }

        const updatedData = {
            name: name || product.name,
            description: description || product.description,
            price: price ? parseFloat(price) : product.price,
            discount: discount ? parseFloat(discount) : product.discount,
            variants: parsedVariants,
            imageUrl: imageUrl
        };

        productRepository.merge(product, updatedData);
        
        await productRepository.save(product);
        res.json(product);

    } catch (error) {
        if (error instanceof yup.ValidationError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar produto" });
    }
}