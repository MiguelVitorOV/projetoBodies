import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  maxStock: number; // NOVO: O carrinho agora sabe qual o limite!
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // CORREÇÃO DO SUMIÇO: O estado já inicia lendo o localStorage, assim ele não sobreescreve com vazio
  const [cart, setCart] = useState<CartItem[]>(() => {
    const storedCart = localStorage.getItem('@Bereshit:cart');
    return storedCart ? JSON.parse(storedCart) : [];
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('@Bereshit:cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (newItem: CartItem) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === newItem.id);
      if (existing) {
        // Calcula a nova quantidade, mas trava no máximo permitido pelo estoque
        const novaQuantidade = existing.quantity + newItem.quantity;
        const quantidadeFinal = novaQuantidade > existing.maxStock ? existing.maxStock : novaQuantidade;
        
        return prev.map(item => item.id === newItem.id ? { ...item, quantity: quantidadeFinal } : item);
      }
      return [...prev, newItem];
    });
    setIsOpen(true);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(id); return; }
    
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        // Trava no estoque se o cliente digitar um número maior
        const qtdValidada = quantity > item.maxStock ? item.maxStock : quantity;
        return { ...item, quantity: qtdValidada };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount,
      isOpen, openCart, closeCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart deve ser usado dentro de um CartProvider');
  return context;
};