import { useState } from 'react';
import { useBooks } from '../contexts/BooksContext';
import { BookCard } from '../components/BookCard';

export function Home() {
  const { books } = useBooks();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['all', ...Array.from(new Set(books.map(b => b.category)))];

  const filteredBooks = books.filter(book => {
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl text-gray-900 mb-4">Witaj w Księgarni Online</h1>
        <p className="text-gray-600">
          Odkryj bogaty katalog książek - od klasyki po współczesną literaturę
        </p>
      </div>

      <div className="mb-8">
        <input
          type="text"
          placeholder="Szukaj książek po tytule lub autorze..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="mb-8">
        <h2 className="font-bold text-xl text-gray-900 mb-4">Kategorie</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category === 'all' ? 'Wszystkie' : category}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="font-bold text-2xl text-gray-900 mb-6">
          Katalog Książek ({filteredBooks.length})
        </h2>
      </div>

      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">Nie znaleziono książek spełniających kryteria</p>
        </div>
      )}
    </div>
  );
}
