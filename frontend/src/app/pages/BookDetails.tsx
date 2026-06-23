import { useParams, useNavigate } from 'react-router';
import { Star, ShoppingCart, User, ArrowLeft } from 'lucide-react';
import { useBooks } from '../contexts/BooksContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBookById, getReviewsByBookId, addReview } = useBooks();
  const { addItem } = useCart();
  const { user } = useAuth();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const book = getBookById(Number(id));
  const reviews = getReviewsByBookId(Number(id));
  const { t } = useTranslation();

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('book.notFound')}</h1>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            {t('book.backToCatalog')}
          </button>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onRate?.(star)}
          />
        ))}
      </div>
    );
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    await addReview({
      bookId: book.id,
      userId: user.id,
      userName: user.name,
      rating,
      comment
    });

    setComment('');
    setRating(5);
    setShowReviewForm(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('book.backToCatalog')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-1">
          {book.zdjecie_url ? (
            <img 
              src={book.zdjecie_url} 
              alt={book.title} 
              className="w-full max-w-sm mx-auto h-auto object-contain rounded-lg shadow-xl"
            />
          ) : (
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg p-8 aspect-square flex items-center justify-center shadow-lg">
              <span className="text-9xl text-blue-600 opacity-30">📚</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full font-medium dark:text-white">
              {book.category}
            </span>
            <span className={`px-3 py-1 rounded-full font-medium dark:text-white ${
              book.stock > 20 ? 'bg-green-100 text-green-700' :
              book.stock > 10 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {t('book.inStock')}: {book.stock} {t('book.pieces')}
            </span>
          </div>

          <h1 className="font-bold text-4xl text-gray-900 dark:text-white mb-2">{book.title}</h1>
          <p className="text-xl text-gray-600 dark:text-slate-400 mb-6">{book.author}</p>

          <div className="flex items-center gap-3 mb-6">
            {renderStars(book.rating)}
            <span className="text-lg text-gray-600 dark:text-slate-400">
              {book.rating.toFixed(1)} ({book.reviewCount} {t('book.reviews')})
            </span>
          </div>

          <p className="text-gray-700 dark:text-slate-300 text-lg mb-8">{book.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 dark:bg-slate-800 p-6 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">{t('book.publishYear')}</p>
              <p className="font-medium dark:text-white">{book.publishYear}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">{t('book.publisher')}</p>
              <p className="font-medium dark:text-white">{book.publisher}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">{t('book.trend')}</p>
              <p className="font-medium dark:text-white">
                {book.trend === 'up' ? '📈 Rosnący' :
                 book.trend === 'down' ? '📉 Spadający' : '➡️ Stabilny'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-blue-600">{book.price.toFixed(2)} zł</div>
            <button
              onClick={() => addItem(book.id)}
              disabled={book.stock === 0}
              className={`px-8 py-4 rounded-lg font-bold text-lg flex items-center gap-3 transition-all ${
                book.stock === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              <ShoppingCart className="w-6 h-6" />
              {t('book.addToCart')}
            </button>
          </div>
        </div>
      </div>

      <div className="border-t dark:border-slate-700 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-2xl text-gray-900 dark:text-white">
            {t('book.reviews')} ({reviews.length})
          </h2>
          {user && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('book.addReview')}
            </button>
          )}
          {!user && (
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('book.loginToReview')}
            </button>
          )}
        </div>

        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="bg-gray-50 dark:bg-slate-800 p-6 rounded-lg mb-8">
            <h3 className="font-bold text-lg dark:text-white mb-4">{t('book.yourReview')}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium dark:text-white text-gray-700 mb-2">
                {t('book.rating')}
              </label>
              {renderStars(rating, true, setRating)}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium dark:text-white text-gray-700 mb-2">
                {t('book.comment')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Podziel się swoją opinią o książce..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('book.publishReview')}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-6">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-white text-gray-900">{review.userName}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                    {review.createdAt 
                      ? new Date(review.createdAt).toLocaleDateString('pl-PL', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })
                      : ''}
                  </p>
                  </div>
                </div>
                <div className="mb-3">
                  {renderStars(review.rating)}
                </div>
                <p className="text-gray-700 dark:text-slate-300 italic">"{review.comment}"</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-slate-400 py-8">
              {t('book.noReviews')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
