import { useParams, useNavigate } from 'react-router';
import { Star, ShoppingCart, User, ArrowLeft } from 'lucide-react';
import { useBooks } from '../contexts/BooksContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

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

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Książka nie znaleziona</h1>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700"
          >
            Wróć do strony głównej
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

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    addReview({
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
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Powrót do katalogu
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg p-8 aspect-square flex items-center justify-center">
            <span className="text-9xl text-blue-600 opacity-30">📚</span>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full font-medium">
              {book.category}
            </span>
            <span className={`px-3 py-1 rounded-full font-medium ${
              book.stock > 20 ? 'bg-green-100 text-green-700' :
              book.stock > 10 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              W magazynie: {book.stock} szt.
            </span>
          </div>

          <h1 className="font-bold text-4xl text-gray-900 mb-2">{book.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{book.author}</p>

          <div className="flex items-center gap-3 mb-6">
            {renderStars(book.rating)}
            <span className="text-lg text-gray-600">
              {book.rating.toFixed(1)} ({book.reviewCount} recenzji)
            </span>
          </div>

          <p className="text-gray-700 text-lg mb-8">{book.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-6 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">ISBN</p>
              <p className="font-medium">{book.isbn}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Rok wydania</p>
              <p className="font-medium">{book.publishYear}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Wydawnictwo</p>
              <p className="font-medium">{book.publisher}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Trend</p>
              <p className="font-medium">
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
              Dodaj do koszyka
            </button>
          </div>
        </div>
      </div>

      <div className="border-t pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-2xl text-gray-900">
            Recenzje ({reviews.length})
          </h2>
          {user && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dodaj recenzję
            </button>
          )}
          {!user && (
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Zaloguj się, aby dodać recenzję
            </button>
          )}
        </div>

        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="font-bold text-lg mb-4">Twoja recenzja</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ocena
              </label>
              {renderStars(rating, true, setRating)}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Komentarz
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Podziel się swoją opinią o książce..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Opublikuj recenzję
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Anuluj
              </button>
            </div>
          </form>
        )}

        <div className="space-y-6">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="bg-white border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{review.userName}</p>
                    <p className="text-sm text-gray-500">{review.createdAt}</p>
                  </div>
                </div>
                <div className="mb-3">
                  {renderStars(review.rating)}
                </div>
                <p className="text-gray-700 italic">"{review.comment}"</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">
              Brak recenzji. Bądź pierwszą osobą, która doda recenzję!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
