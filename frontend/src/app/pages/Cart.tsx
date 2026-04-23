import { useNavigate } from 'react-router';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useBooks } from '../contexts/BooksContext';
import { useAuth } from '../contexts/AuthContext';

export function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, totalItems } = useCart();
  const { getBookById } = useBooks();
  const { user } = useAuth();

  const cartItems = items.map(item => ({
    ...item,
    book: getBookById(item.bookId)!
  })).filter(item => item.book);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.book.price * item.quantity),
    0
  );

  const deliveryCost = subtotal > 100 ? 0 : 15;
  const tax = subtotal * 0.23;
  const total = subtotal + deliveryCost;

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Koszyk jest pusty</h1>
          <p className="text-gray-600 mb-8">Dodaj książki do koszyka, aby kontynuować zakupy</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Przeglądaj książki
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Koszyk ({totalItems} {totalItems === 1 ? 'przedmiot' : 'przedmiotów'})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div key={item.bookId} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex gap-6">
                <div className="w-24 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-4xl text-blue-600 opacity-30">📚</span>
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{item.book.title}</h3>
                  <p className="text-gray-600 mb-2">{item.book.author}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Dostępne: {item.book.stock} szt.
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                        disabled={item.quantity >= item.book.stock}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {item.book.price.toFixed(2)} zł × {item.quantity}
                        </p>
                        <p className="font-bold text-xl text-blue-600">
                          {(item.book.price * item.quantity).toFixed(2)} zł
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.bookId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="font-bold text-xl mb-6">Podsumowanie zamówienia</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Wartość produktów:</span>
                <span>{subtotal.toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>VAT (23%):</span>
                <span>{tax.toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Dostawa:</span>
                <span>{deliveryCost === 0 ? 'Gratis' : `${deliveryCost.toFixed(2)} zł`}</span>
              </div>
              {subtotal < 100 && (
                <p className="text-sm text-gray-500">
                  Dodaj jeszcze {(100 - subtotal).toFixed(2)} zł aby otrzymać darmową dostawę
                </p>
              )}
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xl">Razem:</span>
                <span className="font-bold text-2xl text-blue-600">{total.toFixed(2)} zł</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Przejdź do kasy
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full mt-3 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Kontynuuj zakupy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
