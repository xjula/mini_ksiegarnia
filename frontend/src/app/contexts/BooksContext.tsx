import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Book, BookCreatePayload, Review } from '../types';
import { apiClient } from '../../api';

interface BooksContextType {
  books: Book[];
  reviews: Review[];
  loading: boolean;
  fetchBooks: () => Promise<void>;
  getBookById: (id: number) => Book | undefined;
  getReviewsByBookId: (bookId: number) => Review[];
  addBook: (book: BookCreatePayload) => Promise<void>;
  updateBook: (id: number, book: BookCreatePayload) => Promise<void>;
  deleteBook: (id: number) => Promise<void>;
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;
  fetchReviews: () => Promise<void>;
}

const BooksContext = createContext<BooksContextType | undefined>(undefined);

const mapApiBook = (b: any): Book => {
  const publishDate = b.publishDate ?? b.data_premiery ?? '';

  return {
    id: b.id,
    title: b.title ?? b.tytul ?? '',
    author: b.author ?? b.autor ?? '',
    description: b.description ?? b.opis ?? 'Brak opisu',
    publisher: b.publisher ?? b.wydawnictwo ?? 'Nieznane',
    language: b.language ?? b.jezyk_wydania ?? 'polski',
    edition: b.edition ?? b.numer_wydania ?? 1,
    publishDate,
    zdjecie_url: b.zdjecie_url ?? b.cover ?? b.okladka ?? '',
    cover: b.cover ?? b.okladka ?? b.zdjecie_url ?? '',
    price: Number(b.price ?? b.cena_jednostkowa ?? 0),
    stock: Number(b.stock ?? b.ilosc_sztuk ?? 0),
    categoryId: b.categoryId ?? b.kategoria_id,
    category: b.category ?? b.kategoria_nazwa ?? String(b.kategoria_id ?? ''),
    publishYear: publishDate ? new Date(publishDate).getFullYear() : undefined,
    rating: Number(b.rating ?? b.ocena ?? 5),
    reviewCount: Number(b.reviewCount ?? b.liczba_recenzji ?? 0),
    trend: b.trend ?? 'stable'
  };
};

export function BooksProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/ksiazki/');
      const mappedBooks = response.data
        .map(mapApiBook)
        .sort((a: Book, b: Book) => a.title.localeCompare(b.title));

      setBooks(mappedBooks);
    } catch (error) {
      console.error('Błąd podczas pobierania książek:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchReviews();
  }, []);

  const getBookById = (id: number) => {
    return books.find((book) => book.id === id);
  };

  const getReviewsByBookId = (bookId: number) => {
    return reviews.filter((review) => review.bookId === bookId);
  };

  const addBook = async (book: BookCreatePayload) => {
    await apiClient.post('/ksiazki/', book);
    await fetchBooks();
  };

  const updateBook = async (id: number, book: BookCreatePayload) => {
    await apiClient.put(`/ksiazki/${id}`, book);
    await fetchBooks();
  };

  const deleteBook = async (id: number) => {
    try {
      await apiClient.delete(`/ksiazki/${id}`);
    } finally {
      await fetchBooks();
    }
  };

  const fetchReviews = async () => {
    const response = await apiClient.get('/recenzje/');

    const mappedReviews: Review[] = response.data.map((r: any) => ({
      id: r.id,
      bookId: r.ksiazka_id,
      userId: r.uzytkownik_id,
      userName: `Użytkownik ${r.uzytkownik_id}`,
      rating: r.ocena,
      comment: r.komentarz,
      createdAt: r.data_dodania
    }));

    setReviews(mappedReviews);
  };

  const addReview = async (review: Omit<Review, 'id' | 'createdAt'>) => {
    const response = await apiClient.post('/recenzje/', {
      ocena: review.rating,
      komentarz: review.comment,
      uzytkownik_id: review.userId,
      ksiazka_id: review.bookId
    });

    await fetchReviews();
    await fetchBooks();

    const savedReview: Review = {
      ...review,
      id: response.data.id,
      createdAt: response.data.data_dodania
    };

    setReviews((prev) => [...prev, savedReview]);
  };

  return (
    <BooksContext.Provider
      value={{
        books,
        reviews,
        loading,
        fetchBooks,
        getBookById,
        getReviewsByBookId,
        addBook,
        updateBook,
        deleteBook,
        addReview
      }}
    >
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const context = useContext(BooksContext);
  if (context === undefined) {
    throw new Error('useBooks must be used within a BooksProvider');
  }
  return context;
}
