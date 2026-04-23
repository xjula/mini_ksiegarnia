import { Outlet } from 'react-router';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Outlet />
      </main>
      <footer className="bg-gray-900 text-white mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            System księgarni internetowej - Python + FastAPI, PostgreSQL, RabbitMQ
          </p>
          <p className="text-xs text-gray-500 mt-2">
            OAuth2 Authentication • Asynchroniczne przetwarzanie • Integracja z systemami płatności
          </p>
        </div>
      </footer>
    </div>
  );
}
