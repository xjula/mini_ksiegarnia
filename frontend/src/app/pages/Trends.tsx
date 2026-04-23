import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useBooks } from '../contexts/BooksContext';
import { BookCard } from '../components/BookCard';

export function Trends() {
  const { books } = useBooks();

  const trendingUp = books.filter(b => b.trend === 'up').sort((a, b) => b.reviewCount - a.reviewCount);
  const trendingDown = books.filter(b => b.trend === 'down');
  const stable = books.filter(b => b.trend === 'stable');
  const topRated = [...books].sort((a, b) => b.rating - a.rating).slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Analiza Trendów Popularności</h1>
        <p className="text-gray-600">
          Zobacz które książki zyskują na popularności i jakie są najwyżej oceniane
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-2xl text-gray-900">{trendingUp.length}</h3>
              <p className="text-sm text-gray-600">Rosnąca popularność</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Minus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-2xl text-gray-900">{stable.length}</h3>
              <p className="text-sm text-gray-600">Stabilne</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-2xl text-gray-900">{trendingDown.length}</h3>
              <p className="text-sm text-gray-600">Spadająca popularność</p>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-8 h-8 text-green-600" />
          <h2 className="font-bold text-2xl text-gray-900">
            Książki o rosnącej popularności
          </h2>
        </div>
        {trendingUp.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingUp.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Brak książek w tej kategorii</p>
        )}
      </section>

      <section className="mb-12">
        <h2 className="font-bold text-2xl text-gray-900 mb-6">
          Najwyżej oceniane książki
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topRated.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {trendingDown.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <TrendingDown className="w-8 h-8 text-red-600" />
            <h2 className="font-bold text-2xl text-gray-900">
              Spadająca popularność
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingDown.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
