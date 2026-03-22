import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // Puxamos a nuvem de autenticação!
import { useNavigate } from 'react-router-dom';
import { CheckoutForm } from './CheckoutForm'; // Ajuste o caminho do seu CheckoutForm
import '../css/CartDrawer.css';

export const CartDrawer = () => {
  const { cart, isOpen, closeCart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const { user, isAuthenticated } = useAuth(); // Pegamos o usuário logado
  const navigate = useNavigate();

  // NOVO: Controla se a gaveta tá mostrando os itens ou a tela do Mercado Pago
  const [isCheckingOut, setIsCheckingOut] = useState(false); 

  // Quando fechar o carrinho, reseta a tela
  const handleClose = () => {
    setIsCheckingOut(false);
    closeCart();
  };

  // Lógica do botão de Finalizar Compra
  const handleFinalizarCompra = () => {
    if (!isAuthenticated || !user) {
      alert("Você precisa fazer login para finalizar a compra!");
      handleClose();
      navigate('/login'); // Manda o cliente pro login
      return;
    }
    // Se tá logado, muda a visão do carrinho pra tela de pagamento
    setIsCheckingOut(true); 
  };

  // Converte os itens do carrinho pro formato que a sua API/CheckoutForm pede
  const checkoutItems = cart.map(item => ({
    variantId: item.id,
    quantity: item.quantity
  }));

  return (
    <>
      {isOpen && <div className="cart-overlay" onClick={handleClose}></div>}

      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          {/* O título muda dependendo de onde o cliente está */}
          <h2>{isCheckingOut ? 'Pagamento Seguro' : 'Seu Carrinho'}</h2>
          <span className="material-symbols-outlined close-btn" onClick={handleClose}>
            close
          </span>
        </div>

        <div className="cart-items">
          {isCheckingOut ? (
            // ==========================================
            // TELA DO MERCADO PAGO (Seu Componente)
            // ==========================================
            <div style={{ padding: '10px 0' }}>
              <button 
                onClick={() => setIsCheckingOut(false)} 
                style={{ marginBottom: '15px', color: '#4193ae', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ← Voltar aos itens
              </button>
              
              <CheckoutForm 
                userId={user!.id} // Mandamos o ID real do usuário!
                items={checkoutItems} // A lista de produtos
                totalAmount={cartTotal} // O valor total
              />
            </div>
          ) : (
            // ==========================================
            // TELA NORMAL DO CARRINHO (Lista de Itens)
            // ==========================================
            cart.length === 0 ? (
              <p className="empty-cart">Seu carrinho está vazio.</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <h4 style={{ fontSize: '14px' }}>{item.name}</h4>
                    <p>R$ {item.price.toFixed(2)}</p>
                  </div>
                  
                  <div className="item-actions">
                    <div className="quantity-control">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <span 
                      className="material-symbols-outlined remove-btn"
                      onClick={() => removeFromCart(item.id)}
                      title="Remover"
                    >
                      delete
                    </span>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* O rodapé só aparece se não estiver na tela de checkout e tiver itens */}
        {!isCheckingOut && cart.length > 0 && (
          <div className="cart-footer">
            <div className="total">
              <span>Total:</span>
              <span>R$ {cartTotal.toFixed(2)}</span>
            </div>
            <button className="checkout-btn" onClick={handleFinalizarCompra}>
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </>
  );
};