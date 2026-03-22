import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { CheckoutForm } from './CheckoutForm'; // Ajuste esse caminho!
import '../css/ProductDetails.css';

export function ProductDetails() {
  const { id } = useParams<{ id: string }>(); 
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados de seleção
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  
  // NOVO: Estado para controlar se mostramos o Checkout ou os detalhes
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3000/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Produto não encontrado");
        return res.json();
      })
      .then((data: Product) => {
        setProduct(data);
        if (data.variants.length > 0) {
          setSelectedColor(data.variants[0].color);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="loading">Buscando detalhes da peça...</div>;
  if (!product) return <div className="error-msg">Produto não encontrado.</div>;

  const availableColors = Array.from(new Set(product.variants.map(v => v.color)));
  const variantsOfSelectedColor = product.variants.filter(v => v.color === selectedColor);
  const availableSizes = Array.from(new Set(variantsOfSelectedColor.map(v => v.size)));

  const currentVariant = product.variants.find(
    v => v.color === selectedColor && v.size === selectedSize
  );

  // NOVO: Função que abre o checkout
  const handleBuyNow = () => {
    if (!currentVariant) {
      alert("Por favor, selecione um tamanho.");
      return;
    }
    setShowCheckout(true); // Muda a tela para o formulário de pagamento!
  };

  // Preço real com desconto aplicado (se houver)
  const precoFinal = product.discount > 0 ? product.discountedPrice : product.price;

  // ==========================================
  // RENDERIZAÇÃO DO CHECKOUT
  // ==========================================
  if (showCheckout && currentVariant) {
    return (
      <div className="details-container">
        <button className="btn-back" onClick={() => setShowCheckout(false)}>
          ← Voltar para os detalhes da peça
        </button>
        
        {/* Chamando a caixinha do Mercado Pago que criamos */}
        <CheckoutForm 
          // ATENÇÃO: Coloque o ID de um User que REALMENTE EXISTE no seu banco de dados para testar!
          userId="6c9f2f7f-1e62-4e6b-a8e5-f0163c3e122e" 
          items={[{ variantId: currentVariant.id as string, quantity: 1 }]} 
          totalAmount={precoFinal} 
        />
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO DOS DETALHES DO PRODUTO (Padrão)
  // ==========================================
  return (
    <div className="details-container">
      <button className="btn-back" onClick={() => navigate('/catalogo')}>
        ← Voltar ao Catálogo
      </button>

      <div className="product-layout">
        <div className="product-image-section">
          {product.discount > 0 && <span className="discount-badge-large">-{product.discount}%</span>}
          <img src={product.imageUrl} alt={product.name} className="main-image" />
        </div>

        <div className="product-info-section">
          <h1 className="details-title">{product.name}</h1>
          <p className="details-description">{product.description}</p>

          <div className="details-price">
            {product.discount > 0 ? (
              <>
                <span className="old-price">R$ {Number(product.price).toFixed(2)}</span>
                <span className="new-price">R$ {Number(product.discountedPrice).toFixed(2)}</span>
              </>
            ) : (
              <span className="new-price">R$ {Number(product.price).toFixed(2)}</span>
            )}
          </div>

          <div className="selection-area">
            <div className="variant-group">
              <span className="variant-label">Cor: <strong>{selectedColor}</strong></span>
              <div className="variant-options">
                {availableColors.map(color => (
                  <button 
                    key={color} 
                    className={`variant-btn ${selectedColor === color ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedColor(color);
                      setSelectedSize('');
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="variant-group">
              <span className="variant-label">Tamanho: {selectedSize ? <strong>{selectedSize}</strong> : <small>(Escolha um)</small>}</span>
              <div className="variant-options">
                {availableSizes.map(size => {
                  const variantInfo = variantsOfSelectedColor.find(v => v.size === size);
                  const isOutOfStock = variantInfo ? variantInfo.stockQuantity <= 0 : true;

                  return (
                    <button 
                      key={size} 
                      disabled={isOutOfStock}
                      className={`variant-btn size-btn ${selectedSize === size ? 'active' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {currentVariant && (
            <div className={`stock-info ${currentVariant.stockQuantity < 5 ? 'low-stock' : 'in-stock'}`}>
              {currentVariant.stockQuantity > 0 
                ? `Em estoque: ${currentVariant.stockQuantity} unidades disponíveis` 
                : 'Esgotado nesta variação!'}
            </div>
          )}

          <button 
            className="btn-add-cart" 
            disabled={!currentVariant || currentVariant.stockQuantity <= 0}
            onClick={handleBuyNow}
          >
            {currentVariant && currentVariant.stockQuantity <= 0 ? 'Produto Esgotado' : 'Comprar Agora'}
          </button>
        </div>
      </div>
    </div>
  );
}