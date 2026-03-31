import { AppDataSource } from "../data-source";
import { Product } from "../entity/Product";
import * as yup from "yup";
import { Request, Response } from "express";
import { ProductVariant } from "../entity/ProductVariant";
import { ProductRequestDTO } from "../types/entityTypes";
import { supabase } from "../supabase";


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
        const { name, description, price, variants, discount } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ error: "Imagem é obrigatória" });

        // 1. Gerar nome único para o arquivo
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const filePath = `product-images/${fileName}`;

        // 2. Upload para o Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('products') // Nome do seu bucket
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (uploadError) throw uploadError;

        // 3. Pegar a URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

        // 4. Salvar no Banco de Dados
        const productRepository = AppDataSource.getRepository(Product);
        const product = productRepository.create({
            name,
            description,
            price: parseFloat(price),
            discount: discount ? parseFloat(discount) : 0,
            imageUrl: publicUrl, // URL do Supabase
            // ... variantes (mantenha sua lógica de parse aqui)
        });

        // (Resto da sua lógica de salvar variantes...)
        await productRepository.save(product);
        res.status(201).json(product);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao criar produto" });
    }
}


export const deletarProduto = async (req: Request, res: Response) => {
    const { id } = req.params;
    const productRepository = AppDataSource.getRepository(Product);

    try {
        const product = await productRepository.findOneBy({ id: id as any });
        if (!product) return res.status(404).json({ error: "Produto não encontrado" });

        // Extrair o nome do arquivo da URL do Supabase para deletar
        // Ex: https://.../products/product-images/123.jpg -> product-images/123.jpg
        const urlParts = product.imageUrl.split('/');
        const fileName = urlParts.slice(-2).join('/'); // Pega as últimas duas partes (pasta + arquivo)

        await supabase.storage.from('products').remove([fileName]);
        await productRepository.delete(id); 

        return res.status(200).json({ message: "Produto e imagem deletados" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao deletar" });
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
  const { name, description, price, variants, discount } = req.body;

  const productRepository = AppDataSource.getRepository(Product);
  const variantRepository = AppDataSource.getRepository(ProductVariant);

  try {
    const product = await productRepository.findOne({
      where: { id: id as string },
      relations: ["variants"]
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    let imageUrl = product.imageUrl;

    // ✅ Lógica de Upload para o Supabase se houver novo arquivo
    if (req.file) {
      // 1. Opcional: Deletar a imagem antiga do Supabase para economizar espaço
      if (product.imageUrl) {
        const oldFileName = product.imageUrl.split('/').pop(); // Pega o nome do arquivo
        if (oldFileName) {
          await supabase.storage
            .from('products')
            .remove([`product-images/${oldFileName}`]);
        }
      }

      // 2. Upload da nova imagem
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 3. Pegar a nova URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);
      
      imageUrl = publicUrl;
    }

    // ✅ MERGE dos dados do produto
    productRepository.merge(product, {
      name: name || product.name,
      description: description || product.description,
      price: price ? parseFloat(price) : product.price,
      discount: discount ? parseFloat(discount) : product.discount,
      imageUrl
    });

    await productRepository.save(product);

    // ✅ Atualização de variantes (Lógica original mantida)
    if (variants) {
      await variantRepository.delete({ product: { id: product.id } });
      
      const parsedVariants = JSON.parse(variants);
      for (const vData of parsedVariants) {
        const newVariant = variantRepository.create({
          color: vData.color,
          size: vData.size,
          stockQuantity: vData.stockQuantity,
          product: product
        });
        await variantRepository.save(newVariant);
      }
    }

    const productCompleto = await productRepository.findOne({
      where: { id: product.id },
      relations: ["variants"]
    });

    res.json(productCompleto);

  } catch (error) {
    console.error('❌ Erro ao atualizar:', error);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
}

export const atualizarEstoqueLote = async (req: Request, res: Response) => {
  const { updates } = req.body; // Espera algo como: { "id1": 10, "id2": 5 }

  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nenhum dado para atualizar' });
  }

  try {
    const repo = AppDataSource.getRepository(ProductVariant);

    // Criamos uma lista de promessas para rodar todas as atualizações
    const updatePromises = Object.entries(updates).map(([id, quantity]) => {
      return repo.update(id, { stockQuantity: Number(quantity) });
    });

    // Executa todas de uma vez
    await Promise.all(updatePromises);

    return res.json({ message: "Estoques atualizados com sucesso!" });
  } catch (error) {
    console.error("Erro no bulk update:", error);
    return res.status(500).json({ error: 'Erro interno ao atualizar estoque' });
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