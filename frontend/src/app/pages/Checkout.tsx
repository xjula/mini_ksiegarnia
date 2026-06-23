import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CreditCard, Truck, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useBooks } from '../contexts/BooksContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {useForm} from "react-hook-form";
import { apiClient } from '../../api';

type AddressForm = {
  street: string;
  city: string;
  postalCode: string;
  country: string;
};

export function Checkout() {
  const navigate = useNavigate();
  const { getBookById } = useBooks();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { fetchBooks } = useBooks();
  const [step, setStep] = useState<'address' | 'payment' | 'success' | 'error'>('address');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('online');
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const { items, clearCart, checkout } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<AddressForm>({
    defaultValues: {
      street: '',
      postalCode: '',
      city: '',
      country: 'Polska'
    }
  });

useEffect(() => {
  const loadLastAddress = async () => {
    if (!user?.id) return;

    try {
      const response = await apiClient.get(
        `/uzytkownicy/${user.id}/adresy`
      );

      const addresses = response.data;

      if (addresses.length > 0) {
        const lastAddress = addresses[addresses.length - 1];

        reset({
          street: lastAddress.ulica_i_numer,
          postalCode: lastAddress.kod_pocztowy,
          city: lastAddress.miasto,
          country: lastAddress.kraj
        });
      }
    } catch (err) {
      console.error('Nie udało się pobrać adresu:', err);
    }
  };

  loadLastAddress();
}, [user, reset]);

const goToPayment = async (data: AddressForm) => {
  try {
    if (!user?.id) {
      alert('Brak zalogowanego użytkownika');
      return;
    }

    await apiClient.post('/adresy/', {
      uzytkownik_id: user.id,
      ulica_i_numer: data.street,
      kod_pocztowy: data.postalCode,
      miasto: data.city,
      kraj: data.country
    });

    setStep('payment');
  } catch (err) {
    console.error(err);
    alert('Nie udało się zapisać adresu');
  }
};

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
    setIsProcessing(true);

    try {
      const odpowiedzZamowienia = await checkout(deliveryCost);
      const zamowienieId = odpowiedzZamowienia?.zamowienie_id;

      if (paymentMethod === 'online' && zamowienieId) {
        const platnoscResponse = await fetch(
          `http://127.0.0.1:8000/zamowienia/${zamowienieId}/zaplac`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              metoda_platnosci: 'pm_card_visa'
            })
          }
        );

        if (!platnoscResponse.ok) {
          throw new Error('Płatność została odrzucona przez bank.');
        }
      }

      if (paymentMethod === 'offline' && zamowienieId) {
        await fetch(
          `http://127.0.0.1:8000/zamowienia/${zamowienieId}/offline`,
          {
            method: 'POST'
          }
        );
      }

      await fetchBooks();
      setStep('success');

    } catch (error) {
      console.error('Błąd podczas składania zamówienia:', error);
      setErrorMessage('Wystąpił błąd przy płatności. Spróbuj ponownie.');
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };
    

  if (items.length === 0 && step === 'address') {
    navigate('/cart');
    return null;
  }

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-12 text-center border-t-4 border-green-500">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t('checkout.successTitle')}
          </h1>
          <p className="text-gray-600 dark:text-slate-300 mb-8 text-lg">
            {t('checkout.successDescription')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all shadow-md"
          >
            {t('checkout.backHome')}
          </button>
        </div>
      </div>
    );
  }
  if (isProcessing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('checkout.processing')}</h2>
        <p className="text-gray-600 dark:text-slate-300">{t('checkout.processingDescription')}</p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-12 text-center border-t-4 border-red-500">
          <XCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t('checkout.paymentFailed')}
          </h1>
          <p className="text-gray-600 dark:text-slate-300 mb-8 text-lg">
            {errorMessage}
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setStep('payment')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all"
            >
              {t('checkout.tryAgain')}
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-all"
            >
              {t('checkout.backToCart')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(goToPayment)} className="space-y-4">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t('checkout.title2')}</h1>

      <div className="flex items-center justify-center mb-12">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            step === 'address' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
          }`}>
            1
          </div>
          <div className={`w-24 h-1 ${step === 'payment' ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            step === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600 dark:text-slate-300'
          }`}>
            2
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === 'address' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-6 h-6 text-blue-600" />
                <h2 className="font-bold text-xl">{t('checkout.deliveryAddress')}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('checkout.street')}
                  </label>
                  <input
                    type="text"
                    {...register('street', {
                      required: 'Ulica i numer są wymagane',
                      pattern: {
                        value: /^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż\s.-]+\s\d+[A-Za-z]?$/,
                        message: 'Format: Kwiatowa 12 lub Kwiatowa 12A'
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ul. Przykładowa 123"
                  />
                  {errors.street && (
                    <p className="text-red-500 text-sm mt-1">{errors.street.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout.postalCode')}
                    </label>
                    <input
                      type="text"
                      {...register('postalCode', {
                        required: 'Kod pocztowy jest wymagany',
                        pattern: {
                          value: /^\d{2}-\d{3}$/,
                          message: 'Kod pocztowy musi mieć format 00-000'
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="00-000"
                    />
                    {errors.postalCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.postalCode.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout.city')}
                    </label>
                    <input
                      type="text"
                      {...register('city', {
                        required: 'Miasto jest wymagane',
                        minLength: {
                          value: 3,
                          message: 'Miasto musi mieć minimum 3 znaki'
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Warszawa"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('checkout.country')}
                  </label>
                  <input
                    type="text"
                    {...register('country', {
                      required: 'Kraj jest wymagany',
                      minLength: {
                        value: 3,
                        message: 'Kraj musi mieć minimum 3 znaki'
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.country && (
                    <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <Truck className="w-6 h-6 text-blue-600" />
                  <h3 className="font-bold text-lg">{t('checkout.deliveryMethod')}</h3>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'standard', name: t('checkout.standardDelivery'), cost: 15 },
                    { id: 'express', name: t('checkout.expressDelivery'), cost: 25 },
                    { id: 'courier', name: t('checkout.courierDelivery'), cost: 35 }
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer ${
                        deliveryMethod === method.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-500'
: 'border-gray-200 dark:border-slate-600 dark:bg-slate-800'
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
                        <span className="font-medium text-gray-900 dark:text-white">{method.name}</span>
                      </div>
                      <span className="text-gray-600 dark:text-slate-300">
                        {subtotal > 100 ? t('checkout.free') : `${method.cost.toFixed(2)} zł`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {t('checkout.goToPayment')}
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-blue-600" />
                <h2 className="font-bold text-xl">{t('checkout.paymentMethod')}</h2>
              </div>

              <div className="space-y-4 mb-8">
                <label
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                    paymentMethod === 'online' ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-500'
: 'border-gray-200 dark:border-slate-600 dark:bg-slate-800'
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
                    <p className="font-medium text-gray-900 dark:text-white">{t('checkout.onlinePayment')}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-300">{t('checkout.onlinePaymentDescription')}</p>
                  </div>
                </label>

                <label
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                    paymentMethod === 'offline' ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-500'
: 'border-gray-200 dark:border-slate-600 dark:bg-slate-800'
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
                    <p className="font-medium text-gray-900 dark:text-white">{t('checkout.cashOnDelivery')}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-300">{t('checkout.cashOnDeliveryDescription')}</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  {t('checkout.backToCart')}
                </button>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {t('checkout.placeOrder')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="font-bold text-xl mb-6">{t('checkout.summary')}</h2>

            <div className="space-y-3 mb-6">
              {cartItems.map((item) => (
                <div key={item.bookId} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-slate-300">
                    {item.book.title} × {item.quantity}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(item.book.price * item.quantity).toFixed(2)} zł
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3 mb-6">
              <div className="flex justify-between text-gray-600 dark:text-slate-300">
                <span>{t('checkout.productsValue')}</span>
                <span>{subtotal.toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-300">
                <span>{t('checkout.vat')} (23%):</span>
                <span>{tax.toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-300">
                <span>{t('checkout.delivery')}:</span>
                <span>{deliveryCost === 0 ? t('checkout.free') : `${deliveryCost.toFixed(2)} zł`}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-xl">{t('checkout.total')}:</span>
                <span className="font-bold text-2xl text-blue-600">{total.toFixed(2)} zł</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}