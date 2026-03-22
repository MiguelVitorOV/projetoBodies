import { useState } from 'react';
// 1. Importamos as ferramentas do SDK React
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import "../css/CheckOut.css"

// 2. Inicializamos com a sua CHAVE PÚBLICA (Substitua pela sua chave real de testes do MP)
initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY as string, { locale: 'pt-BR' });

// Recebemos por props o que o cliente está comprando
interface CheckoutProps {
  userId: string;
  items: Array<{ variantId: string; quantity: number }>;
  totalAmount: number; // O valor total que vai aparecer na tela pro cliente
}

export function CheckoutForm({ userId, items, totalAmount }: CheckoutProps) {
  const [mensagem, setMensagem] = useState('');

  // Configuração inicial da caixinha
  const initialization = {
    amount: totalAmount, 
  };

  const customization = {
    paymentMethods: {
      creditCard: 'all' as 'all',
      pix: 'all' as 'all',
    },
  };

  // 3. A MÁGICA: O que acontece quando o cliente clica em "Pagar" na caixinha
  const onSubmit = async ({ formData }: any) => {
    // O 'formData' já vem com o Token do cartão, as parcelas e o CPF gerados pelo Mercado Pago!
    
    try {
      setMensagem('Processando pagamento... Não feche a tela!');
      
      // Mandamos TUDO pro SEU Backend (Ajuste a rota se a sua for diferente)
      const response = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          items: items,
          paymentData: formData // Mandando o token seguro pro backend cobrar!
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensagem('🎉 Pagamento Aprovado! Pedido gerado com sucesso na Bereshit!');
      } else {
        setMensagem(`❌ Erro no pagamento: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      setMensagem('❌ Erro de conexão com o servidor da loja.');
    }
  };

  const onError = async (error: any) => {
    console.error("Erro no Brick do Mercado Pago:", error);
  };

  const onReady = async () => {
    console.log('Caixinha de pagamento carregada e pronta!');
  };

  return (
    <div>
      <h2>Finalizar Compra</h2>
      
      {/* Se tiver uma mensagem (sucesso ou erro), mostra ela. Se não, mostra o formulário do MP */}
      {mensagem ? (
        <div>
          <h3>{mensagem}</h3>
        </div>
      ) : (
        <Payment
          initialization={initialization}
          customization={customization}
          onSubmit={onSubmit}
          onReady={onReady}
          onError={onError}
        />
      )}
    </div>
  );
}