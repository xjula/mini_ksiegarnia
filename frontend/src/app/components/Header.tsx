import { Link } from 'react-router';
import { ShoppingCart, User, LogOut, Home, TrendingUp, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useTranslation } from 'react-i18next';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const [darkMode, setDarkMode] = useState(
  localStorage.getItem('theme') === 'dark'
);

useEffect(() => {
  if (darkMode) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}, [darkMode]);
  const { t, i18n } = useTranslation();

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <h1 className="font-bold text-xl text-gray-900 dark:text-white">Księgarnia Online</h1>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>{t('home')}</span>
            </Link>
            <Link
              to="/trends"
              className="flex items-center gap-2 text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <TrendingUp className="w-5 h-5" />
              <span>{t('trends')}</span>
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>{t('admin_panel')}</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>{user.name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>{t('logout')}</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <User className="w-5 h-5" />
                <span>{t('login')}</span>
              </Link>
            )}
            <Link
              to="/cart"
              className="relative flex items-center gap-2 text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>{t('cart.title')}</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={() =>
                i18n.changeLanguage(
                  i18n.language === 'pl' ? 'en' : 'pl'
                )
              }
              className="text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400"
            >
              🌍 {i18n.language.toUpperCase()}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-2 text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{darkMode ? t('light_mode') : t('dark_mode')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
