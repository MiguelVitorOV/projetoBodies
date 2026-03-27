import { useEffect, useMemo, useState} from 'react';
import {useNavigate,} from 'react-router-dom';
import { useCart, type CartItem } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import '../css/CheckOutPage.css';
import { CheckoutForm } from './CheckoutForm';''

export function Checkout() {
  const { cart, cartTotal } = useCart();
  const [listaCarrinho, setListaCarrinho] = useState<CartItem[]>([]);
  const [totalSnapshot, setTotalSnapshot] = useState(0)
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const LIMITE_VIP = 10000;
  const WHATSAPP_LOJA = '553299667442'; // ← número da loja com DDI+DDD

  useEffect(() => {
    




    if (!isAuthenticated || !user) {
      alert("Você precisa fazer login para finalizar a compra!");
      navigate('/login', { state: { from: '/checkout' } });
    }

    if (localStorage.getItem('fromCheckout') === 'true') {
    localStorage.removeItem('fromCheckout');
    return;  // Skip silencioso ✅
  }
  
   
  }, [isAuthenticated, user, cart, navigate]);


  useEffect(() => {
    setListaCarrinho(cart)
    setTotalSnapshot(cartTotal);
  }, [])


  const formattedCheckoutItems = useMemo(() => {
    return cart.map(item => ({
      variantId: item.id, 
      quantity: item.quantity
    }));
  }, [cart]);

  const firstName = user?.name?.split(' ')[0] || 'Cliente';

  const mensagemWhats = encodeURIComponent(
  `Olá! Tenho um pedido de R$ ${cartTotal.toFixed(2)} e gostaria de combinar o pagamento.\n\n` +
  cart.map(item => `• ${item.name} x${item.quantity} — R$ ${(item.price * item.quantity).toFixed(2)}`).join('\n') +
  `\n\n*Total: R$ ${cartTotal.toFixed(2)}*`
);

const linkWhatsapp = `https://wa.me/${WHATSAPP_LOJA}?text=${mensagemWhats}`;


  if (!isAuthenticated || !user) return null;

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Finalizar Compra</h1>
        <p>Ambiente 100% Seguro. Finalize seu pedido, {firstName}!</p>
      </div>

      <div className="checkout-container">

        <div className="checkout-summary">
          <h2>Resumo do seu pedido</h2>
          <div className="checkout-items-list">
            {listaCarrinho.map((item) => (
              <div key={item.id} className="checkout-item">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/70?text=Sem+Foto';
                  }}
                />
                <div className="checkout-item-info">
                  <span className="chk-name">{item.name}</span>
                  <span className="chk-qty">Quantidade: {item.quantity}</span>
                </div>
                <div className="checkout-item-price">
                  R$ {(Number(item.price) * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-total-box">
            <span>Total a pagar:</span>
            <span className="chk-total-value">R$ {totalSnapshot.toFixed(2)}</span>
          </div>
        </div>
        <div className="checkout-payment-box">
  <h2>Pagamento</h2>

  {cartTotal >= LIMITE_VIP ? (
    // ← Acima de 10k: redireciona pro WhatsApp
    <div className="checkout-vip-box">
      <p>👑 Seu pedido é especial!</p>
      <p>Para compras acima de R$ 10.000, nosso time irá te atender pessoalmente para combinar a melhor forma de pagamento.</p>
      <a
        href={linkWhatsapp}
        target="_blank"
        rel="noreferrer"
        className="checkout-whatsapp-btn"
      >
        💬 Falar com a loja pelo WhatsApp
      </a>
    </div>
  ) : (
    // ← Abaixo de 10k: fluxo normal do MP
    <>
      <p className="payment-subtitle">Escolha como deseja pagar através do Mercado Pago.</p>
      <div className="mp-container">
        <CheckoutForm
          userId={user.id}
          items={formattedCheckoutItems}
          totalAmount={cartTotal}
        />
      </div>
    </>
  )}
</div>

      </div>
    </div>
  );
}
