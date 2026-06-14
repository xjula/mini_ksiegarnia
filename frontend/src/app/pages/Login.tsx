import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Mail } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const { login, register, loginWithGitHub } = useAuth(); 
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError('Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isRegister ? 'Rejestracja' : 'Logowanie'}
            </h1>
            <p className="text-gray-600">
              {isRegister
                ? 'Utwórz nowe konto w Księgarni Online'
                : 'Zaloguj się do swojego konta'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imię i nazwisko
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jan Kowalski"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="type"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="twoj@email.pl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasło
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Proszę czekać...' : isRegister ? 'Zarejestruj się' : 'Zaloguj się'}
            </button>
          </form>

          {/* --- INTEGRACJA SOCIAL MEDIA (OAuth2) --- */}
          <div className="mt-5">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase">Lub przez social media</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button 
              type="button"
              onClick={loginWithGitHub}
              className="w-full mt-3 bg-gray-900 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors font-bold shadow-md"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.0.069-.608.01 1.003.115 1.53 1.53 1.53a2.473 2.473 0 001.767.75c.069-1.289.587-2.167 1.16-2.665-2.222-.253-4.559-1.11-4.559-4.947 0-1.093.39-1.987 1.029-2.688-.103-.253-.446-1.27.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.691-4.566 4.94.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
              Zaloguj przez GitHub
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {isRegister
                ? 'Masz już konto? Zaloguj się'
                : 'Nie masz konta? Zarejestruj się'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600 text-center mb-3">
              Demo: użyj poniższych danych
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <p className="text-gray-700">
                <strong>Admin:</strong> admin@ksiegarnia.pl
              </p>
              <p className="text-gray-700">
                <strong>Użytkownik:</strong> dowolny email
              </p>
              <p className="text-gray-500 text-xs">
                Hasło może być dowolne (mockup danych)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}