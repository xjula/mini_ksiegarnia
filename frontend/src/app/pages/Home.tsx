import { useState } from 'react';
import { useBooks } from '../contexts/BooksContext';
import { BookCard } from '../components/BookCard';
import { useTranslation } from 'react-i18next';

export function Home() {
  const { books } = useBooks();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { t } = useTranslation();

  const categories = ['all', ...Array.from(new Set(books.map(b => b.category)))];

  const filteredBooks = books.filter(book => {
    const bookCategory = book.category || ''; 
    const matchesCategory = selectedCategory === 'all' || bookCategory === selectedCategory;

    const bookTitle = book.title || '';
    const bookAuthor = book.author || '';
    
    const matchesSearch = bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookAuthor.toLowerCase().includes(searchQuery.toLowerCase());
                         
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl text-gray-900 dark:text-white dark:text-white mb-4">{t('homePage.welcome')}</h1>
        <p className="text-gray-600 dark:text-slate-300 dark:text-slate-300">
          {t('homePage.description')}
        </p>
      </div>

      <div className="mb-8">
        <input
          type="text"
          placeholder={t('homePage.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:bg-slate-900 text-gray-900 dark:text-white dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="mb-8">
        <h2 className="font-bold text-xl text-gray-900 dark:text-white dark:text-white mb-4">{t('homePage.categories')}</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-gray-700 hover::bg-white dark:bg-slate-800 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              {category === 'all' ? t('homePage.allCategories') : category}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="font-bold text-xl text-gray-900 dark:text-white dark:text-white mb-4">
          {t('homePage.catalog')} ({filteredBooks.length})
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
          <p className="text-gray-600 dark:text-slate-300 dark:text-slate-300">{t('homePage.noResults')}</p>
        </div>
      )}
    </div>
  );
}
