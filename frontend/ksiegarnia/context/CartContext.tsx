import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<any[]>([]);

 const addToCart = (book: any) => {
  setItems(prev => {
    const existing = prev.find(i => i.id === book.id);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty + 1 > book.ilosc_sztuk) {
      alert(`Przepraszamy, dostępnych jest tylko ${book.ilosc_sztuk} sztuk.`);
      return prev;
    }

    if (existing) {
      return prev.map(i => i.id === book.id ? { ...i, quantity: i.quantity + 1 } : i);
    }
    return [...prev, { ...book, quantity: 1 }];
  });
};

const updateQuantity = (bookId: number, delta: number) => {
  setItems(prev => prev.map(item => {
    if (item.id === bookId) {
      const newQty = item.quantity + delta;

      if (delta > 0 && newQty > item.ilosc_sztuk) {
        alert(`Osiągnięto limit dostępnych sztuk (${item.ilosc_sztuk}).`);
        return item;
      }

      return { ...item, quantity: newQty > 0 ? newQty : 1 };
    }
    return item;
  }));
}; 

  const removeFromCart = (bookId: number) => {
  setItems(prev => prev.filter(item => item.id !== bookId));
  };

  
  const total = items.reduce((sum, item) => sum + item.cena_jednostkowa * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);