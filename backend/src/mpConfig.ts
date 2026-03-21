import { MercadoPagoConfig, Order, PaymentMethod } from 'mercadopago';

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACESS_TOKEN,
  options: {timeout: 5000}
});

export const paymentMethodApi = new PaymentMethod(mpClient);

export const ordersApi = new Order(mpClient);
