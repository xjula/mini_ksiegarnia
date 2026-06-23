import { Link } from 'react-router';
import { Star, ShoppingCart } from 'lucide-react';
import { Book } from '../types';
import { useCart } from '../contexts/CartContext';
import { useTranslation } from 'react-i18next';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const { addItem } = useCart();
  const { t } = useTranslation();
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all border border-transparent dark:border-slate-800">
      <Link to={`/book/${book.id}`}>
        {book.zdjecie_url ? (
          <img 
            src={book.zdjecie_url} 
            alt={book.title} 
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <span className="text-6xl text-blue-600 opacity-20">📚</span>
          </div>
        )}
      </Link>
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
            {book.category}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            book.stock > 20 ? 'bg-green-100 text-green-700' :
            book.stock > 10 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {t('bookCard.available')}: {book.stock} {t('bookCard.pieces')}
          </span>
        </div>
        <Link to={`/book/${book.id}`}>
          <h3 className="font-bold text-lg mb-1 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">{book.title}</h3>
        </Link>
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">{book.author}</p>
        <p className="text-sm text-gray-700 dark:text-slate-300 mb-4 line-clamp-2">{book.description}</p>

        <div className="flex items-center gap-2 mb-4">
          {renderStars(book.rating)}
          <span className="text-sm text-gray-600 dark:text-slate-400">({book.reviewCount} {t('bookCard.reviews')})</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold text-2xl text-blue-600">{(book.price ?? 0).toFixed(2)} zł</span>
          <button
            onClick={() => addItem(book.id)}
            disabled={book.stock === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              book.stock === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {t('bookCard.addToCart')}
          </button>
        </div>
      </div>
    </div>
  );
}
