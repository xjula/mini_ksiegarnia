import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CreditCard, Truck, MapPin, CheckCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useBooks } from '../contexts/BooksContext';
import { useAuth } from '../contexts/AuthContext';

export function Checkout() {
  const navigate = useNavigate();
  const { getBookById } = useBooks();
  const { user } = useAuth();
  const { fetchBooks } = useBooks();
  const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('online');
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const { items, clearCart, checkout } = useCart();
  const [address, setAddress] = useState({
    street: '',
    city: '',
    postalCode: '',
    country: 'Polska'
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  const cartItems = items.map(item => ({
    ...item,
    book: getBookById(item.bookId)!
  })).filter(item => item.book);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.book.price * item.quantity),
    0
  );

  const deliveryCosts: Record<string, number> = {
    standard: 15,
    express: 25,
    courier: 35
  };

  const deliveryCost = subtotal > 100 ? 0 : deliveryCosts[deliveryMethod];
  const tax = subtotal * 0.23;
  const total = subtotal + deliveryCost;

  const handlePlaceOrder = async () => {
  try {
      await checkout(); 
      await fetchBooks(); 
      
      setStep('success');
    } catch (error) {
      console.error("Błąd odświeżania danych");
    }
  };

  if (items.length === 0 && step !== 'success') {
    navigate('/cart');
    return null;
  }

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Zamówienie złożone pomyślnie!
          </h1>
          <p className="text-gray-600 mb-8">
            Dziękujemy za zakupy. Potwierdzenie zostało wysłane na adres {user.email}
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <p className="text-green-800 font-medium">
              Status płatności:{' '}
              {paymentMethod === 'online' ? 'Opłacone' : 'Oczekuje na potwierdzenie'}
            </p>
            <p className="text-green-700 text-sm mt-2">
              Kwota: {total.toFixed(2)} zł
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Przekierowanie do strony głównej...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizacja zamówienia</h1>

      <div className="flex items-center justify-center mb-12">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            step === 'address' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
          }`}>
            1
          </div>
          <div className={`w-24 h-1 ${step === 'payment' ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            step === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            2
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === 'address' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-6 h-6 text-blue-600" />
                <h2 className="font-bold text-xl">Adres dostawy</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ulica i numer
                  </label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ul. Przykładowa 123"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kod pocztowy
                    </label>
                    <input
                      type="text"
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="00-000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Miasto
                    </label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Warszawa"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kraj
                  </label>
                  <input
                    type="text"
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <Truck className="w-6 h-6 text-blue-600" />
                  <h3 className="font-bold text-lg">Metoda dostawy</h3>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'standard', name: 'Dostawa standardowa (3-5 dni)', cost: 15 },
                    { id: 'express', name: 'Dostawa ekspresowa (1-2 dni)', cost: 25 },
                    { id: 'courier', name: 'Kurier (następny dzień)', cost: 35 }
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer ${
                        deliveryMethod === method.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="delivery"
                          value={method.id}
                          checked={deliveryMethod === method.id}
                          onChange={(e) => setDeliveryMethod(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="font-medium">{method.name}</span>
                      </div>
                      <span className="text-gray-600">
                        {subtotal > 100 ? 'Gratis' : `${method.cost.toFixed(2)} zł`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep('payment')}
                disabled={!address.street || !address.city || !address.postalCode}
                className="w-full mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Przejdź do płatności
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-blue-600" />
                <h2 className="font-bold text-xl">Metoda płatności</h2>
              </div>

              <div className="space-y-4 mb-8">
                <label
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                    paymentMethod === 'online' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <p className="font-medium">Płatność online</p>
                    <p className="text-sm text-gray-600">Szybka płatność przez system płatności</p>
                  </div>
                </label>

                <label
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                    paymentMethod === 'offline' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="offline"
                    checked={paymentMethod === 'offline'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <p className="font-medium">Płatność przy odbiorze</p>
                    <p className="text-sm text-gray-600">Zapłać gotówką lub kartą kurierowi</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('address')}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Wstecz
                </button>
                <button
                  onClick={handlePlaceOrder}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Złóż zamówienie
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="font-bold text-xl mb-6">Podsumowanie</h2>

            <div className="space-y-3 mb-6">
              {cartItems.map((item) => (
                <div key={item.bookId} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.book.title} × {item.quantity}
                  </span>
                  <span className="font-medium">
                    {(item.book.price * item.quantity).toFixed(2)} zł
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3 mb-6">
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
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-xl">Razem:</span>
                <span className="font-bold text-2xl text-blue-600">{total.toFixed(2)} zł</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
