import { useState, useEffect } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { useNavigate } from 'react-router-dom';
import '../css/CheckOut.css';

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

  const initialization = { amount: totalAmount };

  const customization = {
    paymentMethods: {
      creditCard: 'all' as 'all',
      bankTransfer: 'all' as 'all',
    },
  };

  // ⚡ Polling — verifica se o Pix foi pago a cada 5 segundos
  useEffect(() => {
    if (!orderId || mensagem !== 'pix') return;

    const intervalo = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3000/orders/${orderId}`);
        const order = await res.json();

        if (order.status === 'PAGO') {
          clearInterval(intervalo);
          setPixData(null);
          setMensagem('cartao'); // reutiliza tela de sucesso
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

      const response = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, items, paymentData: formData }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMensagem(`❌ ${data.error}`);
        return;
      }

      if (data.qr_code_base64) {
        setOrderId(data.order.id); // ← salva o id para o polling
        setMensagem('pix');
        setPixData({
          qr_code_base64: data.qr_code_base64,
          qr_code: data.qr_code,
          ticket_url: data.ticket_url,
        });
      } else {
        setMensagem('cartao');
      }

    } catch (error) {
      setMensagem('❌ Erro de conexão com o servidor.');
    }
  };

  const onError = async (error: any) => console.error("Erro Brick:", error);
  const onReady = async () => console.log('Brick carregado!');

  const resetar = () => {
    setMensagem('');
    setPixData(null);
    setOrderId(null);
    navigate('/catalogo');
  };

  // ✅ Tela de sucesso
  if (mensagem === 'cartao') {
    return (
      <div className="checkout-mensagem sucesso">
        <p>🎉 Pagamento Aprovado! Pedido gerado com sucesso!</p>
        <button onClick={resetar}>Nova compra</button>
      </div>
    );
  }

  // ⚡ Tela de QR Code Pix
  if (mensagem === 'pix' && pixData) {
    return (
      <div className="checkout-mensagem sucesso">
        <p>⚡ Pix gerado! Escaneie o QR Code abaixo:</p>

        <img
          src={`data:image/png;base64,${pixData.qr_code_base64}`}
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

  // ❌ Tela de erro
  if (mensagem.includes('❌')) {
    return (
      <div className="checkout-mensagem erro">
        <p>{mensagem}</p>
        <button onClick={resetar}>Tentar novamente</button>
      </div>
    );
  }

  // ⏳ Processando
  if (mensagem) {
    return (
      <div className="checkout-mensagem">
        <p>{mensagem}</p>
      </div>
    );
  }

  // 🏠 Tela padrão — Brick do MP
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