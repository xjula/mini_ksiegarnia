import { Outlet } from 'react-router';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <Header />
      
      <main className="flex-grow">
        <Outlet />
      </main>
      
      <footer className="bg-gray-900 text-white dark:bg-slate-900 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            System księgarni internetowej 
          </p>
         
        </div>
      </footer>
    </div>
  );
}