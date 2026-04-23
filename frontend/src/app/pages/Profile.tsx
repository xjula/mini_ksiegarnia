import { useNavigate } from 'react-router';
import { User, Mail, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mój Profil</h1>

      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
              user.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {user.role === 'admin' ? 'Administrator' : 'Użytkownik'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <h3 className="font-medium text-gray-900">Email</h3>
            </div>
            <p className="text-gray-600">{user.email}</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <h3 className="font-medium text-gray-900">Rola</h3>
            </div>
            <p className="text-gray-600">
              {user.role === 'admin' ? 'Administrator systemu' : 'Standardowy użytkownik'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="font-bold text-xl mb-6">Informacje o koncie</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-gray-700">ID użytkownika</span>
            <span className="font-medium text-gray-900">{user.id}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-gray-700">Status konta</span>
            <span className="text-green-600 font-medium">Aktywne</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-700">Metoda uwierzytelniania</span>
            <span className="font-medium text-gray-900">OAuth2 / Email</span>
          </div>
        </div>
      </div>

      {user.role === 'admin' && (
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-bold text-lg text-purple-900 mb-2">Uprawnienia administratora</h3>
          <p className="text-purple-700 mb-4">
            Jako administrator masz dostęp do panelu zarządzania książkami i użytkownikami.
          </p>
          <button
            onClick={() => navigate('/admin')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Przejdź do panelu administratora
          </button>
        </div>
      )}
    </div>
  );
}
