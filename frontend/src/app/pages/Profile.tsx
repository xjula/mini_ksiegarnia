import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { User, Mail, Shield, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api';
export function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    apiClient
      .get(`/uzytkownicy/${user.id}/zamowienia`)
      .then((res) => setOrders(res.data))
      .catch((err) => console.error('Błąd pobierania zamówień:', err));
  }, [user]);

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t('profile.title')}</h1>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 mb-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{user.name}</h2>
            <p className="text-gray-600 dark:text-slate-300">{user.email}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
              user.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {user.role === 'admin' ? t('profile.admin') : t('profile.user')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <h3 className="font-medium text-gray-900 dark:text-white">{t('profile.email')}</h3>
            </div>
            <p className="text-gray-600 dark:text-slate-300">{user.email}</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <h3 className="font-medium text-gray-900 dark:text-white">{t('profile.role')}</h3>
            </div>
            <p className="text-gray-600 dark:text-slate-300">
              {user.role === 'admin' ? t('profile.systemAdmin') : t('profile.standardUser')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
        <h2 className="font-bold text-xl mb-6">{t('profile.accountInfo')}</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-gray-700 dark:text-white">{t('profile.userId')}</span>
            <span className="font-medium text-gray-900 dark:text-white">{user.id}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-gray-700 dark:text-white">{t('profile.accountStatus')}</span>
            <span className="text-green-600 font-medium">{t('profile.active')}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-700 dark:text-white">{t('profile.authMethod')}</span>
            <span className="font-medium text-gray-900 dark:text-white">OAuth2 / Email</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 mt-6">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-blue-600" />
          <h2 className="font-bold text-xl text-gray-900 dark:text-white">
            Moje zamówienia
          </h2>
        </div>

        {orders.length === 0 ? (
          <p className="text-gray-600 dark:text-slate-300">
            Nie masz jeszcze żadnych zamówień.
          </p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border dark:border-slate-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-900 dark:text-white">
                    Zamówienie #{order.id}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                    {order.status}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-slate-300">
                  Kwota: {Number(order.cena_calkowita || 0).toFixed(2)} zł
                </p>

                <p className="text-gray-600 dark:text-slate-300">
                  Dostawa: {Number(order.koszt_dostawy || 0).toFixed(2)} zł
                </p>

                <p className="text-gray-500 dark:text-slate-400 text-sm">
                  Data: {order.data_zamowienia
                    ? new Date(order.data_zamowienia).toLocaleString('pl-PL')
                    : 'brak daty'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {user.role === 'admin' && (
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-6 dark:bg-slate-800">
          <h3 className="font-bold text-lg text-purple-900 mb-2">{t('profile.adminPermissions')}</h3>
          <p className="text-purple-700 mb-4">
            {t('profile.adminDescription')}
          </p>
          <button
            onClick={() => navigate('/admin')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            {t('profile.goToAdmin')}
          </button>
        </div>
      )}
    </div>
  );
}
