import { createContext, useContext, useReducer, ReactNode } from 'react';
import { CartItem } from '../types';
import { useBooks } from './BooksContext'; 
import { apiClient } from '../../api';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; bookId: number; maxStock: number }
  | { type: 'REMOVE_ITEM'; bookId: number }
  | { type: 'UPDATE_QUANTITY'; bookId: number; quantity: number; maxStock: number }
  | { type: 'CLEAR_CART' };

interface CartContextType {
  items: CartItem[];
  addItem: (bookId: number) => void;
  removeItem: (bookId: number) => void;
  updateQuantity: (bookId: number, quantity: number) => void;
  clearCart: () => void;
  checkout: () => Promise<void>;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.bookId === action.bookId);
      const currentQty = existingItem ? existingItem.quantity : 0;

      // LOGIKA BIZNESOWA: Sprawdzenie stanu z PostgreSQL
      if (currentQty + 1 > action.maxStock) {
        alert(`Błąd: Brak wystarczającej liczby sztuk w magazynie (Dostępne: ${action.maxStock})`);
        return state;
      }

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.bookId === action.bookId ? { ...item, quantity: item.quantity + 1 } : item
          )
        };
      }
      return { ...state, items: [...state.items, { bookId: action.bookId, quantity: 1 }] };
    }

    case 'UPDATE_QUANTITY': {
      if (action.quantity > action.maxStock) {
        alert(`Limit magazynowy to ${action.maxStock} sztuk.`);
        return state;
      }
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter(item => item.bookId !== action.bookId) };
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.bookId === action.bookId ? { ...item, quantity: action.quantity } : item
        )
      };
    }

    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => item.bookId !== action.bookId) };
    case 'CLEAR_CART':
      return { items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const { books } = useBooks();

  const addItem = (bookId: number) => {
    const book = books.find(b => b.id === bookId);
    dispatch({ type: 'ADD_ITEM', bookId, maxStock: book?.stock || 0 });
  };

  const updateQuantity = (bookId: number, quantity: number) => {
    const book = books.find(b => b.id === bookId);
    dispatch({ type: 'UPDATE_QUANTITY', bookId, quantity, maxStock: book?.stock || 0 });
  };

  const checkout = async () => {
    if (state.items.length === 0) return alert("Koszyk jest pusty!");
    
    try {
      const orderPayload = {
        produkty: state.items.map(item => ({
          id_ksiazki: item.bookId,
          ilosc: item.quantity
        })),
        data_zamowienia: new Date().toISOString()
      };
      await apiClient.post('/zamowienia/', orderPayload);
      dispatch({ type: 'CLEAR_CART' });
    } catch (error) {
      console.error("Błąd podczas składania zamówienia:", error);
      alert("Wystąpił problem z połączeniem. Sprawdź czy FastAPI działa.");
    }
  };

  const removeItem = (bookId: number) => dispatch({ type: 'REMOVE_ITEM', bookId });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items: state.items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      checkout,
      totalItems
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within a CartProvider');
  return context;
}