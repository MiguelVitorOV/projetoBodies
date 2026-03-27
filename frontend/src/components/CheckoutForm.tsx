import { useState, useEffect, useRef } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { useNavigate } from 'react-router-dom';
import '../css/CheckOut.css';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY as string, { locale: 'pt-BR' });

interface CheckoutProps {
  userId: string;
  items: Array<{ variantId: string; quantity: number }>;
  totalAmount: number;
}

export function CheckoutForm({ userId, items, totalAmount }: CheckoutProps) {
  const navigate = useNavigate();
  const [mensagem, setMensagem] = useState('');
  const [pixData, setPixData] = useState<{
    qr_code_base64: string;
    qr_code: string;
    ticket_url: string;
  } | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { clearCart } = useCart();
  const { token } = useAuth();
  const initialization = { amount: totalAmount };
  const aprovado = useRef(false); // ← evita disparar clearCart mais de uma vez
  const API_URL = import.meta.env.VITE_API_URL;
  const customization = {
    paymentMethods: {
      creditCard: 'all' as 'all',
      bankTransfer: 'all' as 'all',
    },
  };

  useEffect(() => {
    if (!orderId || mensagem !== 'pix') return;

    const intervalo = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/orders/${orderId}`);
        const order = await res.json();

        if (order.status === 'PAGO' && !aprovado.current) {
          aprovado.current = true;       // ← trava para não executar duas vezes
          clearInterval(intervalo);
          setPixData(null);
          clearCart();
          setMensagem('cartao');         // ← NÃO limpa o carrinho aqui!
        }
      } catch (e) {
        console.error("Erro ao verificar status do pedido:", e);
      }
    }, 5000);

    return () => clearInterval(intervalo);
  }, [orderId, mensagem]);

  const onSubmit = async ({ formData }: any) => {
    try {
      setMensagem('Processando pagamento... Não feche a tela!');

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, items, paymentData: formData }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMensagem(`❌ ${data.error}`);
        return;
      }

      if (data.qr_code_base64) {
        aprovado.current = false; // ← reseta para nova tentativa
        setOrderId(data.order.id);
        setMensagem('pix');
        setPixData({
          qr_code_base64: data.qr_code_base64,
          qr_code: data.qr_code,
          ticket_url: data.ticket_url,
        });
      } else {
        clearCart();
        setMensagem('cartao'); // cartão aprovado direto
      }

    } catch (error) {
      setMensagem('❌ Erro de conexão com o servidor.');
    }
  };

  const onError = async (error: any) => console.error("Erro Brick:", error);
  const onReady = async () => console.log('Brick carregado!');

  // ← clearCart() só acontece aqui, quando usuário clica "Nova compra"
  const resetar = () => {
  setMensagem('');
  setPixData(null);
  setOrderId(null);
  aprovado.current = false  
  // Marca que veio da confirmação
  localStorage.setItem('fromCheckout', 'true');

  localStorage.setItem('fromCheckout', 'true'); 
  clearCart();
  navigate('/catalogo');

};

  if (mensagem === 'cartao') {
    return (
      <div className="checkout-mensagem sucesso">
        <p>🎉 Pagamento Aprovado! Pedido gerado com sucesso!</p>
        <button onClick={resetar}>Voltar ao Catálogo</button>
      </div>
    );
  }

  if (mensagem === 'pix' && pixData) {
    return (
      <div className="checkout-mensagem sucesso">
        <p>⚡ Pix gerado! Escaneie o QR Code abaixo:</p>

        <img
          src={`data:image/jpeg;base64,${pixData.qr_code_base64}`}
          alt="QR Code Pix"
          style={{ width: 200, height: 200, margin: '16px auto', display: 'block' }}
        />

        <div className="pix-copia">
          <label>Pix Copia e Cola:</label>
          <div className="pix-copia-input">
            <input readOnly value={pixData.qr_code} />
            <button onClick={() => navigator.clipboard.writeText(pixData.qr_code)}>
              Copiar
            </button>
          </div>
        </div>

        {pixData.ticket_url && (
          <a href={pixData.ticket_url} target="_blank" rel="noreferrer" className="pix-link">
            Abrir página do Pix
          </a>
        )}

        <p style={{ fontSize: '0.8rem', color: '#999', marginTop: 12 }}>
          O pedido será confirmado automaticamente após o pagamento.
        </p>

        <button onClick={resetar} style={{ marginTop: 8 }}>Nova compra</button>
      </div>
    );
  }

  if (mensagem.includes('❌')) {
    return (
      <div className="checkout-mensagem erro">
        <p>{mensagem}</p>
        <button onClick={resetar}>Tentar novamente</button>
      </div>
    );
  }

  if (mensagem) {
    return (
      <div className="checkout-mensagem">
        <p>{mensagem}</p>
      </div>
    );
  }

  return (
    <div className="checkout-form">
      <Payment
        initialization={initialization}
        customization={customization}
        onSubmit={onSubmit}
        onReady={onReady}
        onError={onError}
      />
    </div>
  );
}