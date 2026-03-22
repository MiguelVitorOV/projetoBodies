import { useEffect, useState } from 'react';
import type { Product } from '../types';
import { ProductFilters } from './ProductFilters';
import '../css/ProductCatalog.css';
import { useNavigate } from 'react-router-dom';

export function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados dos nossos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSize, setSelectedSize] = useState('Todos');
  const navigate = useNavigate();
  useEffect(() => {
    fetch('http://localhost:3000/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar produtos:", err);
        setLoading(false);
      });
  }, []);

  // Lógica de filtragem
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Se for 'Todos', passa direto. Se não, procura nas variantes se existe o tamanho clicado
    const matchesSize = selectedSize === 'Todos' || 
                        product.variants.some(v => v.size.toUpperCase() === selectedSize);

    return matchesSearch && matchesSize;
  });

  const handleViewDetails = (productId: string) => {
  navigate(`/produto/${productId}`);
};

  if (loading) return <div className="loading">Carregando coleção Bereshit...</div>;

  return (
    <div className="catalog-container">
      <h1 className="catalog-title">Coleção Bereshit</h1>
      
      {/* Nosso componente de Filtro lindão aqui */}
      <ProductFilters 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        selectedSize={selectedSize} 
        setSelectedSize={setSelectedSize} 
      />

      <div className="products-grid">
        {filteredProducts.map(product => (
          <div key={product.id} className="product-card">
            
            <div className="image-container">
              {product.discount > 0 && (
                <span className="discount-badge">-{product.discount}%</span>
              )}
              <img src={product.imageUrl} alt={product.name} className="product-image" />
            </div>

            <div className="product-info">
              <h3 className="product-name">{product.name}</h3>
              {/* Removi a descrição do card para ele ficar menor e mais focado na compra */}
              
              <div className="price-section">
                {product.discount > 0 ? (
                  <>
                    <span className="old-price">R$ {Number(product.price).toFixed(2)}</span>
                    <span className="new-price">R$ {Number(product.discountedPrice).toFixed(2)}</span>
                  </>
                ) : (
                  <span className="new-price">R$ {Number(product.price).toFixed(2)}</span>
                )}
              </div>

              <div className="variants-preview">
                <span>Tamanhos: {Array.from(new Set(product.variants.map(v => v.size))).join(', ')}</span>
              </div>

              {/* Botão agora com a função de clique */}
              <button 
                className="btn-buy" 
                onClick={() => handleViewDetails(product.id)}
              >
                Ver Detalhes
              </button>
            </div>
          </div>
        ))}
        
        {/* Mensagem caso o filtro não encontre nada */}
        {filteredProducts.length === 0 && (
          <p className="no-products">Nenhuma peça encontrada com esses filtros.</p>
        )}
      </div>
    </div>
  );
}