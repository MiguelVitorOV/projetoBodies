import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import '../css/AdminPanel.css';
import { useAuth } from '../context/AuthContext';

export function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const { user, isAuthenticated, token } = useAuth(); 

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      alert("Acesso restrito a administradores.");
      navigate('/'); 
      return; 
    }

    fetchProducts();
  }, [isAuthenticated, user, navigate]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmacao = window.confirm("Tem certeza que deseja excluir este produto definitivamente?");
    
    if (confirmacao) {
      try {
        const res = await fetch(`${API_URL}/products/${id}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}` 
          }
        });
        
        if (res.ok) {
          setProducts(products.filter(p => p.id !== id));
          alert("Produto removido com sucesso!");
        } else {
          const errorData = await res.json();
          alert(`Erro: ${errorData.message || errorData.error}`);
        }
      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Painel de Administração</h1>
          <p className="admin-subtitle">Gerencie o catálogo da Bereshit</p>
        </div>
        <button className="btn-add-new" onClick={() => navigate('/cadastroProduct')}>
          + Novo Produto
        </button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Imagem</th>
              <th>Nome da Peça</th>
              <th>Preço</th>
              <th>Estoque Total</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => {
              const totalStock = product.variants?.reduce((acc, v) => acc + v.stockQuantity, 0) || 0;
              
              return (
                <tr key={product.id}>
                  <td>
                    <img src={product.imageUrl} alt={product.name} className="admin-prod-img" />
                  </td>
                  <td className="admin-prod-name">{product.name}</td>
                  <td>R$ {Number(product.price).toFixed(2)}</td>
                  <td>
                    <span className={`admin-stock-badge ${totalStock < 5 ? 'low' : 'ok'}`}>
                      {totalStock} un
                    </span>
                  </td>
                  <td className="admin-actions-cell" style={{ textAlign: 'center' }}>
                  <div className="admin-actions">

                    <button   className="btn-edit-admin"onClick={() => navigate(`/cadastroProduct/${product.id}`)}>Editar</button>
                    <button 
                      className="btn-delete-admin" 
                      onClick={() => handleDelete(product.id as string)}
                    >
                      Excluir
                    </button>
                  </div>
                  </td>
                  
                </tr>
              )
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <p className="admin-empty">Nenhum produto cadastrado no momento.</p>
        )}
      </div>
    </div>
  );
}